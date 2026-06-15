import { Link } from 'react-router-dom'

export default function Breadcrumbs({ items }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300">/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-brand-700">{item.label}</Link>
          ) : (
            <span className="font-medium text-slate-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
