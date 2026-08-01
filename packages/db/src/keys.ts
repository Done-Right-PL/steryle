import type {
  AdminSession,
  AdminUser,
  AuditLogRow,
  CategoryRow,
  CustomerRow,
  DynItem,
  NotificationRow,
  OrderItemRow,
  OrderRow,
  PriceHistoryRow,
  ProductRow,
  QuoteRequestRow,
} from './types'

const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return new Date(0)
}

const toDateOrNull = (value: unknown): Date | null => {
  if (value == null || value === '') return null
  return toDate(value)
}

export const keys = {
  admin: (id: string) => ({ pk: `ADMIN#${id}`, sk: 'PROFILE' }),
  adminEmail: (email: string) => ({
    gsi1pk: `ADMINEMAIL#${email.trim().toLowerCase()}`,
    gsi1sk: 'ADMIN',
  }),
  session: (tokenHash: string) => ({ pk: `SESSION#${tokenHash}`, sk: 'SESSION' }),
  category: (slug: string) => ({ pk: `CATEGORY#${slug}`, sk: 'CATEGORY' }),
  categoriesIndex: (sortOrder: number, slug: string) => ({
    gsi1pk: 'CATEGORIES',
    gsi1sk: `SORT#${String(sortOrder).padStart(4, '0')}#${slug}`,
  }),
  product: (sku: string) => ({ pk: `PRODUCT#${sku}`, sk: 'PRODUCT' }),
  productsByCategory: (categorySlug: string, sku: string) => ({
    gsi1pk: `CAT#${categorySlug}`,
    gsi1sk: `PRODUCT#${sku}`,
  }),
  productsIndex: (updatedAt: string, sku: string) => ({
    gsi2pk: 'PRODUCTS',
    gsi2sk: `UPDATED#${updatedAt}#${sku}`,
  }),
  priceHistory: (sku: string, createdAt: string, id: string) => ({
    pk: `PRODUCT#${sku}`,
    sk: `PRICE#${createdAt}#${id}`,
  }),
  customer: (id: string) => ({ pk: `CUSTOMER#${id}`, sk: 'PROFILE' }),
  customersIndex: (createdAt: string, id: string) => ({
    gsi1pk: 'CUSTOMERS',
    gsi1sk: `CREATED#${createdAt}#${id}`,
  }),
  customerPhone: (phone: string) => ({
    gsi2pk: `PHONE#${phone}`,
    gsi2sk: 'CUSTOMER',
  }),
  order: (customerId: string, placedAt: string, id: string) => ({
    pk: `CUSTOMER#${customerId}`,
    sk: `ORDER#${placedAt}#${id}`,
  }),
  ordersIndex: (placedAt: string, id: string) => ({
    gsi1pk: 'ORDERS',
    gsi1sk: `PLACED#${placedAt}#${id}`,
  }),
  orderRef: (reference: string) => ({
    gsi2pk: `ORDERREF#${reference}`,
    gsi2sk: 'ORDER',
  }),
  orderMeta: (id: string) => ({ pk: `ORDER#${id}`, sk: 'META' }),
  orderItem: (orderId: string, sku: string) => ({
    pk: `ORDER#${orderId}`,
    sk: `ITEM#${sku}`,
  }),
  notification: (id: string) => ({ pk: `NOTIF#${id}`, sk: 'NOTIF' }),
  notificationsIndex: (status: string, createdAt: string, id: string) => ({
    gsi1pk: 'NOTIFS',
    gsi1sk: `STATUS#${status}#${createdAt}#${id}`,
  }),
  audit: (createdAt: string, id: string) => ({
    pk: `AUDIT#${createdAt.slice(0, 10)}`,
    sk: `AUDIT#${createdAt}#${id}`,
  }),
  quote: (id: string) => ({ pk: `QUOTE#${id}`, sk: 'QUOTE' }),
  quotesIndex: (createdAt: string, id: string) => ({
    gsi1pk: 'QUOTES',
    gsi1sk: `CREATED#${createdAt}#${id}`,
  }),
}

export function adminFromItem(item: DynItem): AdminUser {
  return {
    id: String(item.id),
    email: String(item.email),
    name: String(item.name),
    passwordHash: String(item.passwordHash),
    role: item.role as AdminUser['role'],
    isActive: Boolean(item.isActive),
    lastLoginAt: toDateOrNull(item.lastLoginAt),
    createdAt: toDate(item.createdAt),
    updatedAt: toDate(item.updatedAt),
  }
}

export function sessionFromItem(item: DynItem): AdminSession {
  return {
    tokenHash: String(item.tokenHash),
    adminUserId: String(item.adminUserId),
    expiresAt: toDate(item.expiresAtIso ?? item.expiresAt),
    userAgent: item.userAgent == null ? null : String(item.userAgent),
    createdAt: toDate(item.createdAt),
  }
}

export function categoryFromItem(item: DynItem): CategoryRow {
  return {
    slug: String(item.slug),
    name: String(item.name),
    code: String(item.code),
    icon: String(item.icon),
    blurb: String(item.blurb),
    sortOrder: Number(item.sortOrder ?? 0),
    createdAt: toDate(item.createdAt),
    updatedAt: toDate(item.updatedAt),
  }
}

export function productFromItem(item: DynItem): ProductRow {
  return {
    sku: String(item.sku),
    slug: String(item.slug),
    name: String(item.name),
    brand: String(item.brand),
    category: String(item.category),
    categorySlug: String(item.categorySlug),
    variant: String(item.variant ?? ''),
    unit: String(item.unit ?? ''),
    price: Number(item.price),
    mrp: Number(item.mrp),
    currency: String(item.currency ?? 'INR'),
    rating: Number(item.rating ?? 0),
    reviews: Number(item.reviews ?? 0),
    inStock: Boolean(item.inStock),
    hsn: item.hsn == null ? null : Number(item.hsn),
    description: String(item.description ?? ''),
    highlights: Array.isArray(item.highlights) ? (item.highlights as string[]) : [],
    images: Array.isArray(item.images) ? (item.images as string[]) : [],
    isHidden: Boolean(item.isHidden),
    archivedAt: toDateOrNull(item.archivedAt),
    createdAt: toDate(item.createdAt),
    updatedAt: toDate(item.updatedAt),
  }
}

export function priceHistoryFromItem(item: DynItem): PriceHistoryRow {
  return {
    id: String(item.id),
    sku: String(item.sku),
    previousPrice: Number(item.previousPrice),
    newPrice: Number(item.newPrice),
    previousMrp: Number(item.previousMrp),
    newMrp: Number(item.newMrp),
    changedBy: item.changedBy == null ? null : String(item.changedBy),
    note: item.note == null ? null : String(item.note),
    createdAt: toDate(item.createdAt),
  }
}

export function customerFromItem(item: DynItem): CustomerRow {
  return {
    id: String(item.id),
    name: String(item.name),
    email: item.email == null ? null : String(item.email),
    phone: String(item.phone),
    city: item.city == null ? null : String(item.city),
    state: item.state == null ? null : String(item.state),
    gstin: item.gstin == null ? null : String(item.gstin),
    status: item.status as CustomerRow['status'],
    marketingOptIn: Boolean(item.marketingOptIn),
    lastSeenAt: toDateOrNull(item.lastSeenAt),
    createdAt: toDate(item.createdAt),
    updatedAt: toDate(item.updatedAt),
  }
}

export function orderFromItem(item: DynItem): OrderRow {
  return {
    id: String(item.id),
    reference: String(item.reference),
    customerId: String(item.customerId),
    status: item.status as OrderRow['status'],
    subtotal: Number(item.subtotal),
    shipping: Number(item.shipping ?? 0),
    tax: Number(item.tax ?? 0),
    total: Number(item.total),
    placedAt: toDate(item.placedAt),
    createdAt: toDate(item.createdAt),
    updatedAt: toDate(item.updatedAt),
  }
}

export function orderItemFromItem(item: DynItem): OrderItemRow {
  return {
    id: String(item.id),
    orderId: String(item.orderId),
    sku: String(item.sku),
    name: String(item.name),
    unitPrice: Number(item.unitPrice),
    qty: Number(item.qty),
  }
}

export function notificationFromItem(item: DynItem): NotificationRow {
  return {
    id: String(item.id),
    title: String(item.title),
    body: String(item.body),
    linkUrl: item.linkUrl == null ? null : String(item.linkUrl),
    channel: item.channel as NotificationRow['channel'],
    audience: item.audience as NotificationRow['audience'],
    status: item.status as NotificationRow['status'],
    scheduledFor: toDateOrNull(item.scheduledFor),
    sentAt: toDateOrNull(item.sentAt),
    createdBy: item.createdBy == null ? null : String(item.createdBy),
    createdAt: toDate(item.createdAt),
    updatedAt: toDate(item.updatedAt),
  }
}

export function auditFromItem(item: DynItem): AuditLogRow {
  return {
    id: String(item.id),
    actorId: item.actorId == null ? null : String(item.actorId),
    actorEmail: String(item.actorEmail),
    action: String(item.action),
    entity: String(item.auditEntity ?? item.entity),
    entityId: String(item.entityId),
    detail: (item.detail as Record<string, unknown> | null) ?? null,
    createdAt: toDate(item.createdAt),
  }
}

export function quoteFromItem(item: DynItem): QuoteRequestRow {
  return {
    id: String(item.id),
    organisation: String(item.organisation),
    requirement: String(item.requirement),
    contactName: item.contactName == null ? null : String(item.contactName),
    contactPhone: item.contactPhone == null ? null : String(item.contactPhone),
    status: (item.status as QuoteRequestRow['status']) || 'new',
    createdAt: toDate(item.createdAt),
    updatedAt: toDate(item.updatedAt),
  }
}
