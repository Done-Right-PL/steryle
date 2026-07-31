/**
 * Database client.
 *
 * Two things drive the shape of this module:
 *
 * 1. Connection is lazy. Next.js collects page metadata during `next build`,
 *    where `DATABASE_URL` is often absent (Amplify injects it at runtime).
 *    Connecting on import would fail the build, so the pool is created on
 *    first query instead.
 * 2. The pool is cached on `globalThis`. Dev-server hot reloads re-evaluate
 *    modules, which would otherwise leak a pool per reload until Postgres
 *    starts refusing connections.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function connectionString(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres instance.',
    )
  }
  return url
}

const globalForDb = globalThis as unknown as {
  __stryleSql?: ReturnType<typeof postgres>
  __stryleDb?: ReturnType<typeof drizzle<typeof schema>>
}

export function getSql() {
  if (!globalForDb.__stryleSql) {
    globalForDb.__stryleSql = postgres(connectionString(), {
      // Serverless targets (Amplify/Lambda) should each hold few connections.
      max: process.env.NODE_ENV === 'production' ? 5 : 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }
  return globalForDb.__stryleSql
}

export function getDb() {
  if (!globalForDb.__stryleDb) {
    globalForDb.__stryleDb = drizzle(getSql(), { schema })
  }
  return globalForDb.__stryleDb
}

export type Database = ReturnType<typeof getDb>

/**
 * Ergonomic handle so callers can write `db.select()` instead of `getDb().select()`.
 * Every property access resolves through `getDb()`, preserving the lazy connect.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

export { schema }
