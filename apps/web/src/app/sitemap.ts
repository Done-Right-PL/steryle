import type { MetadataRoute } from 'next'
import { categories, products } from '@stryle/core'

const BASE = 'https://stryle.in'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, priority: 1 },
    { url: `${BASE}/categories`, priority: 0.9 },
    ...categories.map((c) => ({
      url: `${BASE}/category/${c.slug}`,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${BASE}/product/${p.slug}`,
      priority: 0.6,
    })),
  ]
}
