'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCustomerById, updateCustomerFields, writeAudit } from '@steryle/db'
import { requireWriter } from '@/lib/auth'

const setStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['active', 'blocked']),
})

export async function setCustomerStatus(formData: FormData) {
  const user = await requireWriter()
  const parsed = setStatusSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  })
  if (!parsed.success) throw new Error('Invalid request.')

  const { id, status } = parsed.data
  const updated = await updateCustomerFields(id, { status })
  if (!updated) throw new Error('Customer not found.')

  await writeAudit({
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
  id: z.string().min(1),
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
  const existing = await getCustomerById(parsed.data.id)
  if (!existing) throw new Error('Customer not found.')

  await updateCustomerFields(parsed.data.id, { marketingOptIn })
  await writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'customer.marketing_changed',
    entity: 'customer',
    entityId: parsed.data.id,
    detail: { marketingOptIn },
  })

  revalidatePath(`/customers/${parsed.data.id}`)
}
