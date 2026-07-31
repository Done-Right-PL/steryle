'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { signIn } from '@/lib/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  next: z.string().optional(),
})

export type LoginState = { error?: string }

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const userAgent = (await headers()).get('user-agent') ?? undefined
  const result = await signIn(parsed.data.email, parsed.data.password, userAgent)

  if (!result.ok) return { error: result.error }

  /*
   * Only allow same-origin relative paths through, so a crafted
   * ?next=https://evil.example link cannot turn login into an open redirect.
   */
  const target = parsed.data.next
  const safeNext = target && target.startsWith('/') && !target.startsWith('//') ? target : '/'

  redirect(safeNext)
}
