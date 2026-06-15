import { Link } from 'react-router-dom'
import { categories } from '../data/catalog'
import { Icon } from './Icons'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
              <Icon.plus width={20} height={20} />
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              Stry<span className="text-brand-600">le</span>
            </span>
          </Link>
          <p className="mt-3 text-sm text-slate-500">
            Stryle is your trusted online store for surgical instruments, medical
            disposables, PPE and hospital supplies — delivered across India.
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2"><Icon.phone width={16} height={16} className="text-brand-600" /> 1800-123-456</p>
            <p className="flex items-center gap-2"><Icon.mail width={16} height={16} className="text-brand-600" /> care@stryle.example</p>
            <p className="flex items-center gap-2"><Icon.pin width={16} height={16} className="text-brand-600" /> Sector 62, Noida, UP 201301</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900">Shop by category</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`} className="hover:text-brand-700">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900">Customer service</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {['Track your order', 'Shipping & delivery', 'Returns & refunds', 'Bulk / hospital orders', 'GST & invoicing', 'Contact us'].map((x) => (
              <li key={x}><Link to="/account" className="hover:text-brand-700">{x}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900">Stay updated</h4>
          <p className="mt-3 text-sm text-slate-500">
            Get restock alerts and offers on medical supplies.
          </p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input className="input" placeholder="Email address" type="email" />
            <button className="btn-primary shrink-0">Join</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded border border-slate-200 px-2 py-1">UPI</span>
            <span className="rounded border border-slate-200 px-2 py-1">Visa</span>
            <span className="rounded border border-slate-200 px-2 py-1">Mastercard</span>
            <span className="rounded border border-slate-200 px-2 py-1">Net Banking</span>
            <span className="rounded border border-slate-200 px-2 py-1">COD</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Stryle — a demo storefront. Not affiliated with any real company.</p>
          <div className="flex gap-4">
            <Link to="/account" className="hover:text-brand-700">Privacy</Link>
            <Link to="/account" className="hover:text-brand-700">Terms</Link>
            <Link to="/account" className="hover:text-brand-700">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
