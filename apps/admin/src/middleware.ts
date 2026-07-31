import { NextResponse, type NextRequest } from 'next/server'

/**
 * A cheap first gate only.
 *
 * Middleware runs on the edge runtime, where neither `node:crypto` nor a
 * Postgres connection is available, so it cannot validate a session — it just
 * checks whether a session cookie is present at all. Every protected page and
 * every server action independently calls `requireUser()` / `requireWriter()`,
 * which is where authorisation is actually enforced. Forging the cookie here
 * buys nothing but a redirect back to /login.
 */
const COOKIE_NAME = 'steryle_admin_session'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasCookie = request.cookies.has(COOKIE_NAME)
  const isLogin = pathname === '/login'

  if (!hasCookie && !isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preserve where they were headed so login can send them back.
    url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  if (hasCookie && isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)'],
}
