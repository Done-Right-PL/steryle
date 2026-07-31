/**
 * Stryle persistence schema.
 *
 * The catalogue tables mirror the `Product` and `Category` shapes exported by
 * `@stryle/core` so the storefront can swap its static JSON for these rows
 * without a type change. Everything the admin portal adds on top —
 * visibility, archival, audit trail — lives in extra columns rather than a
 * parallel table, so there is exactly one row per SKU and one source of truth
 * for price.
 *
 * Money is stored as whole rupees (integer) because the catalogue has no
 * sub-rupee prices and `formatINR` renders with `maximumFractionDigits: 0`.
 */
import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

/** Shared timestamp defaults so every table records its own history. */
const createdAt = timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const updatedAt = timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()

/* -------------------------------------------------------------------------- */
/* Admin access                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Roles are ordered by capability: viewers read, admins edit the catalogue and
 * notifications, owners additionally manage other admins.
 */
export const adminRole = pgEnum('admin_role', ['owner', 'admin', 'viewer'])

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    /** scrypt digest, encoded as `scrypt$N$r$p$salt$hash`. Never a raw password. */
    passwordHash: text('password_hash').notNull(),
    role: adminRole('role').notNull().default('viewer'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex('admin_users_email_key').on(sql`lower(${t.email})`)],
)

/**
 * Sessions store only a SHA-256 digest of the cookie token, so a database leak
 * does not hand out live sessions.
 */
export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    userAgent: varchar('user_agent', { length: 400 }),
    createdAt,
  },
  (t) => [index('admin_sessions_user_idx').on(t.adminUserId)],
)

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

export const categories = pgTable('categories', {
  slug: varchar('slug', { length: 80 }).primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  code: varchar('code', { length: 8 }).notNull(),
  /** Matches `CategoryIconName` in @stryle/core; each app draws its own icon set. */
  icon: varchar('icon', { length: 24 }).notNull(),
  blurb: text('blurb').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt,
  updatedAt,
})

export const products = pgTable(
  'products',
  {
    sku: varchar('sku', { length: 24 }).primaryKey(),
    slug: varchar('slug', { length: 160 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    brand: varchar('brand', { length: 80 }).notNull(),
    category: varchar('category', { length: 120 }).notNull(),
    categorySlug: varchar('category_slug', { length: 80 })
      .notNull()
      .references(() => categories.slug),
    variant: varchar('variant', { length: 80 }).notNull().default(''),
    unit: varchar('unit', { length: 40 }).notNull().default(''),

    /** Selling price in whole rupees. */
    price: integer('price').notNull(),
    /** List price in whole rupees; `discountPct` is derived from the pair. */
    mrp: integer('mrp').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),

    rating: real('rating').notNull().default(0),
    reviews: integer('reviews').notNull().default(0),
    inStock: boolean('in_stock').notNull().default(true),
    hsn: integer('hsn'),

    description: text('description').notNull().default(''),
    highlights: jsonb('highlights').$type<string[]>().notNull().default([]),
    images: jsonb('images').$type<string[]>().notNull().default([]),

    /**
     * Admin visibility switch. Hidden products stay in the database (so past
     * orders keep resolving) but are filtered out of every storefront query.
     */
    isHidden: boolean('is_hidden').notNull().default(false),
    /** Soft delete. "Remove" in the admin UI sets this rather than dropping the row. */
    archivedAt: timestamp('archived_at', { withTimezone: true }),

    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('products_slug_key').on(t.slug),
    index('products_category_idx').on(t.categorySlug),
    index('products_brand_idx').on(t.brand),
    index('products_visibility_idx').on(t.isHidden, t.archivedAt),
  ],
)

/**
 * Every price change is appended here, so the admin portal can show what a SKU
 * used to cost and who changed it. The catalogue row always holds the current
 * price; this table is history only.
 */
export const priceHistory = pgTable(
  'price_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 24 })
      .notNull()
      .references(() => products.sku, { onDelete: 'cascade' }),
    previousPrice: integer('previous_price').notNull(),
    newPrice: integer('new_price').notNull(),
    previousMrp: integer('previous_mrp').notNull(),
    newMrp: integer('new_mrp').notNull(),
    changedBy: uuid('changed_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    note: varchar('note', { length: 280 }),
    createdAt,
  },
  (t) => [index('price_history_sku_idx').on(t.sku, t.createdAt)],
)

/* -------------------------------------------------------------------------- */
/* Storefront customers & orders                                              */
/* -------------------------------------------------------------------------- */

export const customerStatus = pgEnum('customer_status', ['active', 'blocked'])

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 255 }),
    /** E.164 without the +, e.g. 919876543210. The storefront signs in by phone. */
    phone: varchar('phone', { length: 20 }).notNull(),
    city: varchar('city', { length: 80 }),
    state: varchar('state', { length: 80 }),
    /** GSTIN for institutional buyers; null for individuals. */
    gstin: varchar('gstin', { length: 15 }),
    status: customerStatus('status').notNull().default('active'),
    marketingOptIn: boolean('marketing_opt_in').notNull().default(true),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('customers_phone_key').on(t.phone),
    index('customers_created_idx').on(t.createdAt),
  ],
)

export const orderStatus = pgEnum('order_status', [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
])

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Human-facing reference shown to customers, e.g. STR-24081. */
    reference: varchar('reference', { length: 24 }).notNull().unique(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    status: orderStatus('status').notNull().default('pending'),

    /** All amounts in whole rupees, matching the catalogue. */
    subtotal: integer('subtotal').notNull(),
    shipping: integer('shipping').notNull().default(0),
    tax: integer('tax').notNull().default(0),
    total: integer('total').notNull(),

    placedAt: timestamp('placed_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index('orders_customer_idx').on(t.customerId),
    index('orders_placed_idx').on(t.placedAt),
    index('orders_status_idx').on(t.status),
  ],
)

/**
 * Line items snapshot name and price at purchase time, so later catalogue edits
 * never rewrite historical order totals.
 */
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 24 })
      .notNull()
      .references(() => products.sku, { onDelete: 'restrict' }),
    name: varchar('name', { length: 200 }).notNull(),
    unitPrice: integer('unit_price').notNull(),
    qty: integer('qty').notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId), index('order_items_sku_idx').on(t.sku)],
)

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export const notificationChannel = pgEnum('notification_channel', ['push', 'in_app', 'email'])

export const notificationAudience = pgEnum('notification_audience', [
  'all',
  'active',
  'lapsed',
  'marketing_opt_in',
])

export const notificationStatus = pgEnum('notification_status', [
  'draft',
  'scheduled',
  'sent',
  'archived',
])

/**
 * Notification *content*, authored in the admin portal. Delivery is a separate
 * concern — nothing here sends anything yet; `sentAt` is set when a dispatcher
 * picks the row up.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 120 }).notNull(),
    body: text('body').notNull(),
    /** Optional in-app deep link, e.g. /category/ortho-care. */
    linkUrl: varchar('link_url', { length: 300 }),
    channel: notificationChannel('channel').notNull().default('in_app'),
    audience: notificationAudience('audience').notNull().default('all'),
    status: notificationStatus('status').notNull().default('draft'),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt,
    updatedAt,
  },
  (t) => [index('notifications_status_idx').on(t.status, t.createdAt)],
)

/* -------------------------------------------------------------------------- */
/* Audit trail                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Append-only record of every mutation made through the admin portal. Kept
 * deliberately generic (entity + id + JSON diff) so new admin screens get an
 * audit trail without a schema change.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    actorEmail: varchar('actor_email', { length: 255 }).notNull(),
    /** e.g. product.price_changed, notification.deleted, customer.blocked */
    action: varchar('action', { length: 60 }).notNull(),
    entity: varchar('entity', { length: 40 }).notNull(),
    entityId: varchar('entity_id', { length: 64 }).notNull(),
    detail: jsonb('detail').$type<Record<string, unknown>>(),
    createdAt,
  },
  (t) => [
    index('audit_log_entity_idx').on(t.entity, t.entityId),
    index('audit_log_created_idx').on(t.createdAt),
  ],
)

/* -------------------------------------------------------------------------- */
/* Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categorySlug],
    references: [categories.slug],
  }),
  orderItems: many(orderItems),
  priceHistory: many(priceHistory),
}))

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.sku], references: [products.sku] }),
}))

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
}))

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(adminUsers, {
    fields: [adminSessions.adminUserId],
    references: [adminUsers.id],
  }),
}))

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type AdminUser = typeof adminUsers.$inferSelect
export type AdminRole = (typeof adminRole.enumValues)[number]
export type AdminSession = typeof adminSessions.$inferSelect
export type CategoryRow = typeof categories.$inferSelect
export type ProductRow = typeof products.$inferSelect
export type NewProductRow = typeof products.$inferInsert
export type CustomerRow = typeof customers.$inferSelect
export type OrderRow = typeof orders.$inferSelect
export type OrderItemRow = typeof orderItems.$inferSelect
export type OrderStatus = (typeof orderStatus.enumValues)[number]
export type NotificationRow = typeof notifications.$inferSelect
export type NewNotificationRow = typeof notifications.$inferInsert
export type NotificationStatus = (typeof notificationStatus.enumValues)[number]
export type NotificationChannel = (typeof notificationChannel.enumValues)[number]
export type NotificationAudience = (typeof notificationAudience.enumValues)[number]
export type AuditLogRow = typeof auditLog.$inferSelect
