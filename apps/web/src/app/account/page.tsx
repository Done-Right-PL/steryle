import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export const metadata: Metadata = { title: 'Account & support' }

const FAQS = [
  {
    q: 'Are the products genuine?',
    a: 'Every SKU is sourced directly from the manufacturer or an authorised distributor, and ships with batch and expiry details where applicable.',
  },
  {
    q: 'Is there a minimum order value?',
    a: 'No. Order a single item or a full pallet — pricing is the same, and delivery is free above ₹999.',
  },
  {
    q: 'Do you provide GST invoices?',
    a: 'Yes. Add your GSTIN at checkout and a tax invoice is emailed as soon as the order is confirmed.',
  },
  {
    q: 'How fast is delivery?',
    a: 'In-stock items dispatch within 24–48 hours. Metro addresses typically receive orders in 2–4 days.',
  },
]

export default function AccountPage() {
  return (
    <div className="container-x py-10">
      <Breadcrumbs trail={[{ label: 'Account' }]} />

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-900">
        Account &amp; support
      </h1>

      <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
        <section>
          <h2 className="label">Sign in</h2>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-400">
            Enter your mobile number and we&apos;ll send a one-time password.
          </p>
          <form className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[11px] text-ink-400">Mobile number</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit number"
                className="field mt-1.5"
              />
            </label>
            <button type="button" className="btn-primary w-full">
              Send OTP
            </button>
            <p className="text-[11px] text-ink-300">
              Demo storefront — sign-in is not wired to a backend yet.
            </p>
          </form>
        </section>

        <section>
          <h2 className="label">Request a bulk quote</h2>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-400">
            Tell us what you need and our team responds within one working day.
          </p>
          <form className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[11px] text-ink-400">Organisation</span>
              <input className="field mt-1.5" placeholder="Clinic or hospital name" />
            </label>
            <label className="block">
              <span className="text-[11px] text-ink-400">Requirement</span>
              <textarea
                rows={4}
                className="field mt-1.5 h-auto py-3"
                placeholder="Products, quantities and delivery city"
              />
            </label>
            <button type="button" className="btn-outline w-full">
              Submit request
            </button>
          </form>
        </section>
      </div>

      <section className="mt-24">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
          Frequently asked
        </h2>
        <dl className="mt-8 divide-y divide-paper-200 border-y border-paper-200">
          {FAQS.map((faq) => (
            <div key={faq.q} className="grid gap-2 py-6 md:grid-cols-[280px_1fr] md:gap-10">
              <dt className="text-[13px] font-medium text-ink">{faq.q}</dt>
              <dd className="max-w-xl text-[13px] leading-relaxed text-ink-400">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
