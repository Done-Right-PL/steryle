export type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: { ondismiss?: () => void }
}

export type RazorpayPaymentResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => { open: () => void }

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

export function mockPaymentProof(orderId: string): RazorpayPaymentResponse {
  const paymentId = `pay_mock_${Math.random().toString(36).slice(2, 12)}`
  return {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: `mock_${paymentId}`,
  }
}

export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay is only available in the browser.'))
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay)

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay]')
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.Razorpay) resolve(window.Razorpay)
        else reject(new Error('Razorpay failed to load.'))
      })
      existing.addEventListener('error', () => reject(new Error('Razorpay failed to load.')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpay = '1'
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay)
      else reject(new Error('Razorpay failed to load.'))
    }
    script.onerror = () => reject(new Error('Razorpay failed to load.'))
    document.body.appendChild(script)
  })
}

export function openRazorpayCheckout(
  options: Omit<RazorpayCheckoutOptions, 'handler' | 'modal'> & {
    onSuccess: (response: RazorpayPaymentResponse) => void
    onDismiss?: () => void
  },
): Promise<void> {
  const { onSuccess, onDismiss, ...rest } = options
  return loadRazorpay().then((Razorpay) => {
    const rzp = new Razorpay({
      ...rest,
      handler: onSuccess,
      modal: { ondismiss: onDismiss },
    })
    rzp.open()
  })
}
