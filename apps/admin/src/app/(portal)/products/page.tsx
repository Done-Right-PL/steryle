import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, VisibilityBadge } from '@/components/Badge'
import { InlinePriceForm } from '@/components/InlinePriceForm'
import { EmptyState, PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { can, requireUser } from '@/lib/auth'
import { formatCount, formatRelative } from '@/lib/format'
import {
  getFilterOptions,
  listProducts,
  PRODUCT_PAGE_SIZE,
  type ProductSort,
  type StockFilter,
  type VisibilityFilter,
} from '@/lib/products'
import { archiveProduct, restoreProduct, toggleHidden, toggleStock } from './actions'

export const metadata: Metadata = { title: 'Catalogue' }
export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  category?: string
  brand?: string
  visibility?: string
  stock?: string
  sort?: string
  page?: string
}

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'sku', label: 'SKU' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'updated', label: 'Recently edited' },
]

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const user = await requireUser()
  const sp = await searchParams

  const visibility = (['live', 'hidden', 'archived'] as const).find((v) => v === sp.visibility) as
    | VisibilityFilter
    | undefined
  const stock = (['in', 'out'] as const).find((s) => s === sp.stock) as StockFilter | undefined
  const sort = (SORTS.find((s) => s.value === sp.sort)?.value ?? 'sku') as ProductSort
  const page = Number.parseInt(sp.page ?? '1', 10) || 1

  const [{ rows, total }, options] = await Promise.all([
    listProducts({
      query: sp.q,
      category: sp.category,
      brand: sp.brand,
      visibility,
      stock,
      sort,
      page,
    }),
    getFilterOptions(),
  ])

  const writable = can.write(user)
  const removable = can.destroy(user)

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({
    q: sp.q,
    category: sp.category,
    brand: sp.brand,
    visibility,
    stock,
    sort: sp.sort,
  })) {
    if (value) params.set(key, value)
  }

  return (
    <>
      <PageHeader
        title="Catalogue"
        description={
          writable
            ? 'Edit pricing inline, hide products from the storefront, or remove them entirely.'
            : 'Your role is read-only, so pricing and visibility controls are disabled.'
        }
        actions={
          <span className="text-[12px] text-ink-400">
            {formatCount(total)} {total === 1 ? 'product' : 'products'}
          </span>
        }
      />

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="q" className="label mb-1.5 block">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q ?? ''}
            className="field"
            placeholder="Name, SKU or brand"
          />
        </div>

        <div>
          <label htmlFor="category" className="label mb-1.5 block">
            Category
          </label>
          <select id="category" name="category" defaultValue={sp.category ?? ''} className="field pr-8">
            <option value="">All</option>
            {options.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="brand" className="label mb-1.5 block">
            Brand
          </label>
          <select id="brand" name="brand" defaultValue={sp.brand ?? ''} className="field pr-8">
            <option value="">All</option>
            {options.brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="visibility" className="label mb-1.5 block">
            Visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            defaultValue={visibility ?? ''}
            className="field pr-8"
          >
            <option value="">Live and hidden</option>
            <option value="live">Live only</option>
            <option value="hidden">Hidden only</option>
            <option value="archived">Removed</option>
          </select>
        </div>

        <div>
          <label htmlFor="stock" className="label mb-1.5 block">
            Stock
          </label>
          <select id="stock" name="stock" defaultValue={stock ?? ''} className="field pr-8">
            <option value="">Any</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="label mb-1.5 block">
            Sort
          </label>
          <select id="sort" name="sort" defaultValue={sort} className="field pr-8">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-outline">
          Apply
        </button>
        {params.toString() && (
          <Link href="/products" className="btn-quiet">
            Clear
          </Link>
        )}
      </form>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState>No products match those filters.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr>
                  <th className="th">Product</th>
                  <th className="th">Category</th>
                  <th className="th text-right">Pricing</th>
                  <th className="th">State</th>
                  <th className="th">Edited</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.sku} className="align-top hover:bg-paper-50">
                    <td className="td">
                      <Link
                        href={`/products/${p.sku}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {p.sku} · {p.brand}
                        {p.variant && ` · ${p.variant}`}
                      </p>
                    </td>
                    <td className="td text-ink-500">{p.category}</td>
                    <td className="td">
                      <InlinePriceForm
                        sku={p.sku}
                        price={p.price}
                        mrp={p.mrp}
                        disabled={!writable || p.archivedAt !== null}
                      />
                    </td>
                    <td className="td">
                      <div className="flex flex-col items-start gap-1">
                        <VisibilityBadge isHidden={p.isHidden} archivedAt={p.archivedAt} />
                        {!p.inStock && <Badge tone="muted">Out of stock</Badge>}
                      </div>
                    </td>
                    <td className="td whitespace-nowrap text-ink-400">
                      {formatRelative(p.updatedAt)}
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {p.archivedAt ? (
                          removable && (
                            <form action={restoreProduct}>
                              <input type="hidden" name="sku" value={p.sku} />
                              <button type="submit" className="btn-quiet">
                                Restore
                              </button>
                            </form>
                          )
                        ) : (
                          <>
                            {writable && (
                              <>
                                <form action={toggleHidden}>
                                  <input type="hidden" name="sku" value={p.sku} />
                                  <button type="submit" className="btn-quiet">
                                    {p.isHidden ? 'Show' : 'Hide'}
                                  </button>
                                </form>
                                <form action={toggleStock}>
                                  <input type="hidden" name="sku" value={p.sku} />
                                  <button type="submit" className="btn-quiet">
                                    {p.inStock ? 'Mark out' : 'Restock'}
                                  </button>
                                </form>
                              </>
                            )}
                            {removable && (
                              <form action={archiveProduct}>
                                <input type="hidden" name="sku" value={p.sku} />
                                <button type="submit" className="btn-danger">
                                  Remove
                                </button>
                              </form>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} pageSize={PRODUCT_PAGE_SIZE} total={total} params={params} />
      </div>
    </>
  )
}
