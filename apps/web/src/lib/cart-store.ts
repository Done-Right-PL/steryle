'use client'

import { useMemo, useSyncExternalStore } from 'react'
import {
  addToCart,
  cartLines,
  cartTotals,
  removeFromCart,
  setCartQty,
  type CartLine,
  type CartState,
  type CartTotals,
  type Product,
} from '@steryle/core'
import { apiFetch } from './auth-store'

const STORAGE_KEY = 'steryle.cart.v2'

interface Snapshot {
  items: CartState
  hydrated: boolean
}

const SERVER_SNAPSHOT: Snapshot = { items: {}, hydrated: false }

let snapshot: Snapshot = SERVER_SNAPSHOT
const listeners = new Set<() => void>()
let authed = false

const emit = () => {
  for (const listener of listeners) listener()
}

const persist = (items: CartState) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

const syncRemote = (items: CartState) => {
  if (!authed) return
  const lines = cartLines(items)
  void apiFetch('/api/account/cart', {
    method: 'PUT',
    body: JSON.stringify({ items: lines }),
  }).catch(() => null)
}

const commit = (items: CartState) => {
  snapshot = { items, hydrated: true }
  persist(items)
  syncRemote(items)
  emit()
}

function hydrateOnce() {
  if (snapshot.hydrated) return
  let items: CartState = {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) items = JSON.parse(raw) as CartState
  } catch {
    // ignore
  }
  snapshot = { items, hydrated: true }
  emit()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  hydrateOnce()
  return () => {
    listeners.delete(listener)
  }
}

function stateFromLines(lines: CartLine[]): CartState {
  return Object.fromEntries(lines.map((l) => [l.sku, l]))
}

export const cartStore = {
  add: (product: Product, qty = 1) => commit(addToCart(snapshot.items, product, qty)),
  setQty: (sku: string, qty: number) => commit(setCartQty(snapshot.items, sku, qty)),
  replace: (lines: CartLine[]) => commit(stateFromLines(lines)),
  remove: (sku: string) => commit(removeFromCart(snapshot.items, sku)),
  clear: () => commit({}),
  /** Call after login/logout so cart syncs with the account. */
  setAuthed: (value: boolean) => {
    authed = value
  },
  getLines: () => cartLines(snapshot.items),
}

export interface CartApi extends CartTotals {
  items: CartLine[]
  hydrated: boolean
  add: typeof cartStore.add
  setQty: typeof cartStore.setQty
  remove: typeof cartStore.remove
  clear: typeof cartStore.clear
  replace: typeof cartStore.replace
}

export function useCart(): CartApi {
  const { items, hydrated } = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  )

  return useMemo(() => {
    const lines = cartLines(items)
    return { items: lines, hydrated, ...cartTotals(lines), ...cartStore }
  }, [items, hydrated])
}
