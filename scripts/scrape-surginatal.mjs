/**
 * Real catalog scraper for Stryle.
 *
 * Pulls live categories and products (with REAL brands, names, prices, images
 * and ratings) from SurgiNatal's public storefront API and writes them into the
 * app's data files:
 *   - src/data/categories.json
 *   - src/data/products.json   <-- the standalone SKU list
 *
 * The data is normalised into the schema the storefront expects (sku, name,
 * brand, category, categorySlug, slug, variant, unit, price, mrp, discountPct,
 * rating, reviews, inStock, hsn, description, highlights, images).
 *
 * Re-run with: npm run gen:catalog
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(__dirname, '../src/data')

const API = 'https://surginatal.com/api/v1'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Max products to pull per category (keeps the catalog rich but lean).
const PER_CATEGORY = Number(process.env.PER_CATEGORY || 60)

// Map SurgiNatal categories to the storefront's hand-built line-icon set.
const ICON_BY_SLUG = {
  'surgical-sutures': 'suture',
  'ortho-care': 'brace',
  'diagnostic-monitoring-devices': 'stethoscope',
  'wound-care': 'dressing',
  syringe: 'iv',
  'ostomy-care': 'dressing',
  'bandages-tapes': 'dressing',
  'respiratory-care': 'mask',
  'catheters-drainage': 'iv',
  'surgical-supplies': 'scalpel',
  'protective-equipments-ppe': 'mask',
  'maternity-neonatal-care': 'dressing',
  'airway-management': 'mask',
  'hospital-furniture-accessories': 'bed',
  'laboratory-product': 'flask',
  'pharmaceuticals-medications': 'spray',
  'disinfection-antiseptics': 'spray',
  'incontinence-continence-care': 'dressing',
  'home-patient-care': 'bed',
  urology: 'iv',
  'feeding-nutrition': 'iv',
  'dialysis-renal-care': 'iv',
  ophthalmology: 'dressing',
  'dental-care': 'scalpel',
  kits: 'dressing',
}

// Plausible HSN chapter per category (medical devices live around 9018; the API
// does not expose HSN on the listing endpoint).
const HSN_BY_SLUG = {
  'surgical-sutures': 3006,
  'pharmaceuticals-medications': 3004,
  'disinfection-antiseptics': 3808,
  'bandages-tapes': 3005,
  'wound-care': 3005,
  'protective-equipments-ppe': 6307,
  'hospital-furniture-accessories': 9402,
}
const hsnFor = (slug) => HSN_BY_SLUG[slug] || 9018

const blurbFor = (name) =>
  `Genuine ${name.toLowerCase()} from trusted medical brands — sourced for hospitals, clinics and home care.`

const code = (name) =>
  name
    .split(/\s|&|\/|,/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJSON(url, { retries = 4, timeout = 15000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeout)
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt > retries) throw new Error(`${err.message} for ${url}`)
      await sleep(attempt * 1000)
    } finally {
      clearTimeout(timer)
    }
  }
}

async function fetchCategories() {
  const data = await getJSON(`${API}/category/`)
  return data?.data?.category_data ?? []
}

async function fetchProductsForCategory(slug, max) {
  const pageSize = Math.min(max, 50)
  const products = []
  let count = 0
  for (let page = 1; products.length < max; page++) {
    const url =
      `${API}/filter-products/?category=${encodeURIComponent(slug)}` +
      `&page_size=${pageSize}&page=${page}`
    const data = await getJSON(url)
    count = data?.count ?? 0
    const list = data?.results?.data?.product_list ?? []
    if (!list.length) break
    products.push(...list)
    if (!data?.next || products.length >= count) break
  }
  return { count, products: products.slice(0, max) }
}

const cleanName = (s) => (s || '').replace(/\s+/g, ' ').trim()

function normalize(raw, cat) {
  const brand = cleanName(raw.Brand?.name) || 'Surginatal'
  const variation = Array.isArray(raw.variation_with_pack) ? raw.variation_with_pack : []
  const variant = cleanName(variation[0]?.name) || 'Standard'
  const packs = variation[0]?.packs?.length ? variation[0].packs : raw.packs || []
  const unit = cleanName(packs[0]?.name) || 'Each'

  const price = Number(raw.price) || 0
  const mrp = Number(raw.mrp) || price
  const discountPct = mrp > price ? Math.round((1 - price / mrp) * 100) : 0
  const rating = Number(raw.avg_rating) || 0
  const reviews = Number(raw.review_count) || 0
  const inStock = !!raw.in_stock
  const images = Array.isArray(raw.images) ? raw.images.filter(Boolean) : []

  return {
    sku: `SN-${code(cat.name)}-${raw.id}`,
    name: cleanName(raw.name),
    brand,
    category: cat.name,
    categorySlug: cat.slug,
    slug: raw.slug,
    variant,
    unit,
    price,
    mrp,
    discountPct,
    currency: 'INR',
    rating: +rating.toFixed(1),
    reviews,
    inStock,
    hsn: hsnFor(cat.slug),
    description:
      `${cleanName(raw.name)} — genuine ${brand} product supplied through Stryle. ` +
      `Variant: ${variant}. Supplied as "${unit}". 100% authentic, sourced directly ` +
      `and suitable for hospitals, clinics and home care.`,
    highlights: [
      `Authentic ${brand} ${cat.name.toLowerCase()}`,
      `Variant / size: ${variant}`,
      `Pack: ${unit}`,
      inStock ? 'In stock — ships in 24–48 hours' : 'Restocking soon',
    ],
    images,
  }
}

async function main() {
  console.log('Fetching categories from SurgiNatal…')
  const rawCategories = await fetchCategories()
  if (!rawCategories.length) throw new Error('No categories returned')

  const categories = []
  const products = []
  const seenIds = new Set()
  const seenSlugs = new Set()

  for (const cat of rawCategories) {
    const { count, products: list } = await fetchProductsForCategory(
      cat.slug,
      PER_CATEGORY,
    )
    let written = 0
    for (const raw of list) {
      if (!raw?.id || seenIds.has(raw.id)) continue
      seenIds.add(raw.id)
      const p = normalize(raw, cat)
      if (!p.name || !p.slug) continue
      // Guarantee unique slugs across the catalog.
      if (seenSlugs.has(p.slug)) p.slug = `${p.slug}-${raw.id}`
      seenSlugs.add(p.slug)
      products.push(p)
      written++
    }
    categories.push({
      name: cat.name,
      slug: cat.slug,
      code: code(cat.name),
      icon: ICON_BY_SLUG[cat.slug] || 'dressing',
      blurb: blurbFor(cat.name),
      productCount: written,
    })
    console.log(
      `  ${cat.name.padEnd(38)} ${String(written).padStart(3)} / ${count} on site`,
    )
  }

  mkdirSync(dataDir, { recursive: true })
  writeFileSync(
    resolve(dataDir, 'categories.json'),
    JSON.stringify(categories, null, 2),
  )
  writeFileSync(
    resolve(dataDir, 'products.json'),
    JSON.stringify(products, null, 2),
  )

  const brands = [...new Set(products.map((p) => p.brand))].sort()
  console.log(
    `\nGenerated ${categories.length} categories and ${products.length} SKUs ` +
      `from ${brands.length} real brands.`,
  )
  console.log(`Brands: ${brands.join(', ')}`)
  console.log(`-> ${resolve(dataDir, 'categories.json')}`)
  console.log(`-> ${resolve(dataDir, 'products.json')}`)
}

main().catch((err) => {
  console.error('Scrape failed:', err)
  process.exit(1)
})
