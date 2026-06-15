// Product imagery.
//
// Option 1: royalty-free, keyword-matched stock photos by category.
// We use LoremFlickr, which serves Creative Commons photos from Flickr by
// keyword. The `lock` seed makes each SKU map to a stable image across reloads.
//
// To use your OWN images later, just add an `image` field (or `images: [...]`)
// to a product in src/data/products.json — it overrides the stock photo below.

const CATEGORY_KEYWORDS = {
  'surgical-sutures': 'suture,medical,surgery',
  'ortho-care': 'orthopedic,brace,support',
  'diagnostic-monitoring-devices': 'stethoscope,medical,diagnostic',
  'wound-care': 'bandage,gauze,medical',
  syringe: 'iv,drip,hospital',
  'ostomy-care': 'medical,supplies,hospital',
  'bandages-tapes': 'bandage,gauze,medical',
  'respiratory-care': 'medical,mask,oxygen',
  'catheters-drainage': 'catheter,medical,hospital',
  'surgical-supplies': 'surgical,instrument,steel',
  'protective-equipments-ppe': 'medical,mask,protective',
  'maternity-neonatal-care': 'baby,care,medical',
  'airway-management': 'medical,mask,oxygen',
  'hospital-furniture-accessories': 'hospital,bed,ward',
  'laboratory-product': 'laboratory,test,tube',
  'pharmaceuticals-medications': 'medicine,pharmacy,tablet',
  'disinfection-antiseptics': 'sanitizer,disinfectant,bottle',
  'incontinence-continence-care': 'medical,care,supplies',
  'home-patient-care': 'hospital,care,home',
  urology: 'medical,supplies,hospital',
  'feeding-nutrition': 'medical,nutrition,feeding',
  'dialysis-renal-care': 'dialysis,medical,hospital',
  ophthalmology: 'eye,medical,care',
  'dental-care': 'dental,teeth,care',
  kits: 'medical,kit,supplies',
}

const DEFAULT_KEYWORDS = 'medical,supplies'

function seedFromString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h % 100000
}

function stockUrl(keywords, seed, w = 600, h = 450) {
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(keywords)}?lock=${seed}`
}

// Primary image for a product (honours a user-supplied override).
export function getProductImage(product, w = 600, h = 450) {
  if (product.image) return product.image
  if (Array.isArray(product.images) && product.images.length) return product.images[0]
  const keywords = CATEGORY_KEYWORDS[product.categorySlug] || DEFAULT_KEYWORDS
  return stockUrl(keywords, seedFromString(product.sku), w, h)
}

// A small gallery for the product page (override via product.images).
export function getProductGallery(product, count = 4, w = 600, h = 450) {
  if (Array.isArray(product.images) && product.images.length) {
    return product.images.slice(0, count)
  }
  const keywords = CATEGORY_KEYWORDS[product.categorySlug] || DEFAULT_KEYWORDS
  const base = seedFromString(product.sku)
  const first = product.image || stockUrl(keywords, base, w, h)
  const rest = Array.from({ length: count - 1 }, (_, i) =>
    stockUrl(keywords, base + i + 1, w, h),
  )
  return [first, ...rest]
}
