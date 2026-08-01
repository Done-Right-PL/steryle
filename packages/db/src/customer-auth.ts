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
const REG_TICKET_TTL_SECONDS = 15 * 60

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

/** After OTP succeeds for a new phone — ticket proves they can finish registration. */
export async function createPhoneRegistrationTicket(phone: string): Promise<string> {
  const token = randomBytes(24).toString('base64url')
  const tokenHash = sha256(token)
  const expiresAt = Math.floor(Date.now() / 1000) + REG_TICKET_TTL_SECONDS
  await doc.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        ...keys.phoneRegTicket(tokenHash),
        entity: 'phone_reg_ticket',
        tokenHash,
        phone,
        expiresAt,
        createdAt: nowIso(),
      },
    }),
  )
  return token
}

export async function consumePhoneRegistrationTicket(
  phone: string,
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token) return { ok: false, error: 'Registration session expired. Verify OTP again.' }
  const tokenHash = sha256(token)
  const key = keys.phoneRegTicket(tokenHash)
  const res = await doc.send(new GetCommand({ TableName: tableName(), Key: key }))
  const item = res.Item as { phone?: string; expiresAt?: number } | undefined
  if (!item?.phone) {
    return { ok: false, error: 'Registration session expired. Verify OTP again.' }
  }
  if ((item.expiresAt ?? 0) < Math.floor(Date.now() / 1000)) {
    await doc.send(new DeleteCommand({ TableName: tableName(), Key: key }))
    return { ok: false, error: 'Registration session expired. Verify OTP again.' }
  }
  if (String(item.phone) !== phone) {
    return { ok: false, error: 'Phone number does not match this registration.' }
  }
  await doc.send(new DeleteCommand({ TableName: tableName(), Key: key }))
  return { ok: true }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Indian GSTIN — 15 chars. */
export function isValidGstin(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(gstin)
}

/** Touch last-seen for returning customers. */
export async function touchCustomerByPhone(phone: string): Promise<CustomerRow | null> {
  const existing = await getCustomerByPhone(phone)
  if (!existing) return null
  await putCustomer({
    ...existing,
    lastSeenAt: new Date(),
  })
  return (await getCustomerById(existing.id)) ?? existing
}

/** First-time registration after OTP — name, mobile, email; optional GST invoice fields. */
export async function registerCustomer(input: {
  phone: string
  name: string
  email: string
  gstin?: string | null
  gstCompanyName?: string | null
}): Promise<CustomerRow> {
  const existing = await getCustomerByPhone(input.phone)
  if (existing) return existing

  const gstin = input.gstin?.trim().toUpperCase() || null
  const gstCompanyName = input.gstCompanyName?.trim() || null

  return putCustomer({
    id: createId(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    city: null,
    state: null,
    gstin,
    gstCompanyName,
    status: 'active',
    marketingOptIn: true,
    lastSeenAt: new Date(),
  })
}
