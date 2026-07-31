/**
 * Seeds a fresh database.
 *
 * The catalogue half is real: categories and all 862 SKUs come straight from
 * `@stryle/core`'s JSON, so the admin portal edits the same products the
 * storefront renders.
 *
 * The customer and order half is synthetic, because the storefront has no
 * sign-in yet and therefore no real users. It is generated from a fixed PRNG
 * seed so every environment produces identical data and re-running is
 * idempotent. Delete this half once real customers exist.
 *
 * Usage: DATABASE_URL=... pnpm --filter @stryle/db seed
 */
import categoriesJson from '@stryle/core/data/categories.json'
import productsJson from '@stryle/core/data/products.json'
import type { Category, Product } from '@stryle/core/types'
import { sql as raw } from 'drizzle-orm'
import { getDb, getSql } from './client'
import { hashPassword } from './password'
import {
  adminUsers,
  categories,
  customers,
  notifications,
  orderItems,
  orders,
  products,
} from './schema'

const catalogueCategories = categoriesJson as Category[]
const catalogueProducts = productsJson as Product[]

/* -------------------------------------------------------------------------- */
/* Deterministic randomness                                                   */
/* -------------------------------------------------------------------------- */

/** mulberry32 — small, fast, and stable across Node versions. */
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

/* -------------------------------------------------------------------------- */
/* Synthetic customer inputs                                                  */
/* -------------------------------------------------------------------------- */

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Ananya', 'Diya', 'Ishaan', 'Kavya', 'Rohan',
  'Meera', 'Arjun', 'Saanvi', 'Rehan', 'Nikhil', 'Priya', 'Farhan', 'Tanvi',
  'Kabir', 'Anjali', 'Yash', 'Sneha', 'Imran', 'Ritu', 'Devansh', 'Pooja',
] as const

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Khan', 'Singh',
  'Gupta', 'Mehta', 'Chatterjee', 'Rao', 'Desai', 'Bose', 'Kulkarni', 'Menon',
] as const

/** Institutional buyers — these get a GSTIN and larger baskets. */
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

/**
 * Order volume ramps up over the window so the dashboard's "last 30 days vs
 * previous 30" comparison shows plausible growth rather than flat noise.
 */
function ordersForDay(dayIndex: number): number {
  const ramp = 1 + (2.2 * (DAYS_OF_HISTORY - dayIndex)) / DAYS_OF_HISTORY
  const weekendDip = [0, 6].includes(daysAgo(dayIndex).getDay()) ? 0.55 : 1
  return Math.max(0, Math.round(randInt(0, 4) * ramp * weekendDip))
}

/* -------------------------------------------------------------------------- */
/* Seed                                                                       */
/* -------------------------------------------------------------------------- */

async function seed() {
  const db = getDb()

  console.warn('→ Seeding categories…')
  await db
    .insert(categories)
    .values(
      catalogueCategories.map((c, i) => ({
        slug: c.slug,
        name: c.name,
        code: c.code,
        icon: c.icon,
        blurb: c.blurb,
        sortOrder: i,
      })),
    )
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: raw`excluded.name`,
        code: raw`excluded.code`,
        icon: raw`excluded.icon`,
        blurb: raw`excluded.blurb`,
        updatedAt: new Date(),
      },
    })

  console.warn(`→ Seeding ${catalogueProducts.length} products…`)
  // Chunked because Postgres caps a statement at 65535 bind parameters.
  const CHUNK = 200
  for (let i = 0; i < catalogueProducts.length; i += CHUNK) {
    const chunk = catalogueProducts.slice(i, i + CHUNK)
    await db
      .insert(products)
      .values(
        chunk.map((p) => ({
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
        })),
      )
      // Deliberately does not touch price/mrp/is_hidden/archived_at: re-running
      // the seed must never clobber an admin's pricing or visibility edits.
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          name: raw`excluded.name`,
          brand: raw`excluded.brand`,
          category: raw`excluded.category`,
          categorySlug: raw`excluded.category_slug`,
          description: raw`excluded.description`,
          highlights: raw`excluded.highlights`,
          images: raw`excluded.images`,
          updatedAt: new Date(),
        },
      })
  }

  console.warn('→ Seeding admin users…')
  const bootstrapEmail = process.env.ADMIN_EMAIL ?? 'admin@stryle.in'
  const bootstrapPassword = process.env.ADMIN_PASSWORD ?? 'stryle-admin'
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      `  ! ADMIN_PASSWORD not set — using the default "${bootstrapPassword}". Change it before deploying.`,
    )
  }

  const [owner] = await db
    .insert(adminUsers)
    .values({
      email: bootstrapEmail,
      name: 'Stryle Owner',
      passwordHash: await hashPassword(bootstrapPassword),
      role: 'owner',
    })
    .onConflictDoNothing()
    .returning()

  const ownerId =
    owner?.id ??
    (
      await db.query.adminUsers.findFirst({
        where: (u, { eq }) => eq(u.email, bootstrapEmail),
      })
    )?.id ??
    null

  console.warn(`→ Seeding ${CUSTOMER_COUNT} synthetic customers…`)
  const customerRows = Array.from({ length: CUSTOMER_COUNT }, (_, i) => {
    const isInstitution = rng() < 0.28
    const name = isInstitution
      ? pick(INSTITUTIONS)
      : `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    const [city, state] = pick(CITIES)
    const joinedDaysAgo = randInt(0, DAYS_OF_HISTORY)

    return {
      name,
      // Reserved 555-style block, so seeded numbers can never reach a real phone.
      phone: `9155${String(5000000 + i).padStart(7, '0')}`,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}.${i}@example.com`,
      city,
      state,
      gstin: isInstitution ? `27AAACS${String(1000 + i).padStart(4, '0')}A1Z${i % 10}` : null,
      status: rng() < 0.04 ? ('blocked' as const) : ('active' as const),
      marketingOptIn: rng() < 0.72,
      createdAt: daysAgo(joinedDaysAgo),
      lastSeenAt: daysAgo(randInt(0, Math.max(1, joinedDaysAgo))),
    }
  })

  const insertedCustomers = await db
    .insert(customers)
    .values(customerRows)
    .onConflictDoNothing({ target: customers.phone })
    .returning({ id: customers.id, createdAt: customers.createdAt })

  if (insertedCustomers.length === 0) {
    console.warn('  · Customers already seeded, skipping orders.')
  } else {
    console.warn('→ Seeding orders…')
    // Only sell products that are actually purchasable and have photography.
    const sellable = catalogueProducts.filter((p) => p.inStock && p.price > 0)

    let reference = 24000
    const orderValues: (typeof orders.$inferInsert)[] = []
    const itemsByReference = new Map<string, (typeof orderItems.$inferInsert)[]>()

    for (let day = DAYS_OF_HISTORY; day >= 0; day--) {
      for (let n = 0; n < ordersForDay(day); n++) {
        const buyer = pick(insertedCustomers)
        const placedAt = daysAgo(day)
        // A customer cannot order before they signed up.
        if (buyer.createdAt > placedAt) continue

        const lines = Array.from({ length: randInt(1, 5) }, () => {
          const product = pick(sellable)
          return { product, qty: randInt(1, 6) }
        })

        const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0)
        const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
        const tax = Math.round(subtotal * GST_RATE)

        const ref = `STR-${reference++}`
        const age = day
        // Older orders have had time to progress; recent ones are still moving.
        const status =
          age > 21
            ? pick(['delivered', 'delivered', 'delivered', 'cancelled', 'refunded'] as const)
            : age > 7
              ? pick(['delivered', 'shipped', 'shipped', 'cancelled'] as const)
              : pick(['pending', 'confirmed', 'confirmed', 'shipped'] as const)

        orderValues.push({
          reference: ref,
          customerId: buyer.id,
          status,
          subtotal,
          shipping,
          tax,
          total: subtotal + shipping + tax,
          placedAt,
          createdAt: placedAt,
        })

        itemsByReference.set(
          ref,
          lines.map((l) => ({
            orderId: '', // filled in after the orders are inserted
            sku: l.product.sku,
            name: l.product.name,
            unitPrice: l.product.price,
            qty: l.qty,
          })),
        )
      }
    }

    for (let i = 0; i < orderValues.length; i += CHUNK) {
      const inserted = await db
        .insert(orders)
        .values(orderValues.slice(i, i + CHUNK))
        .onConflictDoNothing({ target: orders.reference })
        .returning({ id: orders.id, reference: orders.reference })

      const items = inserted.flatMap((o) =>
        (itemsByReference.get(o.reference) ?? []).map((item) => ({ ...item, orderId: o.id })),
      )
      if (items.length > 0) await db.insert(orderItems).values(items)
    }

    console.warn(`  · ${orderValues.length} orders created.`)
  }

  console.warn('→ Seeding notification content…')
  await db
    .insert(notifications)
    .values([
      {
        title: 'Monsoon restock is live',
        body: 'Wound care and dressings are back in stock across 40+ brands. Free delivery over ₹999.',
        linkUrl: '/category/wound-care',
        channel: 'push' as const,
        audience: 'marketing_opt_in' as const,
        status: 'sent' as const,
        sentAt: daysAgo(6),
        createdBy: ownerId,
        createdAt: daysAgo(7),
      },
      {
        title: 'GST invoices now auto-emailed',
        body: 'Every order now sends a GST invoice to your registered email as soon as it ships.',
        channel: 'in_app' as const,
        audience: 'all' as const,
        status: 'sent' as const,
        sentAt: daysAgo(20),
        createdBy: ownerId,
        createdAt: daysAgo(21),
      },
      {
        title: 'Independence Day pricing',
        body: 'Up to 30% off orthopaedic supports and mobility aids from 14–17 August.',
        linkUrl: '/category/ortho-care',
        channel: 'push' as const,
        audience: 'all' as const,
        status: 'scheduled' as const,
        scheduledFor: new Date(Date.now() + 9 * dayMs),
        createdBy: ownerId,
      },
      {
        title: 'Tell us how we did',
        body: 'Rate your recent order and help other clinics buy with confidence.',
        channel: 'in_app' as const,
        audience: 'lapsed' as const,
        status: 'draft' as const,
        createdBy: ownerId,
      },
    ])
    .onConflictDoNothing()

  console.warn('\n✓ Seed complete.')
  console.warn(`  Sign in at /login with ${bootstrapEmail} / ${bootstrapPassword}`)
}

seed()
  .then(async () => {
    await getSql().end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('Seed failed:', error)
    await getSql().end({ timeout: 5 })
    process.exit(1)
  })
