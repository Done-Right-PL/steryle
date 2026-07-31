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
} from '@stryle/core'

const STORAGE_KEY = 'stryle.cart.v2'

interface Snapshot {
  items: CartState
  hydrated: boolean
}

/**
 * The server (and the first client render) must agree on an empty cart, so the
 * real contents are read from localStorage only once a subscriber mounts. This
 * keeps hydration stable without reading storage during render.
 */
const SERVER_SNAPSHOT: Snapshot = { items: {}, hydrated: false }

let snapshot: Snapshot = SERVER_SNAPSHOT
const listeners = new Set<() => void>()

const emit = () => {
  for (const listener of listeners) listener()
}

const persist = (items: CartState) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage full or blocked; the in-memory cart still works.
  }
}

const commit = (items: CartState) => {
  snapshot = { items, hydrated: true }
  persist(items)
  emit()
}

function hydrateOnce() {
  if (snapshot.hydrated) return
  let items: CartState = {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) items = JSON.parse(raw) as CartState
  } catch {
    // Corrupt or unavailable storage: start from an empty cart.
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

export const cartStore = {
  add: (product: Product, qty = 1) => commit(addToCart(snapshot.items, product, qty)),
  setQty: (sku: string, qty: number) => commit(setCartQty(snapshot.items, sku, qty)),
  remove: (sku: string) => commit(removeFromCart(snapshot.items, sku)),
  clear: () => commit({}),
}

export interface CartApi extends CartTotals {
  items: CartLine[]
  /** False until localStorage has been read, so SSR and first paint agree. */
  hydrated: boolean
  add: typeof cartStore.add
  setQty: typeof cartStore.setQty
  remove: typeof cartStore.remove
  clear: typeof cartStore.clear
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
