import Breadcrumbs from '../components/Breadcrumbs'
import { Icon } from '../components/Icons'

const FAQS = [
  ['How fast is delivery?', 'Most in-stock orders are dispatched within 24–48 hours and delivered across India in 3–6 business days.'],
  ['Do you provide GST invoices?', 'Yes. Add your GSTIN at checkout and a tax invoice is generated for every order.'],
  ['Can I order in bulk for my hospital?', 'Absolutely. Use the "Request a quote" option for volume pricing and a dedicated account manager.'],
  ['What is the return policy?', 'Unopened, non-sterile items can be returned within 7 days. Sterile and single-use items are non-returnable for safety reasons.'],
]

export default function AccountPage() {
  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Account & Support' }]} />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Account & Support</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Icon.user width={24} height={24} />
          </span>
          <h2 className="mt-3 font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Access orders, invoices and saved addresses.</p>
          <form className="mt-4 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <input className="input" type="email" placeholder="Email" />
            <input className="input" type="password" placeholder="Password" />
            <button className="btn-primary w-full">Sign in</button>
          </form>
        </div>

        <div className="card p-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Icon.headset width={24} height={24} />
          </span>
          <h2 className="mt-3 font-bold text-slate-900">Contact us</h2>
          <p className="mt-1 text-sm text-slate-500">We're here Mon–Sat, 9am–7pm.</p>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2"><Icon.phone width={16} height={16} className="text-brand-600" /> 1800-123-456</p>
            <p className="flex items-center gap-2"><Icon.mail width={16} height={16} className="text-brand-600" /> care@stryle.example</p>
            <p className="flex items-center gap-2"><Icon.pin width={16} height={16} className="text-brand-600" /> Sector 62, Noida, UP 201301</p>
          </div>
        </div>

        <div className="card p-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Icon.tag width={24} height={24} />
          </span>
          <h2 className="mt-3 font-bold text-slate-900">Request a bulk quote</h2>
          <p className="mt-1 text-sm text-slate-500">Volume pricing for hospitals & clinics.</p>
          <form className="mt-4 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <input className="input" placeholder="Organisation name" />
            <input className="input" placeholder="Email or phone" />
            <button className="btn-outline w-full">Request quote</button>
          </form>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">Frequently asked questions</h2>
        <div className="mt-4 space-y-3">
          {FAQS.map(([q, a]) => (
            <details key={q} className="card group p-4">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-800">
                {q}
                <Icon.plus width={18} height={18} className="text-slate-400 transition group-open:rotate-45" />
              </summary>
              <p className="mt-2 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
