import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AccountSignIn, BulkQuoteForm } from '@/components/AccountForms'

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
    <div className="container-x py-6 sm:py-10">
      <Breadcrumbs trail={[{ label: 'Account' }]} />

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink-900 sm:mt-6 sm:text-3xl">
        Account &amp; support
      </h1>

      <div className="mt-8 grid gap-10 sm:mt-12 lg:mt-14 lg:grid-cols-2 lg:gap-20">
        <section className="min-w-0">
          <h2 className="label">Sign in</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-400 sm:mt-4">
            Enter your mobile number and we&apos;ll send a one-time password.
          </p>
          <AccountSignIn />
        </section>

        <section className="min-w-0 border-t border-paper-200 pt-10 lg:border-t-0 lg:pt-0">
          <h2 className="label">Request a bulk quote</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-400 sm:mt-4">
            Tell us what you need and our team responds within one working day.
          </p>
          <BulkQuoteForm />
        </section>
      </div>

      <section className="mt-16 sm:mt-24">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900 sm:text-xl">
          Frequently asked
        </h2>
        <dl className="mt-6 divide-y divide-paper-200 border-y border-paper-200 sm:mt-8">
          {FAQS.map((faq) => (
            <div
              key={faq.q}
              className="grid gap-2 py-5 sm:py-6 md:grid-cols-[minmax(0,280px)_1fr] md:gap-10"
            >
              <dt className="text-[13px] font-medium text-ink">{faq.q}</dt>
              <dd className="max-w-xl text-[13px] leading-relaxed text-ink-400">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
