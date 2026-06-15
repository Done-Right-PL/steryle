import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { Icon } from '../components/Icons'
import { useCart } from '../context/CartContext'
import { formatINR } from '../data/catalog'

export default function CheckoutPage() {
  const { items, subtotal, shipping, tax, total, clearCart } = useCart()
  const navigate = useNavigate()
  const [placed, setPlaced] = useState(null)
  const [payment, setPayment] = useState('upi')

  if (items.length === 0 && !placed) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Nothing to checkout</h1>
        <Link to="/categories" className="btn-primary mt-4">Start shopping</Link>
      </div>
    )
  }

  if (placed) {
    return (
      <div className="container-x py-12">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <Icon.check width={32} height={32} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Order placed!</h1>
          <p className="mt-2 text-slate-500">
            Thank you for your order. A confirmation has been sent to your email.
          </p>
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
            <p className="text-slate-500">Order ID</p>
            <p className="text-lg font-bold tracking-wide text-slate-900">{placed.id}</p>
            <p className="mt-2 text-slate-500">Total paid</p>
            <p className="font-semibold text-slate-900">{formatINR(placed.total)}</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-primary mt-6 w-full">
            Back to home
          </button>
        </div>
      </div>
    )
  }

  const placeOrder = (e) => {
    e.preventDefault()
    const id = 'SS' + Math.floor(100000 + Math.random() * 900000)
    setPlaced({ id, total })
    clearCart()
  }

  const field = 'input'

  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contact + shipping */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900">Shipping details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input required className={field} placeholder="Full name" />
              <input required type="email" className={field} placeholder="Email address" />
              <input required className={field} placeholder="Phone number" />
              <input required className={field} placeholder="Clinic / hospital (optional)" />
              <input required className={`${field} sm:col-span-2`} placeholder="Address line" />
              <input required className={field} placeholder="City" />
              <input required className={field} placeholder="State" />
              <input required className={field} placeholder="PIN code" />
              <input className={field} placeholder="GSTIN (optional)" />
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900">Payment method</h2>
            <div className="mt-4 space-y-2">
              {[
                ['upi', 'UPI / QR'],
                ['card', 'Credit / Debit card'],
                ['netbanking', 'Net banking'],
                ['cod', 'Cash on delivery'],
              ].map(([val, label]) => (
                <label key={val} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${payment === val ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
                  <input
                    type="radio"
                    name="payment"
                    value={val}
                    checked={payment === val}
                    onChange={() => setPayment(val)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-300"
                  />
                  <span className="font-medium text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="card sticky top-32 p-5">
            <h2 className="text-lg font-bold text-slate-900">Your order</h2>
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
              {items.map((i) => (
                <li key={i.sku} className="flex justify-between gap-2">
                  <span className="text-slate-600">{i.name} <span className="text-slate-400">×{i.qty}</span></span>
                  <span className="shrink-0 font-medium">{formatINR(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{shipping === 0 ? 'Free' : formatINR(shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">GST (12%)</dt><dd>{formatINR(tax)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><dt>Total</dt><dd>{formatINR(total)}</dd></div>
            </dl>
            <button type="submit" className="btn-primary mt-4 w-full">
              Place order · {formatINR(total)}
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">Demo checkout — no real payment is processed.</p>
          </div>
        </div>
      </form>
    </div>
  )
}
