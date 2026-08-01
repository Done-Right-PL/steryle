'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireWriter } from '@/lib/auth'
import { setQuoteStatus } from '@/lib/quotes'

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(['new', 'contacted', 'closed']),
})

export async function updateQuoteStatusAction(formData: FormData) {
  await requireWriter()
  const parsed = schema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  })
  if (!parsed.success) throw new Error('Invalid request.')

  const updated = await setQuoteStatus(parsed.data.id, parsed.data.status)
  if (!updated) throw new Error('Quote not found.')

  revalidatePath('/quotes')
}
