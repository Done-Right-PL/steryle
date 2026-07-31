/** Category icon keys drawn by each app's own icon set. */
export type CategoryIconName =
  | 'suture'
  | 'brace'
  | 'stethoscope'
  | 'dressing'
  | 'iv'
  | 'mask'
  | 'scalpel'
  | 'bed'
  | 'flask'
  | 'spray'
  | 'glove'
  | 'syringe'

export interface Category {
  name: string
  slug: string
  code: string
  icon: CategoryIconName
  blurb: string
  productCount: number
}

export interface Product {
  sku: string
  name: string
  brand: string
  category: string
  categorySlug: string
  slug: string
  variant: string
  unit: string
  price: number
  mrp: number
  discountPct: number
  currency: string
  rating: number
  reviews: number
  inStock: boolean
  hsn: number
  description: string
  highlights: string[]
  images: string[]
}

export interface CartLine {
  sku: string
  name: string
  slug: string
  brand: string
  price: number
  image?: string
  qty: number
}

export interface CartTotals {
  count: number
  subtotal: number
  shipping: number
  tax: number
  total: number
}

export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'discount'
