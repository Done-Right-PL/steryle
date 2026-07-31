import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  categories,
  getBrandsForCategory,
  getCategoryBySlug,
  getProductsByCategory,
} from '@steryle/core'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CategoryBrowser } from '@/components/CategoryBrowser'

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) return { title: 'Category not found' }
  return { title: category.name, description: category.blurb }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) notFound()

  const items = getProductsByCategory(slug)
  const brands = getBrandsForCategory(slug)

  return (
    <div className="container-x py-10">
      <Breadcrumbs trail={[{ label: 'Categories', href: '/categories' }, { label: category.name }]} />

      <header className="mt-5 max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 lg:text-3xl">
          {category.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{category.blurb}</p>
      </header>

      <CategoryBrowser products={items} brands={brands} />
    </div>
  )
}
