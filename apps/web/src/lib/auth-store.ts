'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'

export type CustomerSession = {
  id: string
  name: string
  phone: string
  email: string | null
  city?: string | null
  gstin?: string | null
  gstCompanyName?: string | null
}

type Snapshot = {
  customer: CustomerSession | null
  hydrated: boolean
}

const SERVER: Snapshot = { customer: null, hydrated: false }
let snapshot: Snapshot = SERVER
const listeners = new Set<() => void>()

const emit = () => {
  for (const l of listeners) l()
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

export function setCustomer(customer: CustomerSession | null) {
  snapshot = { customer, hydrated: true }
  emit()
}

export async function refreshCustomer(): Promise<CustomerSession | null> {
  try {
    const res = await apiFetch('/api/account/me')
    if (!res.ok) {
      setCustomer(null)
      return null
    }
    const data = (await res.json()) as { customer: CustomerSession | null }
    setCustomer(data.customer)
    return data.customer
  } catch {
    setCustomer(null)
    return null
  }
}

export async function logoutCustomer() {
  await apiFetch('/api/account/logout', { method: 'POST' }).catch(() => null)
  setCustomer(null)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!snapshot.hydrated) {
    void refreshCustomer()
  }
  return () => listeners.delete(listener)
}

export function useCustomer() {
  const snap = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER,
  )

  useEffect(() => {
    if (!snap.hydrated) void refreshCustomer()
  }, [snap.hydrated])

  return useMemo(
    () => ({
      customer: snap.customer,
      hydrated: snap.hydrated,
      refresh: refreshCustomer,
      logout: logoutCustomer,
      setCustomer,
    }),
    [snap.customer, snap.hydrated],
  )
}
