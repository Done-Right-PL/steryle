import { createHash, randomInt } from 'node:crypto'
import { DeleteCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { doc, tableName } from './client'
import { keys } from './keys'

const OTP_TTL_SECONDS = 5 * 60
const MAX_ATTEMPTS = 5

function hashOtp(phone: string, otp: string) {
  return createHash('sha256').update(`${phone}:${otp}`).digest('hex')
}

export function generateOtp(): string {
  return String(randomInt(100000, 1000000))
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

export function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone)
}

export async function saveOtp(phone: string, otp: string): Promise<{ expiresAt: number }> {
  const expiresAt = Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS
  await doc.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        ...keys.otp(phone),
        entity: 'otp',
        phone,
        otpHash: hashOtp(phone, otp),
        attempts: 0,
        expiresAt,
      },
    }),
  )
  return { expiresAt }
}

export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await doc.send(
    new GetCommand({ TableName: tableName(), Key: keys.otp(phone) }),
  )
  const item = res.Item as
    | { otpHash?: string; attempts?: number; expiresAt?: number }
    | undefined

  if (!item?.otpHash) {
    return { ok: false, error: 'No active code for this number. Request a new OTP.' }
  }
  if ((item.expiresAt ?? 0) < Math.floor(Date.now() / 1000)) {
    await clearOtp(phone)
    return { ok: false, error: 'That code has expired. Request a new OTP.' }
  }
  if ((item.attempts ?? 0) >= MAX_ATTEMPTS) {
    await clearOtp(phone)
    return { ok: false, error: 'Too many attempts. Request a new OTP.' }
  }
  if (item.otpHash !== hashOtp(phone, otp.trim())) {
    await doc.send(
      new UpdateCommand({
        TableName: tableName(),
        Key: keys.otp(phone),
        UpdateExpression: 'SET attempts = if_not_exists(attempts, :z) + :one',
        ExpressionAttributeValues: { ':z': 0, ':one': 1 },
      }),
    )
    return { ok: false, error: 'Incorrect code. Please try again.' }
  }

  await clearOtp(phone)
  return { ok: true }
}

export async function clearOtp(phone: string): Promise<void> {
  await doc.send(new DeleteCommand({ TableName: tableName(), Key: keys.otp(phone) }))
}
