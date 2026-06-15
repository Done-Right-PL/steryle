import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { Icon } from '../components/Icons'
import { useCart } from '../context/CartContext'
import { formatINR } from '../data/catalog'

export default function CartPage() {
  const { items, setQty, removeItem, clearCart, subtotal, shipping, tax, total } = useCart()

  if (items.length === 0) {
    return (
      <div className="container-x py-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
        <div className="card mt-8 flex flex-col items-center gap-4 p-12 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
            <Icon.cart width={30} height={30} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Your cart is empty</h1>
            <p className="mt-1 text-slate-500">Add surgical supplies to get started.</p>
          </div>
          <Link to="/categories" className="btn-primary">Start shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Shopping cart</h1>
        <button onClick={clearCart} className="text-sm font-medium text-slate-500 hover:text-rose-600">
          Clear cart
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div key={item.sku} className="card flex items-center gap-4 p-4">
              <div className="flex-1">
                <Link to={`/product/${item.slug}`} className="font-semibold text-slate-800 hover:text-brand-700">
                  {item.name}
                </Link>
                <p className="text-xs text-slate-400">SKU: {item.sku} · {item.category}</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{formatINR(item.price)}</p>
              </div>

              <div className="inline-flex items-center rounded-lg border border-slate-300">
                <button onClick={() => setQty(item.sku, item.qty - 1)} className="grid h-9 w-9 place-items-center text-slate-600 hover:bg-slate-50">
                  <Icon.minus width={16} height={16} />
                </button>
                <span className="w-9 text-center text-sm font-semibold">{item.qty}</span>
                <button onClick={() => setQty(item.sku, item.qty + 1)} className="grid h-9 w-9 place-items-center text-slate-600 hover:bg-slate-50">
                  <Icon.plus width={16} height={16} />
                </button>
              </div>

              <div className="w-24 text-right font-bold text-slate-900">
                {formatINR(item.price * item.qty)}
              </div>

              <button onClick={() => removeItem(item.sku)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                <Icon.trash width={18} height={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="card sticky top-32 p-5">
            <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-medium">{formatINR(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd className="font-medium">{shipping === 0 ? 'Free' : formatINR(shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">GST (12%)</dt><dd className="font-medium">{formatINR(tax)}</dd></div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                <dt>Total</dt><dd>{formatINR(total)}</dd>
              </div>
            </dl>
            {subtotal < 999 && (
              <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                Add {formatINR(999 - subtotal)} more for free shipping.
              </p>
            )}
            <Link to="/checkout" className="btn-primary mt-4 w-full">
              Proceed to checkout <Icon.arrow width={18} height={18} />
            </Link>
            <Link to="/categories" className="btn-ghost mt-2 w-full">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
