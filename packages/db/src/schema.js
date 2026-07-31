"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSessionsRelations = exports.adminUsersRelations = exports.orderItemsRelations = exports.ordersRelations = exports.customersRelations = exports.productsRelations = exports.categoriesRelations = exports.auditLog = exports.notifications = exports.notificationStatus = exports.notificationAudience = exports.notificationChannel = exports.orderItems = exports.orders = exports.orderStatus = exports.customers = exports.customerStatus = exports.priceHistory = exports.products = exports.categories = exports.adminSessions = exports.adminUsers = exports.adminRole = void 0;
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
var drizzle_orm_1 = require("drizzle-orm");
var pg_core_1 = require("drizzle-orm/pg-core");
/** Shared timestamp defaults so every table records its own history. */
var createdAt = (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow();
var updatedAt = (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow();
/* -------------------------------------------------------------------------- */
/* Admin access                                                               */
/* -------------------------------------------------------------------------- */
/**
 * Roles are ordered by capability: viewers read, admins edit the catalogue and
 * notifications, owners additionally manage other admins.
 */
exports.adminRole = (0, pg_core_1.pgEnum)('admin_role', ['owner', 'admin', 'viewer']);
exports.adminUsers = (0, pg_core_1.pgTable)('admin_users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 120 }).notNull(),
    /** scrypt digest, encoded as `scrypt$N$r$p$salt$hash`. Never a raw password. */
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    role: (0, exports.adminRole)('role').notNull().default('viewer'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    lastLoginAt: (0, pg_core_1.timestamp)('last_login_at', { withTimezone: true }),
    createdAt: createdAt,
    updatedAt: updatedAt,
}, function (t) { return [(0, pg_core_1.uniqueIndex)('admin_users_email_key').on((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["lower(", ")"], ["lower(", ")"])), t.email))]; });
/**
 * Sessions store only a SHA-256 digest of the cookie token, so a database leak
 * does not hand out live sessions.
 */
exports.adminSessions = (0, pg_core_1.pgTable)('admin_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tokenHash: (0, pg_core_1.varchar)('token_hash', { length: 64 }).notNull().unique(),
    adminUserId: (0, pg_core_1.uuid)('admin_user_id')
        .notNull()
        .references(function () { return exports.adminUsers.id; }, { onDelete: 'cascade' }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    userAgent: (0, pg_core_1.varchar)('user_agent', { length: 400 }),
    createdAt: createdAt,
}, function (t) { return [(0, pg_core_1.index)('admin_sessions_user_idx').on(t.adminUserId)]; });
/* -------------------------------------------------------------------------- */
/* Catalogue                                                                  */
/* -------------------------------------------------------------------------- */
exports.categories = (0, pg_core_1.pgTable)('categories', {
    slug: (0, pg_core_1.varchar)('slug', { length: 80 }).primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 120 }).notNull(),
    code: (0, pg_core_1.varchar)('code', { length: 8 }).notNull(),
    /** Matches `CategoryIconName` in @stryle/core; each app draws its own icon set. */
    icon: (0, pg_core_1.varchar)('icon', { length: 24 }).notNull(),
    blurb: (0, pg_core_1.text)('blurb').notNull(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: createdAt,
    updatedAt: updatedAt,
});
exports.products = (0, pg_core_1.pgTable)('products', {
    sku: (0, pg_core_1.varchar)('sku', { length: 24 }).primaryKey(),
    slug: (0, pg_core_1.varchar)('slug', { length: 160 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    brand: (0, pg_core_1.varchar)('brand', { length: 80 }).notNull(),
    category: (0, pg_core_1.varchar)('category', { length: 120 }).notNull(),
    categorySlug: (0, pg_core_1.varchar)('category_slug', { length: 80 })
        .notNull()
        .references(function () { return exports.categories.slug; }),
    variant: (0, pg_core_1.varchar)('variant', { length: 80 }).notNull().default(''),
    unit: (0, pg_core_1.varchar)('unit', { length: 40 }).notNull().default(''),
    /** Selling price in whole rupees. */
    price: (0, pg_core_1.integer)('price').notNull(),
    /** List price in whole rupees; `discountPct` is derived from the pair. */
    mrp: (0, pg_core_1.integer)('mrp').notNull(),
    currency: (0, pg_core_1.varchar)('currency', { length: 3 }).notNull().default('INR'),
    rating: (0, pg_core_1.real)('rating').notNull().default(0),
    reviews: (0, pg_core_1.integer)('reviews').notNull().default(0),
    inStock: (0, pg_core_1.boolean)('in_stock').notNull().default(true),
    hsn: (0, pg_core_1.integer)('hsn'),
    description: (0, pg_core_1.text)('description').notNull().default(''),
    highlights: (0, pg_core_1.jsonb)('highlights').$type().notNull().default([]),
    images: (0, pg_core_1.jsonb)('images').$type().notNull().default([]),
    /**
     * Admin visibility switch. Hidden products stay in the database (so past
     * orders keep resolving) but are filtered out of every storefront query.
     */
    isHidden: (0, pg_core_1.boolean)('is_hidden').notNull().default(false),
    /** Soft delete. "Remove" in the admin UI sets this rather than dropping the row. */
    archivedAt: (0, pg_core_1.timestamp)('archived_at', { withTimezone: true }),
    createdAt: createdAt,
    updatedAt: updatedAt,
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('products_slug_key').on(t.slug),
    (0, pg_core_1.index)('products_category_idx').on(t.categorySlug),
    (0, pg_core_1.index)('products_brand_idx').on(t.brand),
    (0, pg_core_1.index)('products_visibility_idx').on(t.isHidden, t.archivedAt),
]; });
/**
 * Every price change is appended here, so the admin portal can show what a SKU
 * used to cost and who changed it. The catalogue row always holds the current
 * price; this table is history only.
 */
exports.priceHistory = (0, pg_core_1.pgTable)('price_history', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    sku: (0, pg_core_1.varchar)('sku', { length: 24 })
        .notNull()
        .references(function () { return exports.products.sku; }, { onDelete: 'cascade' }),
    previousPrice: (0, pg_core_1.integer)('previous_price').notNull(),
    newPrice: (0, pg_core_1.integer)('new_price').notNull(),
    previousMrp: (0, pg_core_1.integer)('previous_mrp').notNull(),
    newMrp: (0, pg_core_1.integer)('new_mrp').notNull(),
    changedBy: (0, pg_core_1.uuid)('changed_by').references(function () { return exports.adminUsers.id; }, { onDelete: 'set null' }),
    note: (0, pg_core_1.varchar)('note', { length: 280 }),
    createdAt: createdAt,
}, function (t) { return [(0, pg_core_1.index)('price_history_sku_idx').on(t.sku, t.createdAt)]; });
/* -------------------------------------------------------------------------- */
/* Storefront customers & orders                                              */
/* -------------------------------------------------------------------------- */
exports.customerStatus = (0, pg_core_1.pgEnum)('customer_status', ['active', 'blocked']);
exports.customers = (0, pg_core_1.pgTable)('customers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 120 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    /** E.164 without the +, e.g. 919876543210. The storefront signs in by phone. */
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }).notNull(),
    city: (0, pg_core_1.varchar)('city', { length: 80 }),
    state: (0, pg_core_1.varchar)('state', { length: 80 }),
    /** GSTIN for institutional buyers; null for individuals. */
    gstin: (0, pg_core_1.varchar)('gstin', { length: 15 }),
    status: (0, exports.customerStatus)('status').notNull().default('active'),
    marketingOptIn: (0, pg_core_1.boolean)('marketing_opt_in').notNull().default(true),
    lastSeenAt: (0, pg_core_1.timestamp)('last_seen_at', { withTimezone: true }),
    createdAt: createdAt,
    updatedAt: updatedAt,
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('customers_phone_key').on(t.phone),
    (0, pg_core_1.index)('customers_created_idx').on(t.createdAt),
]; });
exports.orderStatus = (0, pg_core_1.pgEnum)('order_status', [
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
]);
exports.orders = (0, pg_core_1.pgTable)('orders', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    /** Human-facing reference shown to customers, e.g. STR-24081. */
    reference: (0, pg_core_1.varchar)('reference', { length: 24 }).notNull().unique(),
    customerId: (0, pg_core_1.uuid)('customer_id')
        .notNull()
        .references(function () { return exports.customers.id; }, { onDelete: 'cascade' }),
    status: (0, exports.orderStatus)('status').notNull().default('pending'),
    /** All amounts in whole rupees, matching the catalogue. */
    subtotal: (0, pg_core_1.integer)('subtotal').notNull(),
    shipping: (0, pg_core_1.integer)('shipping').notNull().default(0),
    tax: (0, pg_core_1.integer)('tax').notNull().default(0),
    total: (0, pg_core_1.integer)('total').notNull(),
    placedAt: (0, pg_core_1.timestamp)('placed_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt,
    updatedAt: updatedAt,
}, function (t) { return [
    (0, pg_core_1.index)('orders_customer_idx').on(t.customerId),
    (0, pg_core_1.index)('orders_placed_idx').on(t.placedAt),
    (0, pg_core_1.index)('orders_status_idx').on(t.status),
]; });
/**
 * Line items snapshot name and price at purchase time, so later catalogue edits
 * never rewrite historical order totals.
 */
exports.orderItems = (0, pg_core_1.pgTable)('order_items', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)('order_id')
        .notNull()
        .references(function () { return exports.orders.id; }, { onDelete: 'cascade' }),
    sku: (0, pg_core_1.varchar)('sku', { length: 24 })
        .notNull()
        .references(function () { return exports.products.sku; }, { onDelete: 'restrict' }),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    unitPrice: (0, pg_core_1.integer)('unit_price').notNull(),
    qty: (0, pg_core_1.integer)('qty').notNull(),
}, function (t) { return [(0, pg_core_1.index)('order_items_order_idx').on(t.orderId), (0, pg_core_1.index)('order_items_sku_idx').on(t.sku)]; });
/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */
exports.notificationChannel = (0, pg_core_1.pgEnum)('notification_channel', ['push', 'in_app', 'email']);
exports.notificationAudience = (0, pg_core_1.pgEnum)('notification_audience', [
    'all',
    'active',
    'lapsed',
    'marketing_opt_in',
]);
exports.notificationStatus = (0, pg_core_1.pgEnum)('notification_status', [
    'draft',
    'scheduled',
    'sent',
    'archived',
]);
/**
 * Notification *content*, authored in the admin portal. Delivery is a separate
 * concern — nothing here sends anything yet; `sentAt` is set when a dispatcher
 * picks the row up.
 */
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    title: (0, pg_core_1.varchar)('title', { length: 120 }).notNull(),
    body: (0, pg_core_1.text)('body').notNull(),
    /** Optional in-app deep link, e.g. /category/ortho-care. */
    linkUrl: (0, pg_core_1.varchar)('link_url', { length: 300 }),
    channel: (0, exports.notificationChannel)('channel').notNull().default('in_app'),
    audience: (0, exports.notificationAudience)('audience').notNull().default('all'),
    status: (0, exports.notificationStatus)('status').notNull().default('draft'),
    scheduledFor: (0, pg_core_1.timestamp)('scheduled_for', { withTimezone: true }),
    sentAt: (0, pg_core_1.timestamp)('sent_at', { withTimezone: true }),
    createdBy: (0, pg_core_1.uuid)('created_by').references(function () { return exports.adminUsers.id; }, { onDelete: 'set null' }),
    createdAt: createdAt,
    updatedAt: updatedAt,
}, function (t) { return [(0, pg_core_1.index)('notifications_status_idx').on(t.status, t.createdAt)]; });
/* -------------------------------------------------------------------------- */
/* Audit trail                                                                */
/* -------------------------------------------------------------------------- */
/**
 * Append-only record of every mutation made through the admin portal. Kept
 * deliberately generic (entity + id + JSON diff) so new admin screens get an
 * audit trail without a schema change.
 */
exports.auditLog = (0, pg_core_1.pgTable)('audit_log', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    actorId: (0, pg_core_1.uuid)('actor_id').references(function () { return exports.adminUsers.id; }, { onDelete: 'set null' }),
    actorEmail: (0, pg_core_1.varchar)('actor_email', { length: 255 }).notNull(),
    /** e.g. product.price_changed, notification.deleted, customer.blocked */
    action: (0, pg_core_1.varchar)('action', { length: 60 }).notNull(),
    entity: (0, pg_core_1.varchar)('entity', { length: 40 }).notNull(),
    entityId: (0, pg_core_1.varchar)('entity_id', { length: 64 }).notNull(),
    detail: (0, pg_core_1.jsonb)('detail').$type(),
    createdAt: createdAt,
}, function (t) { return [
    (0, pg_core_1.index)('audit_log_entity_idx').on(t.entity, t.entityId),
    (0, pg_core_1.index)('audit_log_created_idx').on(t.createdAt),
]; });
/* -------------------------------------------------------------------------- */
/* Relations                                                                  */
/* -------------------------------------------------------------------------- */
exports.categoriesRelations = (0, drizzle_orm_1.relations)(exports.categories, function (_a) {
    var many = _a.many;
    return ({
        products: many(exports.products),
    });
});
exports.productsRelations = (0, drizzle_orm_1.relations)(exports.products, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        category: one(exports.categories, {
            fields: [exports.products.categorySlug],
            references: [exports.categories.slug],
        }),
        orderItems: many(exports.orderItems),
        priceHistory: many(exports.priceHistory),
    });
});
exports.customersRelations = (0, drizzle_orm_1.relations)(exports.customers, function (_a) {
    var many = _a.many;
    return ({
        orders: many(exports.orders),
    });
});
exports.ordersRelations = (0, drizzle_orm_1.relations)(exports.orders, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        customer: one(exports.customers, {
            fields: [exports.orders.customerId],
            references: [exports.customers.id],
        }),
        items: many(exports.orderItems),
    });
});
exports.orderItemsRelations = (0, drizzle_orm_1.relations)(exports.orderItems, function (_a) {
    var one = _a.one;
    return ({
        order: one(exports.orders, { fields: [exports.orderItems.orderId], references: [exports.orders.id] }),
        product: one(exports.products, { fields: [exports.orderItems.sku], references: [exports.products.sku] }),
    });
});
exports.adminUsersRelations = (0, drizzle_orm_1.relations)(exports.adminUsers, function (_a) {
    var many = _a.many;
    return ({
        sessions: many(exports.adminSessions),
    });
});
exports.adminSessionsRelations = (0, drizzle_orm_1.relations)(exports.adminSessions, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.adminUsers, {
            fields: [exports.adminSessions.adminUserId],
            references: [exports.adminUsers.id],
        }),
    });
});
var templateObject_1;
