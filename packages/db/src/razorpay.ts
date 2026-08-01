import { createHmac, randomBytes } from 'node:crypto'
import { createId } from './client'

export function isRazorpayMock(): boolean {
  const flag = process.env.RAZORPAY_MOCK
  if (flag === undefined || flag === '') return true
  return flag === '1' || flag === 'true' || flag === 'TRUE'
}

export function razorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''
}

function razorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET || ''
}

export type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
}

/**
 * Create a Razorpay order. Mock mode returns a local id without calling Razorpay.
 */
export async function createRazorpayOrder(input: {
  amountInPaise: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
}): Promise<RazorpayOrder> {
  const currency = input.currency ?? 'INR'

  if (isRazorpayMock()) {
    return {
      id: `order_mock_${createId().slice(0, 14)}`,
      amount: input.amountInPaise,
      currency,
      receipt: input.receipt,
      status: 'created',
    }
  }

  const keyId = razorpayKeyId()
  const keySecret = razorpayKeySecret()
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency,
      receipt: input.receipt,
      notes: input.notes,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Razorpay order failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as RazorpayOrder
  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt,
    status: data.status,
  }
}

export function verifyPaymentSignature(input: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  if (isRazorpayMock()) {
    if (input.signature.startsWith('mock_')) return true
    if (input.paymentId.startsWith('pay_mock_')) return true
  }

  const secret = razorpayKeySecret()
  if (!secret) return false

  const expected = createHmac('sha256', secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex')

  return expected === input.signature
}

/** Client-side mock payment payload when RAZORPAY_MOCK=true. */
export function mockPaymentProof(orderId: string): {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
} {
  const paymentId = `pay_mock_${randomBytes(8).toString('hex')}`
  return {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: `mock_${paymentId}`,
  }
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}
