import Link from 'next/link'
import { categories, products, topBrands } from '@steryle/core'
import { Icon } from './Icons'

const SUPPORT_LINKS = [
  'Track your order',
  'Shipping & delivery',
  'Returns & refunds',
  'Bulk / hospital orders',
  'GST & invoicing',
  'Contact us',
]

const PAYMENT_METHODS = ['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net banking']

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-paper-200 bg-white">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
              <Icon.plus width={20} height={20} />
            </span>
            <span className="text-lg font-extrabold text-ink-900">
              Ster<span className="text-brand-600">yle</span>
            </span>
          </Link>
          <p className="mt-3 text-sm text-ink-500">
            {products.length.toLocaleString('en-IN')} genuine surgical and medical supplies from{' '}
            {topBrands.length}+ trusted brands, sourced direct and delivered across India.
          </p>
          <div className="mt-4 space-y-2 text-sm text-ink-600">
            <a href="tel:+917822058149" className="flex items-center gap-2 hover:text-brand-700">
              <Icon.phone width={16} height={16} className="text-brand-600" /> 7822058149
            </a>
            <a href="mailto:support@steryle.in" className="flex items-center gap-2 hover:text-brand-700">
              <Icon.mail width={16} height={16} className="text-brand-600" /> support@steryle.in
            </a>
            <p className="flex items-center gap-2">
              <Icon.pin width={16} height={16} className="text-brand-600" /> Tathawade, Pune, MH
              411033
            </p>
          </div>
        </div>

        <FooterColumn title="Shop by category">
          {categories.slice(0, 6).map((c) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} className="hover:text-brand-700">
                {c.name}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Customer service">
          {SUPPORT_LINKS.map((label) => (
            <li key={label}>
              <Link href="/account" className="hover:text-brand-700">
                {label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <div>
          <h4 className="text-sm font-bold text-ink-900">Top brands</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            {topBrands.slice(0, 6).map((brand) => (
              <li key={brand}>
                <Link
                  href={`/search?q=${encodeURIComponent(brand)}`}
                  className="hover:text-brand-700"
                >
                  {brand}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-ink-500">
            {PAYMENT_METHODS.map((method) => (
              <span key={method} className="rounded border border-paper-200 px-2 py-1">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-paper-200">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Steryle. Demo storefront — not a real pharmacy.</p>
          <p>Prices inclusive of GST.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-ink-900">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-ink-600">{children}</ul>
    </div>
  )
}
