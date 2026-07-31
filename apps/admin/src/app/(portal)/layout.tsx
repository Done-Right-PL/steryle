import Link from 'next/link'
import { SidebarNav } from '@/components/SidebarNav'
import { requireUser } from '@/lib/auth'
import { signOutAction } from './actions'

const ROLE_BLURB: Record<string, string> = {
  owner: 'Full access',
  admin: 'Can edit',
  viewer: 'Read only',
}

/**
 * Every page under this layout is behind `requireUser()`. Middleware already
 * bounced anyone without a session cookie, but this is the check that actually
 * validates it against the database.
 */
export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser()

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-paper-200 bg-paper px-5 py-6 lg:flex">
        <Link href="/" className="block">
          <p className="text-lg font-semibold tracking-tight text-ink">Stryle</p>
          <p className="label mt-0.5">Operations</p>
        </Link>

        <div className="mt-8 flex-1">
          <SidebarNav />
        </div>

        <div className="border-t border-paper-200 pt-4">
          <p className="truncate text-[13px] font-medium text-ink">{user.name}</p>
          <p className="truncate text-[11px] text-ink-400">{user.email}</p>
          <p className="label mt-1">{ROLE_BLURB[user.role] ?? user.role}</p>

          <form action={signOutAction} className="mt-3">
            <button type="submit" className="btn-quiet w-full">
              Sign out
            </button>
          </form>

          <a
            href="https://stryle.in"
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-center text-[11px] text-ink-300 hover:text-ink"
          >
            View storefront ↗
          </a>
        </div>
      </aside>

      {/* Compact header stands in for the sidebar below the lg breakpoint. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-paper-200 bg-paper px-5 py-3 lg:hidden">
          <Link href="/" className="text-base font-semibold tracking-tight text-ink">
            Stryle Operations
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="btn-quiet">
              Sign out
            </button>
          </form>
        </header>
        <div className="border-b border-paper-200 bg-paper px-5 py-2 lg:hidden">
          <SidebarNav />
        </div>

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  )
}
