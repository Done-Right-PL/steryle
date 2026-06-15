import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'stryle.cart.v1'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { items: {} }
  } catch {
    return { items: {} }
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, qty = 1 } = action
      const existing = state.items[product.sku]
      const nextQty = (existing?.qty || 0) + qty
      return {
        items: {
          ...state.items,
          [product.sku]: {
            sku: product.sku,
            name: product.name,
            price: product.price,
            slug: product.slug,
            category: product.category,
            qty: nextQty,
          },
        },
      }
    }
    case 'SET_QTY': {
      const { sku, qty } = action
      if (qty <= 0) {
        const next = { ...state.items }
        delete next[sku]
        return { items: next }
      }
      return { items: { ...state.items, [sku]: { ...state.items[sku], qty } } }
    }
    case 'REMOVE': {
      const next = { ...state.items }
      delete next[action.sku]
      return { items: next }
    }
    case 'CLEAR':
      return { items: {} }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo(() => {
    const items = Object.values(state.items)
    const count = items.reduce((sum, i) => sum + i.qty, 0)
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0)
    const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 79
    const tax = Math.round(subtotal * 0.12)
    const total = subtotal + shipping + tax
    return {
      items,
      count,
      subtotal,
      shipping,
      tax,
      total,
      addItem: (product, qty) => dispatch({ type: 'ADD', product, qty }),
      setQty: (sku, qty) => dispatch({ type: 'SET_QTY', sku, qty }),
      removeItem: (sku) => dispatch({ type: 'REMOVE', sku }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
