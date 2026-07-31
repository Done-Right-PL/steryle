import 'server-only'

/**
 * Session handling for the admin portal.
 *
 * Sessions are opaque random tokens kept in a signed-by-nothing httpOnly
 * cookie; the database stores only their SHA-256 digest, so reading the
 * `admin_sessions` table gives an attacker nothing usable. There is no JWT
 * here on purpose — revocation matters more than statelessness for an admin
 * tool with a handful of users.
 */
import { createHash, randomBytes } from 'node:crypto'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, eq, gt, lt } from 'drizzle-orm'
import {
  adminSessions,
  adminUsers,
  db,
  hashPassword,
  verifyPassword,
  type AdminRole,
} from '@stryle/db'

const COOKIE_NAME = 'stryle_admin_session'
const SESSION_TTL_DAYS = 7
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000

export type SessionUser = {
  id: string
  email: string
  name: string
  role: AdminRole
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

/**
 * A real scrypt digest of an unguessable value, hashed once and reused. Login
 * attempts for addresses that do not exist are verified against this so a
 * failed lookup costs the same time as a wrong password, and the response
 * cannot be used to enumerate admin accounts.
 */
let dummyHash: Promise<string> | undefined
const getDummyHash = () => (dummyHash ??= hashPassword(randomBytes(32).toString('base64url')))

/* -------------------------------------------------------------------------- */
/* Sign in / sign out                                                         */
/* -------------------------------------------------------------------------- */

export type SignInResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string }

export async function signIn(
  email: string,
  password: string,
  userAgent?: string,
): Promise<SignInResult> {
  const normalised = email.trim().toLowerCase()

  const user = await db.query.adminUsers.findFirst({
    where: (u, { sql }) => sql`lower(${u.email}) = ${normalised}`,
  })

  const hash = user?.passwordHash ?? (await getDummyHash())
  const passwordOk = await verifyPassword(password, hash)

  if (!user || !passwordOk || !user.isActive) {
    return { ok: false, error: 'Those credentials do not match an active admin account.' }
  }

  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await db.insert(adminSessions).values({
    tokenHash: sha256(token),
    adminUserId: user.id,
    expiresAt,
    userAgent: userAgent?.slice(0, 400),
  })

  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id))

  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })

  // Opportunistically clear this user's expired sessions so the table stays small.
  await db
    .delete(adminSessions)
    .where(and(eq(adminSessions.adminUserId, user.id), lt(adminSessions.expiresAt, new Date())))

  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }
}

export async function signOut(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, sha256(token)))
  }
  jar.delete(COOKIE_NAME)
}

/* -------------------------------------------------------------------------- */
/* Reading the current session                                                */
/* -------------------------------------------------------------------------- */

/**
 * Cached per request so a layout and its nested pages share one lookup.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null

  const [row] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.adminUserId))
    .where(and(eq(adminSessions.tokenHash, sha256(token)), gt(adminSessions.expiresAt, new Date())))
    .limit(1)

  if (!row || !row.isActive) return null
  return { id: row.id, email: row.email, name: row.name, role: row.role }
})

/** Redirects to the login page when there is no valid session. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

/* -------------------------------------------------------------------------- */
/* Authorisation                                                              */
/* -------------------------------------------------------------------------- */

const RANK: Record<AdminRole, number> = { viewer: 0, admin: 1, owner: 2 }

export const can = {
  /** Editing prices, visibility and notification content. */
  write: (user: SessionUser) => RANK[user.role] >= RANK.admin,
  /** Archiving products and managing other admins. */
  destroy: (user: SessionUser) => RANK[user.role] >= RANK.owner,
}

/**
 * Guard for server actions. Every mutation calls this, so a viewer who forges
 * a request still cannot write — the disabled buttons in the UI are a
 * convenience, not the control.
 */
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
