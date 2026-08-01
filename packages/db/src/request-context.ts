import { AsyncLocalStorage } from 'node:async_hooks'

export type CookieOpts = {
  httpOnly?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  path?: string
  maxAge?: number
  secure?: boolean
}

type CookieSet = { name: string; value: string; opts: CookieOpts }
type CookieDelete = { name: string; delete: true; opts?: CookieOpts }

export type RequestStore = {
  cookies: Map<string, string>
  mutations: Array<CookieSet | CookieDelete>
}

export const requestContext = new AsyncLocalStorage<RequestStore>()

export function parseCookieHeader(header: string | null | undefined): Map<string, string> {
  const map = new Map<string, string>()
  if (!header) return map
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx <= 0) continue
    const name = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (name) map.set(name, decodeURIComponent(value))
  }
  return map
}

function serializeCookie(name: string, value: string, opts: CookieOpts = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  parts.push(`Path=${opts.path ?? '/'}`)
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`)
  if (opts.httpOnly) parts.push('HttpOnly')
  if (opts.secure) parts.push('Secure')
  if (opts.sameSite) {
    const ss =
      opts.sameSite === 'lax' ? 'Lax' : opts.sameSite === 'strict' ? 'Strict' : 'None'
    parts.push(`SameSite=${ss}`)
  }
  return parts.join('; ')
}

export function getRequestStore(): RequestStore {
  const store = requestContext.getStore()
  if (!store) {
    throw new Error('No request context. API handlers must run inside withRequestContext().')
  }
  return store
}

export function cookieGet(name: string): string | undefined {
  return getRequestStore().cookies.get(name)
}

export function cookieSet(name: string, value: string, opts: CookieOpts = {}) {
  const store = getRequestStore()
  store.cookies.set(name, value)
  store.mutations.push({ name, value, opts })
}

export function cookieDelete(name: string, opts: CookieOpts = {}) {
  const store = getRequestStore()
  store.cookies.delete(name)
  store.mutations.push({ name, delete: true, opts })
}

export function applyCookieMutations(response: Response): Response {
  const store = requestContext.getStore()
  if (!store || store.mutations.length === 0) return response

  const headers = new Headers(response.headers)
  for (const m of store.mutations) {
    if ('delete' in m && m.delete) {
      headers.append(
        'Set-Cookie',
        serializeCookie(m.name, '', { ...m.opts, maxAge: 0, path: m.opts?.path ?? '/' }),
      )
    } else if ('value' in m) {
      headers.append('Set-Cookie', serializeCookie(m.name, m.value, m.opts))
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export async function withRequestContext<T>(
  cookieHeader: string | null | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const store: RequestStore = {
    cookies: parseCookieHeader(cookieHeader),
    mutations: [],
  }
  return requestContext.run(store, fn)
}
