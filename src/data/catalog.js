import categories from './categories.json'
import rawProducts from './products.json'

const iconByCat = Object.fromEntries(categories.map((c) => [c.slug, c.icon]))

// Enrich each SKU with its category icon for thumbnails.
const products = rawProducts.map((p) => ({
  ...p,
  icon: iconByCat[p.categorySlug] || 'dressing',
}))

export { categories, products }

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)

export const getCategoryBySlug = (slug) =>
  categories.find((c) => c.slug === slug)

export const getProductBySlug = (slug) =>
  products.find((p) => p.slug === slug)

export const getProductsByCategory = (slug) =>
  products.filter((p) => p.categorySlug === slug)

export const getRelatedProducts = (product, limit = 4) =>
  products
    .filter((p) => p.categorySlug === product.categorySlug && p.sku !== product.sku)
    .slice(0, limit)

export const searchProducts = (query) => {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q),
  )
}

export const allBrands = [...new Set(products.map((p) => p.brand))].sort()

export const featuredProducts = products
  .filter((p) => p.discountPct >= 20 && p.inStock)
  .slice(0, 8)

export const bestSellers = [...products]
  .sort((a, b) => b.reviews - a.reviews)
  .slice(0, 8)
