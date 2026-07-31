import { categories, type CategoryIconName } from '@stryle/core'

const byCategory = new Map(categories.map((c) => [c.slug, c.icon]))

export const iconForCategory = (slug: string): CategoryIconName =>
  byCategory.get(slug) ?? 'dressing'
