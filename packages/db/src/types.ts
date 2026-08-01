export type AdminRole = 'owner' | 'admin' | 'viewer'
export type CustomerStatus = 'active' | 'blocked'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
export type NotificationChannel = 'push' | 'in_app' | 'email'
export type NotificationAudience = 'all' | 'active' | 'lapsed' | 'marketing_opt_in'
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'archived'

export type AdminUser = {
  id: string
  email: string
  name: string
  passwordHash: string
  role: AdminRole
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type AdminSession = {
  tokenHash: string
  adminUserId: string
  expiresAt: Date
  userAgent: string | null
  createdAt: Date
}

export type CategoryRow = {
  slug: string
  name: string
  code: string
  icon: string
  blurb: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type ProductRow = {
  sku: string
  slug: string
  name: string
  brand: string
  category: string
  categorySlug: string
  variant: string
  unit: string
  price: number
  mrp: number
  currency: string
  rating: number
  reviews: number
  inStock: boolean
  hsn: number | null
  description: string
  highlights: string[]
  images: string[]
  isHidden: boolean
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type PriceHistoryRow = {
  id: string
  sku: string
  previousPrice: number
  newPrice: number
  previousMrp: number
  newMrp: number
  changedBy: string | null
  note: string | null
  createdAt: Date
}

export type CustomerRow = {
  id: string
  name: string
  email: string | null
  phone: string
  city: string | null
  state: string | null
  gstin: string | null
  /** Legal / trade name on the GST registration (for invoices). */
  gstCompanyName: string | null
  status: CustomerStatus
  marketingOptIn: boolean
  lastSeenAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type OrderItemRow = {
  id: string
  orderId: string
  sku: string
  name: string
  unitPrice: number
  qty: number
}

export type OrderRow = {
  id: string
  reference: string
  customerId: string
  status: OrderStatus
  subtotal: number
  shipping: number
  tax: number
  total: number
  paymentMethod?: string | null
  razorpayOrderId?: string | null
  razorpayPaymentId?: string | null
  shippingName?: string | null
  shippingPhone?: string | null
  shippingEmail?: string | null
  shippingAddress?: string | null
  shippingCity?: string | null
  shippingPin?: string | null
  gstin?: string | null
  placedAt: Date
  createdAt: Date
  updatedAt: Date
  items?: OrderItemRow[]
}

export type NotificationRow = {
  id: string
  title: string
  body: string
  linkUrl: string | null
  channel: NotificationChannel
  audience: NotificationAudience
  status: NotificationStatus
  scheduledFor: Date | null
  sentAt: Date | null
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

export type AuditLogRow = {
  id: string
  actorId: string | null
  actorEmail: string
  action: string
  entity: string
  entityId: string
  detail: Record<string, unknown> | null
  createdAt: Date
}

export type QuoteStatus = 'new' | 'contacted' | 'closed'

export type QuoteRequestRow = {
  id: string
  organisation: string
  requirement: string
  contactName: string | null
  contactPhone: string | null
  status: QuoteStatus
  createdAt: Date
  updatedAt: Date
}

/** Raw DynamoDB item envelope. */
export type DynItem = Record<string, unknown> & {
  pk: string
  sk: string
  entity: string
  gsi1pk?: string
  gsi1sk?: string
  gsi2pk?: string
  gsi2sk?: string
  expiresAt?: number
}
