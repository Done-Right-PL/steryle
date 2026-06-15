import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { categories } from '../data/catalog'
import { useCart } from '../context/CartContext'
import { Icon, CategoryIcon } from './Icons'

export default function Header() {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const { count } = useCart()
  const navigate = useNavigate()

  const submitSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      {/* Top utility bar */}
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-x flex h-9 items-center justify-between text-xs">
          <span className="hidden items-center gap-2 sm:flex">
            <Icon.truck width={15} height={15} /> Free shipping on orders over ₹999
          </span>
          <div className="flex items-center gap-4">
            <a href="tel:+911800123456" className="flex items-center gap-1.5 hover:underline">
              <Icon.phone width={14} height={14} /> 1800-123-456
            </a>
            <span className="hidden sm:inline">GST invoice on all orders</span>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="container-x flex h-16 items-center gap-4">
        <button
          className="btn-ghost -ml-2 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <Icon.close /> : <Icon.menu />}
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
            <Icon.plus width={20} height={20} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Stry<span className="text-brand-600">le</span>
          </span>
        </Link>

        <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
          <Icon.search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-10"
            placeholder="Search instruments, sutures, gloves, SKU…"
          />
        </form>

        <div className="ml-auto flex items-center gap-1">
          <NavLink to="/account" className="btn-ghost hidden sm:inline-flex">
            <Icon.user width={20} height={20} />
            <span className="hidden lg:inline">Account</span>
          </NavLink>
          <NavLink to="/cart" className="btn-ghost relative">
            <Icon.cart width={20} height={20} />
            <span className="hidden lg:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </NavLink>
        </div>
      </div>

      {/* Category nav */}
      <nav className="border-t border-slate-100 bg-white">
        <div className="container-x flex h-11 items-center gap-1 overflow-x-auto">
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <Link
              to="/categories"
              className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              <Icon.menu width={16} height={16} /> All Categories
            </Link>
            {catOpen && (
              <div className="absolute left-0 top-full z-50 grid w-[34rem] grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-hover">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/category/${c.slug}`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <CategoryIcon name={c.icon} width={18} height={18} className="text-brand-600" />
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs text-slate-400">{c.productCount}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {categories.slice(0, 7).map((c) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-700"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-x py-3">
            <form onSubmit={submitSearch} className="relative mb-3">
              <Icon.search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input pl-10"
                placeholder="Search products…"
              />
            </form>
            <div className="grid grid-cols-2 gap-1">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to={`/category/${c.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <CategoryIcon name={c.icon} width={16} height={16} className="text-brand-600" />
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
