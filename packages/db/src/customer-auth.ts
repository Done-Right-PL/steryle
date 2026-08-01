import { createHash, randomBytes } from 'node:crypto'
import { DeleteCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { createId, doc, nowIso, tableName } from './client'
import { cookieDelete, cookieGet, cookieSet } from './request-context'
import { getCustomerById, getCustomerByPhone, putCustomer } from './customers'
import { keys } from './keys'
import type { CustomerRow, DynItem } from './types'

export const CUSTOMER_COOKIE = 'steryle_customer_session'
const SESSION_TTL_DAYS = 30
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}

export async function createCustomerSession(customerId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
  await doc.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        ...keys.customerSession(tokenHash),
        entity: 'customer_session',
        tokenHash,
        customerId,
        expiresAtIso: expiresAt.toISOString(),
        expiresAt: Math.floor(expiresAt.getTime() / 1000),
        createdAt: nowIso(),
      },
    }),
  )
  cookieSet(CUSTOMER_COOKIE, token, cookieOpts())
  return token
}

export async function clearCustomerSession(): Promise<void> {
  const token = cookieGet(CUSTOMER_COOKIE)
  if (token) {
    await doc.send(
      new DeleteCommand({
        TableName: tableName(),
        Key: keys.customerSession(sha256(token)),
      }),
    )
  }
  cookieDelete(CUSTOMER_COOKIE, { path: '/' })
}

export async function getSessionCustomer(): Promise<CustomerRow | null> {
  const token = cookieGet(CUSTOMER_COOKIE)
  if (!token) return null
  const res = await doc.send(
    new GetCommand({
      TableName: tableName(),
      Key: keys.customerSession(sha256(token)),
    }),
  )
  const item = res.Item as DynItem | undefined
  if (!item?.customerId) return null
  const expiresMs = item.expiresAtIso
    ? new Date(String(item.expiresAtIso)).getTime()
    : Number(item.expiresAt) * 1000
  if (!expiresMs || expiresMs <= Date.now()) return null
  const customer = await getCustomerById(String(item.customerId))
  if (!customer || customer.status === 'blocked') return null
  return customer
}

/** Find or create a customer for this phone (register-on-first-login). */
export async function upsertCustomerByPhone(phone: string, name?: string): Promise<CustomerRow> {
  const existing = await getCustomerByPhone(phone)
  if (existing) {
    await putCustomer({
      ...existing,
      lastSeenAt: new Date(),
      name: name?.trim() || existing.name,
    })
    return (await getCustomerById(existing.id)) ?? existing
  }

  return putCustomer({
    id: createId(),
    name: name?.trim() || `Customer ${phone.slice(-4)}`,
    email: null,
    phone,
    city: null,
    state: null,
    gstin: null,
    status: 'active',
    marketingOptIn: true,
    lastSeenAt: new Date(),
  })
}
