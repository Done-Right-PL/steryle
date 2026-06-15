import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container-x py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  )
}
