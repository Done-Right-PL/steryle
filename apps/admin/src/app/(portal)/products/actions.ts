'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  appendPriceHistory,
  getProductBySku,
  updateProductFields,
  writeAudit,
} from '@steryle/db'
import { requireOwner, requireWriter } from '@/lib/auth'

export type ActionState = { ok?: string; error?: string }

const rupees = z.coerce
  .number({ invalid_type_error: 'Enter a number.' })
  .int('Use whole rupees.')
  .min(0, 'Cannot be negative.')
  .max(10_000_000, 'That looks too large — check the amount.')

const priceSchema = z.object({
  sku: z.string().min(1),
  price: rupees,
  mrp: rupees,
  note: z.string().max(280).optional(),
})

export async function updatePrice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireWriter()

  const parsed = priceSchema.safeParse({
    sku: formData.get('sku'),
    price: formData.get('price'),
    mrp: formData.get('mrp'),
    note: formData.get('note') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the values and try again.' }
  }

  const { sku, price, mrp, note } = parsed.data
  if (price > mrp) return { error: 'Selling price cannot exceed MRP.' }

  const existing = await getProductBySku(sku)
  if (!existing) return { error: 'Product not found.' }
  if (existing.price === price && existing.mrp === mrp) {
    return { ok: 'No change — those are the current values.' }
  }

  await updateProductFields(sku, { price, mrp })
  await appendPriceHistory({
    sku,
    previousPrice: existing.price,
    newPrice: price,
    previousMrp: existing.mrp,
    newMrp: mrp,
    changedBy: user.id,
    note,
  })
  await writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'product.price_changed',
    entity: 'product',
    entityId: sku,
    detail: {
      name: existing.name,
      from: { price: existing.price, mrp: existing.mrp },
      to: { price, mrp },
      note,
    },
  })

  revalidatePath('/products')
  revalidatePath(`/products/${sku}`)
  return { ok: 'Price updated.' }
}

const skuSchema = z.object({ sku: z.string().min(1) })

async function loadProduct(formData: FormData) {
  const parsed = skuSchema.safeParse({ sku: formData.get('sku') })
  if (!parsed.success) throw new Error('Invalid request.')
  const product = await getProductBySku(parsed.data.sku)
  if (!product) throw new Error('Product not found.')
  return product
}

export async function toggleHidden(formData: FormData) {
  const user = await requireWriter()
  const product = await loadProduct(formData)
  const isHidden = !product.isHidden
  await updateProductFields(product.sku, { isHidden })
  await writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: isHidden ? 'product.hidden' : 'product.unhidden',
    entity: 'product',
    entityId: product.sku,
    detail: { name: product.name },
  })
  revalidatePath('/products')
  revalidatePath(`/products/${product.sku}`)
}

export async function toggleStock(formData: FormData) {
  const user = await requireWriter()
  const product = await loadProduct(formData)
  const inStock = !product.inStock
  await updateProductFields(product.sku, { inStock })
  await writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: inStock ? 'product.restocked' : 'product.out_of_stock',
    entity: 'product',
    entityId: product.sku,
    detail: { name: product.name },
  })
  revalidatePath('/products')
  revalidatePath(`/products/${product.sku}`)
}

export async function archiveProduct(formData: FormData) {
  const user = await requireOwner()
  const product = await loadProduct(formData)
  await updateProductFields(product.sku, { archivedAt: new Date(), isHidden: true })
  await writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'product.archived',
    entity: 'product',
    entityId: product.sku,
    detail: { name: product.name },
  })
  revalidatePath('/products')
  revalidatePath(`/products/${product.sku}`)
}

export async function restoreProduct(formData: FormData) {
  const user = await requireOwner()
  const product = await loadProduct(formData)
  await updateProductFields(product.sku, { archivedAt: null })
  await writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'product.restored',
    entity: 'product',
    entityId: product.sku,
    detail: { name: product.name },
  })
  revalidatePath('/products')
  revalidatePath(`/products/${product.sku}`)
}

const detailsSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(3, 'Name is too short.').max(200),
  brand: z.string().min(1, 'Brand is required.').max(80),
  variant: z.string().max(80).optional().default(''),
  unit: z.string().max(40).optional().default(''),
  description: z.string().max(4000).optional().default(''),
})

export async function updateDetails(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireWriter()
  const parsed = detailsSchema.safeParse({
    sku: formData.get('sku'),
    name: formData.get('name'),
    brand: formData.get('brand'),
    variant: formData.get('variant') ?? '',
    unit: formData.get('unit') ?? '',
    description: formData.get('description') ?? '',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the values and try again.' }
  }

  const { sku, ...fields } = parsed.data
  await updateProductFields(sku, fields)
  await writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'product.details_changed',
    entity: 'product',
    entityId: sku,
    detail: { ...fields },
  })
  revalidatePath('/products')
  revalidatePath(`/products/${sku}`)
  return { ok: 'Details saved.' }
}
