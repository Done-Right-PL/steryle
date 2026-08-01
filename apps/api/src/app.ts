import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  addWishlistItem,
  applyCookieMutations,
  clearCart,
  clearCustomerSession,
  confirmOrderPayment,
  consumePhoneRegistrationTicket,
  createCustomerSession,
  createPhoneRegistrationTicket,
  createQuoteRequest,
  createRazorpayOrder,
  generateOtp,
  getCart,
  getCustomerByPhone,
  getOrderById,
  getOrdersForCustomer,
  getOverview,
  getProductBySku,
  getRevenueSeries,
  getSessionCustomer,
  getWishlist,
  isRazorpayMock,
  isValidEmail,
  isValidGstin,
  isValidPhone,
  listAllCustomers,
  listAllProducts,
  listCategories,
  listQuoteRequests,
  mergeCart,
  normalizePhone,
  putCartLine,
  putCustomer,
  putOrder,
  razorpayKeyId,
  registerCustomer,
  removeCartLine,
  removeWishlistItem,
  replaceCart,
  rupeesToPaise,
  saveOtp,
  tableName,
  touchCustomerByPhone,
  updateQuoteStatus,
  verifyOtp,
  verifyPaymentSignature,
  withRequestContext,
  type AccountCartLine,
  type CustomerRow,
  type QuoteStatus,
} from '@steryle/db'
import { cartTotals } from '@steryle/core'

type Env = { Variables: Record<string, never> }

function isLambdaRuntime() {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT)
}

const QUOTE_STATUSES = new Set<QuoteStatus>(['new', 'contacted', 'closed'])

function publicCustomer(customer: CustomerRow) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    city: customer.city,
    gstin: customer.gstin,
    gstCompanyName: customer.gstCompanyName,
  }
}

async function requireCustomer() {
  const customer = await getSessionCustomer()
  if (!customer) return null
  return customer
}

export function createApp() {
  const app = new Hono<Env>()

  const allowOrigins = (
    process.env.CORS_ORIGINS ||
    'http://localhost:4173,http://127.0.0.1:4173,http://localhost:4174,http://127.0.0.1:4174,https://steryle.in,https://www.steryle.in'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!isLambdaRuntime()) {
    app.use(
      '*',
      cors({
        origin: (origin) => {
          if (!origin) return allowOrigins[0] ?? '*'
          return allowOrigins.includes(origin) || allowOrigins.includes('*')
            ? origin
            : (allowOrigins[0] ?? origin)
        },
        credentials: true,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        exposeHeaders: ['Set-Cookie'],
      }),
    )
  }

  app.use('*', async (c, next) => {
    return withRequestContext(c.req.header('cookie'), async () => {
      await next()
      const res = c.res
      const withCookies = applyCookieMutations(res)
      if (withCookies !== res) c.res = withCookies
    })
  })

  app.get('/api/health', (c) =>
    c.json({
      ok: true,
      service: 'steryle-api',
      table: (() => {
        try {
          return tableName()
        } catch {
          return null
        }
      })(),
    }),
  )

  /* ---------------------------- Account / OTP ---------------------------- */

  app.post('/api/account/otp/send', async (c) => {
    const body = await c.req.json().catch(() => null)
    const phone = normalizePhone(typeof body?.phone === 'string' ? body.phone : '')
    if (!isValidPhone(phone)) {
      return c.json({ error: 'Enter a valid 10-digit mobile number.' }, 400)
    }
    const otp = generateOtp()
    await saveOtp(phone, otp)

    // Until SMS is wired, echo the OTP so login works. Disable with OTP_ECHO=false.
    const echo = process.env.OTP_ECHO !== 'false'
    return c.json({
      ok: true,
      phone,
      ...(echo ? { otp } : {}),
    })
  })

  app.post('/api/account/otp/verify', async (c) => {
    const body = await c.req.json().catch(() => null)
    const phone = normalizePhone(typeof body?.phone === 'string' ? body.phone : '')
    const otp = typeof body?.otp === 'string' ? body.otp.trim() : ''
    if (!isValidPhone(phone)) {
      return c.json({ error: 'Enter a valid 10-digit mobile number.' }, 400)
    }
    if (!/^\d{6}$/.test(otp)) {
      return c.json({ error: 'Enter the 6-digit OTP.' }, 400)
    }

    const result = await verifyOtp(phone, otp)
    if (!result.ok) return c.json({ error: result.error }, 401)

    const existing = await touchCustomerByPhone(phone)
    if (!existing) {
      const registrationToken = await createPhoneRegistrationTicket(phone)
      return c.json({
        ok: true,
        needsRegistration: true,
        phone,
        registrationToken,
      })
    }

    await createCustomerSession(existing.id)

    const guestLines = Array.isArray(body?.cart) ? (body.cart as AccountCartLine[]) : []
    if (guestLines.length > 0) {
      await mergeCart(
        existing.id,
        guestLines.filter((l) => l?.sku && l.qty > 0),
      )
    }

    const cart = await getCart(existing.id)
    return c.json({
      ok: true,
      needsRegistration: false,
      customer: publicCustomer(existing),
      cart,
    })
  })

  app.post('/api/account/register', async (c) => {
    const body = await c.req.json().catch(() => null)
    const phone = normalizePhone(typeof body?.phone === 'string' ? body.phone : '')
    const registrationToken =
      typeof body?.registrationToken === 'string' ? body.registrationToken : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const gstinRaw = typeof body?.gstin === 'string' ? body.gstin.trim() : ''
    const gstCompanyName =
      typeof body?.gstCompanyName === 'string' ? body.gstCompanyName.trim() : ''

    if (!isValidPhone(phone)) {
      return c.json({ error: 'Enter a valid 10-digit mobile number.' }, 400)
    }
    if (name.length < 2 || name.length > 120) {
      return c.json({ error: 'Enter your full name.' }, 400)
    }
    if (gstinRaw && !isValidGstin(gstinRaw)) {
      return c.json({ error: 'Enter a valid 15-character GSTIN.' }, 400)
    }
    if (gstinRaw && gstCompanyName.length < 2) {
      return c.json({ error: 'Enter the GST registered company name for invoices.' }, 400)
    }
    if (!gstinRaw && gstCompanyName) {
      return c.json({ error: 'Add your GSTIN to save the company name for invoices.' }, 400)
    }

    const ticket = await consumePhoneRegistrationTicket(phone, registrationToken)
    if (!ticket.ok) return c.json({ error: ticket.error }, 401)

    // Race: another request may have registered this phone.
    const already = await getCustomerByPhone(phone)
    const customer =
      already ??
      (await registerCustomer({
        phone,
        name,
        gstin: gstinRaw || null,
        gstCompanyName: gstCompanyName || null,
      }))

    await createCustomerSession(customer.id)

    const guestLines = Array.isArray(body?.cart) ? (body.cart as AccountCartLine[]) : []
    if (guestLines.length > 0) {
      await mergeCart(
        customer.id,
        guestLines.filter((l) => l?.sku && l.qty > 0),
      )
    }

    return c.json({
      ok: true,
      customer: publicCustomer(customer),
      cart: await getCart(customer.id),
    })
  })

  app.get('/api/account/me', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ customer: null }, 401)
    return c.json({ customer: publicCustomer(customer) })
  })

  app.post('/api/account/logout', async (c) => {
    await clearCustomerSession()
    return c.json({ ok: true })
  })

  app.patch('/api/account/profile', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)
    const body = await c.req.json().catch(() => null)

    const nextGstin =
      typeof body?.gstin === 'string'
        ? body.gstin.trim().toUpperCase() || null
        : customer.gstin
    const nextGstCompany =
      typeof body?.gstCompanyName === 'string'
        ? body.gstCompanyName.trim() || null
        : customer.gstCompanyName
    if (nextGstin && !isValidGstin(nextGstin)) {
      return c.json({ error: 'Enter a valid 15-character GSTIN.' }, 400)
    }
    if (nextGstin && !nextGstCompany) {
      return c.json({ error: 'Enter the GST registered company name for invoices.' }, 400)
    }

    const nextEmail =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase() || null : customer.email
    if (nextEmail && !isValidEmail(nextEmail)) {
      return c.json({ error: 'Enter a valid email address.' }, 400)
    }

    const updated = await putCustomer({
      ...customer,
      name: typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : customer.name,
      email: nextEmail,
      city: typeof body?.city === 'string' ? body.city.trim() || null : customer.city,
      gstin: nextGstin,
      gstCompanyName: nextGstin ? nextGstCompany : null,
      updatedAt: new Date(),
    })
    return c.json({ customer: publicCustomer(updated) })
  })

  /* -------------------------------- Cart -------------------------------- */

  app.get('/api/account/cart', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)
    const items = await getCart(customer.id)
    return c.json({ items, totals: cartTotals(items) })
  })

  app.put('/api/account/cart', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)
    const body = await c.req.json().catch(() => null)
    const lines = Array.isArray(body?.items) ? (body.items as AccountCartLine[]) : []
    const items = await replaceCart(
      customer.id,
      lines.filter((l) => l?.sku && Number(l.qty) > 0),
    )
    return c.json({ items })
  })

  app.post('/api/account/cart/items', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)
    const body = await c.req.json().catch(() => null)
    const sku = typeof body?.sku === 'string' ? body.sku : ''
    const qty = Math.max(1, Number(body?.qty) || 1)
    const product = await getProductBySku(sku)
    if (!product || product.archivedAt || product.isHidden) {
      return c.json({ error: 'Product not available.' }, 404)
    }
    const existing = (await getCart(customer.id)).find((l) => l.sku === sku)
    await putCartLine(customer.id, {
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      price: product.price,
      image: product.images[0],
      qty: (existing?.qty ?? 0) + qty,
    })
    return c.json({ items: await getCart(customer.id) })
  })

  app.patch('/api/account/cart/items/:sku', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)
    const sku = c.req.param('sku')
    const body = await c.req.json().catch(() => null)
    const qty = Number(body?.qty)
    if (!Number.isFinite(qty) || qty <= 0) {
      await removeCartLine(customer.id, sku)
    } else {
      const existing = (await getCart(customer.id)).find((l) => l.sku === sku)
      if (!existing) return c.json({ error: 'Item not in cart.' }, 404)
      await putCartLine(customer.id, { ...existing, qty })
    }
    return c.json({ items: await getCart(customer.id) })
  })

  app.delete('/api/account/cart/items/:sku', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)
    await removeCartLine(customer.id, c.req.param('sku'))
    return c.json({ items: await getCart(customer.id) })
  })

  /* ------------------------------ Wishlist ------------------------------ */

  app.get('/api/account/wishlist', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)
    return c.json({ items: await getWishlist(customer.id) })
  })

  app.post('/api/account/wishlist', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)
    const body = await c.req.json().catch(() => null)
    const sku = typeof body?.sku === 'string' ? body.sku : ''
    const product = await getProductBySku(sku)
    if (!product) return c.json({ error: 'Product not found.' }, 404)
    const item = await addWishlistItem(customer.id, {
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      price: product.price,
      image: product.images[0],
    })
    return c.json({ item, items: await getWishlist(customer.id) }, 201)
  })

  app.delete('/api/account/wishlist/:sku', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)
    await removeWishlistItem(customer.id, c.req.param('sku'))
    return c.json({ items: await getWishlist(customer.id) })
  })

  /* ------------------------------- Orders ------------------------------- */

  app.get('/api/account/orders', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)
    const orders = await getOrdersForCustomer(customer.id, 50)
    return c.json({ orders })
  })

  app.post('/api/orders', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in to place an order.' }, 401)

    const body = await c.req.json().catch(() => null)
    const cart = await getCart(customer.id)
    if (cart.length === 0) return c.json({ error: 'Your cart is empty.' }, 400)

    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const phone = normalizePhone(typeof body?.phone === 'string' ? body.phone : customer.phone)
    const email =
      typeof body?.email === 'string' && body.email.trim()
        ? body.email.trim()
        : customer.email ?? null
    const address = typeof body?.address === 'string' ? body.address.trim() : ''
    const city = typeof body?.city === 'string' ? body.city.trim() : ''
    const pin = typeof body?.pin === 'string' ? body.pin.trim() : ''
    if (!name || !address || !city || !pin) {
      return c.json({ error: 'Name, address, city and PIN are required.' }, 400)
    }

    const totals = cartTotals(cart)
    const paymentMethod =
      typeof body?.paymentMethod === 'string' ? body.paymentMethod : 'Cash on delivery'
    const isCod = paymentMethod === 'Cash on delivery'
    const reference = `STE-${Date.now().toString(36).toUpperCase()}`

    let razorpayOrderId: string | null = null
    let payment: {
      mock: boolean
      keyId: string
      razorpayOrderId: string
      amount: number
      currency: string
      name: string
      description: string
      prefill: { name: string; email?: string; contact: string }
    } | null = null

    if (!isCod) {
      try {
        const rz = await createRazorpayOrder({
          amountInPaise: rupeesToPaise(totals.total),
          receipt: reference.slice(0, 40),
          notes: { customerId: customer.id, reference },
        })
        razorpayOrderId = rz.id
        payment = {
          mock: isRazorpayMock(),
          keyId: razorpayKeyId() || 'rzp_test_mock',
          razorpayOrderId: rz.id,
          amount: rz.amount,
          currency: rz.currency,
          name: 'Steryle',
          description: `Order ${reference}`,
          prefill: {
            name,
            ...(email ? { email } : {}),
            contact: phone || customer.phone,
          },
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment setup failed.'
        return c.json({ error: message }, 502)
      }
    }

    const order = await putOrder({
      reference,
      customerId: customer.id,
      status: isCod ? 'confirmed' : 'pending',
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      placedAt: new Date(),
      paymentMethod,
      razorpayOrderId,
      shippingName: name,
      shippingPhone: phone || customer.phone,
      shippingEmail: email,
      shippingAddress: address,
      shippingCity: city,
      shippingPin: pin,
      gstin: typeof body?.gstin === 'string' ? body.gstin.trim() || null : null,
      items: cart.map((l) => ({
        sku: l.sku,
        name: l.name,
        unitPrice: l.price,
        qty: l.qty,
      })),
    })

    if (isCod) {
      await clearCart(customer.id)
    }
    if (name && name !== customer.name) {
      await putCustomer({ ...customer, name, updatedAt: new Date() })
    }

    return c.json({ ok: true, order, payment }, 201)
  })

  app.post('/api/orders/verify', async (c) => {
    const customer = await requireCustomer()
    if (!customer) return c.json({ error: 'Sign in required.' }, 401)

    const body = await c.req.json().catch(() => null)
    const orderId = typeof body?.orderId === 'string' ? body.orderId : ''
    const razorpayOrderId =
      typeof body?.razorpay_order_id === 'string' ? body.razorpay_order_id : ''
    const razorpayPaymentId =
      typeof body?.razorpay_payment_id === 'string' ? body.razorpay_payment_id : ''
    const signature =
      typeof body?.razorpay_signature === 'string' ? body.razorpay_signature : ''

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !signature) {
      return c.json({ error: 'Missing payment verification fields.' }, 400)
    }

    const order = await getOrderById(orderId)
    if (!order || order.customerId !== customer.id) {
      return c.json({ error: 'Order not found.' }, 404)
    }
    if (order.status === 'confirmed') {
      await clearCart(customer.id)
      return c.json({ ok: true, order })
    }
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      return c.json({ error: 'Payment does not match this order.' }, 400)
    }

    const ok = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature,
    })
    if (!ok) return c.json({ error: 'Invalid payment signature.' }, 400)

    const confirmed = await confirmOrderPayment({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
    })
    await clearCart(customer.id)
    return c.json({ ok: true, order: confirmed })
  })

  /* ------------------------------- Quotes ------------------------------- */

  app.post('/api/quotes', async (c) => {
    const body = await c.req.json().catch(() => null)
    if (!body || typeof body !== 'object') return c.json({ error: 'Invalid JSON body.' }, 400)
    const organisation =
      typeof body.organisation === 'string' ? body.organisation.trim() : ''
    const requirement = typeof body.requirement === 'string' ? body.requirement.trim() : ''
    if (organisation.length < 2 || organisation.length > 160) {
      return c.json({ error: 'Organisation is required.' }, 400)
    }
    if (requirement.length < 5 || requirement.length > 4000) {
      return c.json({ error: 'Tell us a bit more about the requirement.' }, 400)
    }
    const quote = await createQuoteRequest({
      organisation,
      requirement,
      contactName: typeof body.contactName === 'string' ? body.contactName.trim() : null,
      contactPhone:
        typeof body.contactPhone === 'string'
          ? body.contactPhone.replace(/\D/g, '').slice(0, 10)
          : null,
    })
    return c.json({ ok: true, id: quote.id }, 201)
  })

  app.get('/api/admin/quotes', async (c) => c.json({ quotes: await listQuoteRequests() }))
  app.patch('/api/admin/quotes/:id', async (c) => {
    const body = await c.req.json().catch(() => null)
    const status = body?.status as QuoteStatus | undefined
    if (!status || !QUOTE_STATUSES.has(status)) {
      return c.json({ error: 'status must be new, contacted, or closed.' }, 400)
    }
    const updated = await updateQuoteStatus(c.req.param('id'), status)
    if (!updated) return c.json({ error: 'Quote not found.' }, 404)
    return c.json({ quote: updated })
  })

  app.get('/api/admin/overview', async (c) =>
    c.json(await getOverview(Number(c.req.query('windowDays') || 30))),
  )
  app.get('/api/admin/revenue-series', async (c) =>
    c.json(await getRevenueSeries(Number(c.req.query('days') || 30))),
  )
  app.get('/api/admin/products', async (c) => {
    const products = await listAllProducts()
    return c.json({ products, total: products.length })
  })
  app.get('/api/admin/customers', async (c) => {
    const customers = await listAllCustomers()
    return c.json({ customers, total: customers.length })
  })
  app.get('/api/admin/categories', async (c) =>
    c.json({ categories: await listCategories() }),
  )

  app.notFound((c) => c.json({ error: 'Not found' }, 404))
  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: err.message || 'Internal error' }, 500)
  })

  return app
}
