import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
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

interface CartStore {
  items: CartState
  hydrated: boolean
  hydrate: () => Promise<void>
  add: (product: Product, qty?: number) => void
  setQty: (sku: string, qty: number) => void
  remove: (sku: string) => void
  clear: () => void
  lines: () => CartLine[]
  totals: () => CartTotals
}

/** Fire-and-forget: a failed write must never block a cart interaction. */
const persist = (items: CartState) => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {})
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: {},
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) set({ items: JSON.parse(raw) as CartState })
    } catch {
      // Corrupt or unavailable storage: start from an empty cart.
    }
    set({ hydrated: true })
  },

  add: (product, qty = 1) => {
    const items = addToCart(get().items, product, qty)
    set({ items })
    persist(items)
  },

  setQty: (sku, qty) => {
    const items = setCartQty(get().items, sku, qty)
    set({ items })
    persist(items)
  },

  remove: (sku) => {
    const items = removeFromCart(get().items, sku)
    set({ items })
    persist(items)
  },

  clear: () => {
    set({ items: {} })
    persist({})
  },

  lines: () => cartLines(get().items),
  totals: () => cartTotals(cartLines(get().items)),
}))

/** Badge count, kept as a narrow selector so the tab bar re-renders rarely. */
export const useCartCount = () =>
  useCartStore((s) => Object.values(s.items).reduce((sum, l) => sum + l.qty, 0))
