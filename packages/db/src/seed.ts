/**
 * Seeds a fresh DynamoDB table.
 *
 * Catalogue: categories + SKUs from `@steryle/core` JSON.
 * Customers/orders: synthetic, deterministic PRNG — identical across runs.
 *
 * Usage:
 *   AWS_PROFILE=steryle-admin pnpm seed
 *   (or) TABLE_NAME=... AWS_PROFILE=steryle-admin pnpm --filter @steryle/db seed
 */
import categoriesJson from '@steryle/core/data/categories.json'
import productsJson from '@steryle/core/data/products.json'
import type { Category, Product } from '@steryle/core/types'
import {
  createId,
  getAdminByEmail,
  hashPassword,
  putAdminUser,
  putCategory,
  putCustomer,
  putOrder,
  putProduct,
  tableName,
} from './index'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { doc, nowIso } from './client'
import { keys } from './keys'

const catalogueCategories = categoriesJson as Category[]
const catalogueProducts = productsJson as Product[]

function makeRng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = makeRng(20250731)
const randInt = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1))
const pick = <T>(list: readonly T[]): T => {
  const item = list[Math.floor(rng() * list.length)]
  if (item === undefined) throw new Error('pick() called with an empty list')
  return item
}

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Ananya', 'Diya', 'Ishaan', 'Kavya', 'Rohan',
  'Meera', 'Arjun', 'Saanvi', 'Rehan', 'Nikhil', 'Priya', 'Farhan', 'Tanvi',
  'Kabir', 'Anjali', 'Yash', 'Sneha', 'Imran', 'Ritu', 'Devansh', 'Pooja',
] as const
const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Khan', 'Singh',
  'Gupta', 'Mehta', 'Chatterjee', 'Rao', 'Desai', 'Bose', 'Kulkarni', 'Menon',
] as const
const INSTITUTIONS = [
  'Sunrise Multispeciality Hospital', 'Apex Clinic', 'CarePoint Diagnostics',
  'Nova Surgical Centre', 'Lifeline Nursing Home', 'Medanta Polyclinic',
  'Sanjeevani Health Trust', 'Orchid Dental Care',
] as const
const CITIES = [
  ['Mumbai', 'Maharashtra'], ['Pune', 'Maharashtra'], ['Bengaluru', 'Karnataka'],
  ['Chennai', 'Tamil Nadu'], ['Hyderabad', 'Telangana'], ['Delhi', 'Delhi'],
  ['Gurugram', 'Haryana'], ['Ahmedabad', 'Gujarat'], ['Kolkata', 'West Bengal'],
  ['Jaipur', 'Rajasthan'], ['Kochi', 'Kerala'], ['Lucknow', 'Uttar Pradesh'],
] as const

const CUSTOMER_COUNT = 240
const DAYS_OF_HISTORY = 180
const FREE_SHIPPING_THRESHOLD = 999
const SHIPPING_FEE = 79
const GST_RATE = 0.12
const dayMs = 24 * 60 * 60 * 1000
const daysAgo = (days: number) => new Date(Date.now() - days * dayMs)

function ordersForDay(dayIndex: number): number {
  const ramp = 1 + (2.2 * (DAYS_OF_HISTORY - dayIndex)) / DAYS_OF_HISTORY
  const weekendDip = [0, 6].includes(daysAgo(dayIndex).getDay()) ? 0.55 : 1
  return Math.max(0, Math.round(randInt(0, 4) * ramp * weekendDip))
}

async function seed() {
  console.warn(`→ Seeding DynamoDB table ${tableName()}…`)

  console.warn('→ Seeding categories…')
  for (let i = 0; i < catalogueCategories.length; i++) {
    const c = catalogueCategories[i]!
    await putCategory({
      slug: c.slug,
      name: c.name,
      code: c.code,
      icon: c.icon,
      blurb: c.blurb,
      sortOrder: i,
    })
  }

  console.warn(`→ Seeding ${catalogueProducts.length} products…`)
  for (const p of catalogueProducts) {
    await putProduct(
      {
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        categorySlug: p.categorySlug,
        variant: p.variant ?? '',
        unit: p.unit ?? '',
        price: p.price,
        mrp: p.mrp,
        currency: p.currency ?? 'INR',
        rating: p.rating ?? 0,
        reviews: p.reviews ?? 0,
        inStock: p.inStock,
        hsn: p.hsn ?? null,
        description: p.description ?? '',
        highlights: p.highlights ?? [],
        images: p.images ?? [],
        isHidden: false,
        archivedAt: null,
      },
      { overwritePricing: false },
    )
  }

  console.warn('→ Seeding admin users…')
  const bootstrapEmail = process.env.ADMIN_EMAIL ?? 'admin@steryle.in'
  const bootstrapPassword = process.env.ADMIN_PASSWORD ?? 'steryle-admin'
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      `  ! ADMIN_PASSWORD not set — using the default "${bootstrapPassword}". Change it before deploying.`,
    )
  }

  let owner = await getAdminByEmail(bootstrapEmail)
  if (!owner) {
    owner = await putAdminUser({
      email: bootstrapEmail,
      name: 'Steryle Owner',
      passwordHash: await hashPassword(bootstrapPassword),
      role: 'owner',
    })
  }

  console.warn(`→ Seeding ${CUSTOMER_COUNT} synthetic customers…`)
  const insertedCustomers: { id: string; createdAt: Date }[] = []
  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const isInstitution = rng() < 0.28
    const name = isInstitution
      ? pick(INSTITUTIONS)
      : `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    const [city, state] = pick(CITIES)
    const joinedDaysAgo = randInt(0, DAYS_OF_HISTORY)
    const customer = await putCustomer({
      name,
      phone: `9155${String(5000000 + i).padStart(7, '0')}`,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}.${i}@example.com`,
      city,
      state,
      gstin: isInstitution ? `27AAACS${String(1000 + i).padStart(4, '0')}A1Z${i % 10}` : null,
      status: rng() < 0.04 ? 'blocked' : 'active',
      marketingOptIn: rng() < 0.72,
      createdAt: daysAgo(joinedDaysAgo),
      lastSeenAt: daysAgo(randInt(0, Math.max(1, joinedDaysAgo))),
    })
    insertedCustomers.push({ id: customer.id, createdAt: customer.createdAt })
  }

  console.warn('→ Seeding orders…')
  const sellable = catalogueProducts.filter((p) => p.inStock && p.price > 0)
  let reference = 24000
  let orderCount = 0

  for (let day = DAYS_OF_HISTORY; day >= 0; day--) {
    for (let n = 0; n < ordersForDay(day); n++) {
      const buyer = pick(insertedCustomers)
      const placedAt = daysAgo(day)
      if (buyer.createdAt > placedAt) continue

      const lines = Array.from({ length: randInt(1, 5) }, () => {
        const product = pick(sellable)
        return { product, qty: randInt(1, 6) }
      })
      const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0)
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
      const tax = Math.round(subtotal * GST_RATE)
      const age = day
      const status =
        age > 21
          ? pick(['delivered', 'delivered', 'delivered', 'cancelled', 'refunded'] as const)
          : age > 7
            ? pick(['delivered', 'shipped', 'shipped', 'cancelled'] as const)
            : pick(['pending', 'confirmed', 'confirmed', 'shipped'] as const)

      await putOrder({
        reference: `STE-${reference++}`,
        customerId: buyer.id,
        status,
        subtotal,
        shipping,
        tax,
        total: subtotal + shipping + tax,
        placedAt,
        items: lines.map((l) => ({
          sku: l.product.sku,
          name: l.product.name,
          unitPrice: l.product.price,
          qty: l.qty,
        })),
      })
      orderCount += 1
    }
  }
  console.warn(`  · ${orderCount} orders created.`)

  console.warn('→ Seeding notification content…')
  const notifs = [
    {
      title: 'Monsoon restock is live',
      body: 'Wound care and dressings are back in stock across 40+ brands. Free delivery over ₹999.',
      linkUrl: '/category/wound-care',
      channel: 'push' as const,
      audience: 'marketing_opt_in' as const,
      status: 'sent' as const,
      sentAt: daysAgo(6).toISOString(),
      createdAt: daysAgo(7).toISOString(),
    },
    {
      title: 'GST invoices now auto-emailed',
      body: 'Every order now sends a GST invoice to your registered email as soon as it ships.',
      channel: 'in_app' as const,
      audience: 'all' as const,
      status: 'sent' as const,
      sentAt: daysAgo(20).toISOString(),
      createdAt: daysAgo(21).toISOString(),
    },
    {
      title: 'Independence Day pricing',
      body: 'Up to 30% off orthopaedic supports and mobility aids from 14–17 August.',
      linkUrl: '/category/ortho-care',
      channel: 'push' as const,
      audience: 'all' as const,
      status: 'scheduled' as const,
      scheduledFor: new Date(Date.now() + 9 * dayMs).toISOString(),
      createdAt: nowIso(),
    },
    {
      title: 'Tell us how we did',
      body: 'Rate your recent order and help other clinics buy with confidence.',
      channel: 'in_app' as const,
      audience: 'lapsed' as const,
      status: 'draft' as const,
      createdAt: nowIso(),
    },
  ]

  for (const n of notifs) {
    const id = createId()
    const createdAt = n.createdAt
    await doc.send(
      new PutCommand({
        TableName: tableName(),
        Item: {
          ...keys.notification(id),
          ...keys.notificationsIndex(n.status, createdAt, id),
          entity: 'notification',
          id,
          title: n.title,
          body: n.body,
          linkUrl: 'linkUrl' in n ? n.linkUrl : null,
          channel: n.channel,
          audience: n.audience,
          status: n.status,
          scheduledFor: 'scheduledFor' in n ? n.scheduledFor : null,
          sentAt: 'sentAt' in n ? n.sentAt : null,
          createdBy: owner.id,
          createdAt,
          updatedAt: createdAt,
        },
      }),
    )
  }

  console.warn('\n✓ Seed complete.')
  console.warn(`  Sign in at /login with ${bootstrapEmail} / ${bootstrapPassword}`)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
