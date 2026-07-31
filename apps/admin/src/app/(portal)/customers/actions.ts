'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auditLog, customers, db } from '@stryle/db'
import { requireWriter } from '@/lib/auth'

const setStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['active', 'blocked']),
})

/**
 * Blocking is reversible and keeps all order history intact — customers are
 * never deleted, because their orders reference them.
 */
export async function setCustomerStatus(formData: FormData) {
  const user = await requireWriter()

  const parsed = setStatusSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  })
  if (!parsed.success) throw new Error('Invalid request.')

  const { id, status } = parsed.data

  const [updated] = await db
    .update(customers)
    .set({ status, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning({ id: customers.id, name: customers.name })

  if (!updated) throw new Error('Customer not found.')

  await db.insert(auditLog).values({
    actorId: user.id,
    actorEmail: user.email,
    action: status === 'blocked' ? 'customer.blocked' : 'customer.unblocked',
    entity: 'customer',
    entityId: id,
    detail: { name: updated.name, status },
  })

  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
}

const marketingSchema = z.object({
  id: z.string().uuid(),
  optIn: z.enum(['true', 'false']),
})

export async function setMarketingOptIn(formData: FormData) {
  const user = await requireWriter()

  const parsed = marketingSchema.safeParse({
    id: formData.get('id'),
    optIn: formData.get('optIn'),
  })
  if (!parsed.success) throw new Error('Invalid request.')

  const marketingOptIn = parsed.data.optIn === 'true'

  await db
    .update(customers)
    .set({ marketingOptIn, updatedAt: new Date() })
    .where(eq(customers.id, parsed.data.id))

  await db.insert(auditLog).values({
    actorId: user.id,
    actorEmail: user.email,
    action: 'customer.marketing_changed',
    entity: 'customer',
    entityId: parsed.data.id,
    detail: { marketingOptIn },
  })

  revalidatePath(`/customers/${parsed.data.id}`)
}
