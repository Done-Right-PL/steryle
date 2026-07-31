/**
 * Password hashing for admin accounts.
 *
 * Uses scrypt from Node's standard library rather than bcrypt/argon2 so the
 * monorepo stays free of native build steps — those break Amplify's build
 * image and Turbo's cache portability. scrypt is memory-hard and a fine
 * choice here; the cost parameters are encoded in the digest so they can be
 * raised later without invalidating existing hashes.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb)

const COST = { N: 16384, r: 8, p: 1 } as const
const KEY_LENGTH = 64

/** Encoded as `scrypt$N$r$p$salt$hash`, both binary parts base64. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = (await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, {
    ...COST,
    // scrypt needs headroom above the default 32 MB limit at N=16384, r=8.
    maxmem: 64 * 1024 * 1024,
  })) as Buffer
  return [
    'scrypt',
    COST.N,
    COST.r,
    COST.p,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts
  const N = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)
  if (!N || !r || !p || !saltRaw || !hashRaw) return false

  const expected = Buffer.from(hashRaw, 'base64')
  const derived = (await scrypt(password.normalize('NFKC'), Buffer.from(saltRaw, 'base64'), expected.length, {
    N,
    r,
    p,
    maxmem: 256 * 1024 * 1024,
  })) as Buffer

  // Lengths must match before timingSafeEqual, which throws on a mismatch.
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}
