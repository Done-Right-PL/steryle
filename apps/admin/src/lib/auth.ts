import 'server-only'

/**
 * Session handling for the admin portal.
 *
 * Sessions are opaque random tokens kept in an httpOnly cookie; DynamoDB stores
 * only their SHA-256 digest (with TTL), so reading the table gives an attacker
 * nothing usable.
 */
import { createHash, randomBytes } from 'node:crypto'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  deleteSession,
  getAdminByEmail,
  getAdminById,
  getSession,
  hashPassword,
  putSession,
  touchAdminLogin,
  verifyPassword,
  type AdminRole,
} from '@steryle/db'

const COOKIE_NAME = 'steryle_admin_session'
const SESSION_TTL_DAYS = 7
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000

export type SessionUser = {
  id: string
  email: string
  name: string
  role: AdminRole
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

let dummyHash: Promise<string> | undefined
const getDummyHash = () => (dummyHash ??= hashPassword(randomBytes(32).toString('base64url')))

export type SignInResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string }

export async function signIn(
  email: string,
  password: string,
  userAgent?: string,
): Promise<SignInResult> {
  const normalised = email.trim().toLowerCase()
  const user = await getAdminByEmail(normalised)
  const hash = user?.passwordHash ?? (await getDummyHash())
  const passwordOk = await verifyPassword(password, hash)

  if (!user || !passwordOk || !user.isActive) {
    return { ok: false, error: 'Those credentials do not match an active admin account.' }
  }

  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await putSession({
    tokenHash: sha256(token),
    adminUserId: user.id,
    expiresAt,
    userAgent,
  })
  await touchAdminLogin(user.id)

  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })

  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }
}

export async function signOut(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (token) await deleteSession(sha256(token))
  jar.delete(COOKIE_NAME)
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null

  const session = await getSession(sha256(token))
  if (!session || session.expiresAt.getTime() <= Date.now()) return null

  const user = await getAdminById(session.adminUserId)
  if (!user || !user.isActive) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role }
})

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

const RANK: Record<AdminRole, number> = { viewer: 0, admin: 1, owner: 2 }

export const can = {
  write: (user: SessionUser) => RANK[user.role] >= RANK.admin,
  destroy: (user: SessionUser) => RANK[user.role] >= RANK.owner,
}

export async function requireWriter(): Promise<SessionUser> {
  const user = await requireUser()
  if (!can.write(user)) {
    throw new Error('Your role does not permit this change.')
  }
  return user
}

export async function requireOwner(): Promise<SessionUser> {
  const user = await requireUser()
  if (!can.destroy(user)) {
    throw new Error('Only an owner can perform this action.')
  }
  return user
}
