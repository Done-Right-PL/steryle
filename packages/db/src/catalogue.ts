import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { createId, doc, nowIso, tableName } from './client'
import {
  adminFromItem,
  categoryFromItem,
  keys,
  priceHistoryFromItem,
  productFromItem,
  sessionFromItem,
} from './keys'
import type {
  AdminRole,
  AdminSession,
  AdminUser,
  CategoryRow,
  DynItem,
  PriceHistoryRow,
  ProductRow,
} from './types'

async function queryAll(params: ConstructorParameters<typeof QueryCommand>[0]): Promise<DynItem[]> {
  const out: DynItem[] = []
  let ExclusiveStartKey: Record<string, unknown> | undefined
  do {
    const res = await doc.send(
      new QueryCommand({ ...params, ExclusiveStartKey }),
    )
    out.push(...((res.Items as DynItem[]) ?? []))
    ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (ExclusiveStartKey)
  return out
}

async function scanEntity(entity: string): Promise<DynItem[]> {
  const out: DynItem[] = []
  let ExclusiveStartKey: Record<string, unknown> | undefined
  do {
    const res = await doc.send(
      new ScanCommand({
        TableName: tableName(),
        FilterExpression: '#e = :e',
        ExpressionAttributeNames: { '#e': 'entity' },
        ExpressionAttributeValues: { ':e': entity },
        ExclusiveStartKey,
      }),
    )
    out.push(...((res.Items as DynItem[]) ?? []))
    ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (ExclusiveStartKey)
  return out
}

/* -------------------------------------------------------------------------- */
/* Admin users / sessions                                                     */
/* -------------------------------------------------------------------------- */

export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  const index = keys.adminEmail(email)
  const items = await queryAll({
    TableName: tableName(),
    IndexName: 'gsi1',
    KeyConditionExpression: 'gsi1pk = :pk AND gsi1sk = :sk',
    ExpressionAttributeValues: { ':pk': index.gsi1pk, ':sk': index.gsi1sk },
    Limit: 1,
  })
  const item = items[0]
  return item ? adminFromItem(item) : null
}

export async function getAdminById(id: string): Promise<AdminUser | null> {
  const res = await doc.send(
    new GetCommand({ TableName: tableName(), Key: keys.admin(id) }),
  )
  return res.Item ? adminFromItem(res.Item as DynItem) : null
}

export async function putAdminUser(input: {
  id?: string
  email: string
  name: string
  passwordHash: string
  role: AdminRole
}): Promise<AdminUser> {
  const id = input.id ?? createId()
  const createdAt = nowIso()
  const item: DynItem = {
    ...keys.admin(id),
    ...keys.adminEmail(input.email),
    entity: 'admin',
    id,
    email: input.email.trim().toLowerCase(),
    name: input.name,
    passwordHash: input.passwordHash,
    role: input.role,
    isActive: true,
    lastLoginAt: null,
    createdAt,
    updatedAt: createdAt,
  }
  await doc.send(
    new PutCommand({
      TableName: tableName(),
      Item: item,
      ConditionExpression: 'attribute_not_exists(pk)',
    }),
  )
  return adminFromItem(item)
}

export async function touchAdminLogin(id: string): Promise<void> {
  await doc.send(
    new UpdateCommand({
      TableName: tableName(),
      Key: keys.admin(id),
      UpdateExpression: 'SET lastLoginAt = :t, updatedAt = :t',
      ExpressionAttributeValues: { ':t': nowIso() },
    }),
  )
}

export async function putSession(session: {
  tokenHash: string
  adminUserId: string
  expiresAt: Date
  userAgent?: string
}): Promise<void> {
  const createdAt = nowIso()
  const expiresAtIso = session.expiresAt.toISOString()
  await doc.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        ...keys.session(session.tokenHash),
        entity: 'session',
        tokenHash: session.tokenHash,
        adminUserId: session.adminUserId,
        expiresAtIso,
        // DynamoDB TTL expects epoch seconds.
        expiresAt: Math.floor(session.expiresAt.getTime() / 1000),
        userAgent: session.userAgent?.slice(0, 400) ?? null,
        createdAt,
        gsi1pk: `ADMIN#${session.adminUserId}`,
        gsi1sk: `SESSION#${expiresAtIso}`,
      },
    }),
  )
}

export async function getSession(tokenHash: string): Promise<AdminSession | null> {
  const res = await doc.send(
    new GetCommand({ TableName: tableName(), Key: keys.session(tokenHash) }),
  )
  if (!res.Item) return null
  return sessionFromItem(res.Item as DynItem)
}

export async function deleteSession(tokenHash: string): Promise<void> {
  await doc.send(
    new DeleteCommand({ TableName: tableName(), Key: keys.session(tokenHash) }),
  )
}

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

export async function listAllProducts(): Promise<ProductRow[]> {
  const items = await queryAll({
    TableName: tableName(),
    IndexName: 'gsi2',
    KeyConditionExpression: 'gsi2pk = :pk',
    ExpressionAttributeValues: { ':pk': 'PRODUCTS' },
  })
  return items.map(productFromItem)
}

export async function getProductBySku(sku: string): Promise<ProductRow | null> {
  const res = await doc.send(
    new GetCommand({ TableName: tableName(), Key: keys.product(sku) }),
  )
  return res.Item ? productFromItem(res.Item as DynItem) : null
}

export async function putProduct(row: Omit<ProductRow, 'createdAt' | 'updatedAt'> & {
  createdAt?: Date
  updatedAt?: Date
}, opts?: { overwritePricing?: boolean }): Promise<void> {
  const existing = await getProductBySku(row.sku)
  const createdAt = (row.createdAt ?? existing?.createdAt ?? new Date()).toISOString()
  const updatedAt = (row.updatedAt ?? new Date()).toISOString()

  const price = opts?.overwritePricing === false && existing ? existing.price : row.price
  const mrp = opts?.overwritePricing === false && existing ? existing.mrp : row.mrp
  const isHidden = opts?.overwritePricing === false && existing ? existing.isHidden : row.isHidden
  const archivedAt =
    opts?.overwritePricing === false && existing
      ? existing.archivedAt
      : row.archivedAt

  const item: DynItem = {
    ...keys.product(row.sku),
    ...keys.productsByCategory(row.categorySlug, row.sku),
    ...keys.productsIndex(updatedAt, row.sku),
    entity: 'product',
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    categorySlug: row.categorySlug,
    variant: row.variant,
    unit: row.unit,
    price,
    mrp,
    currency: row.currency,
    rating: row.rating,
    reviews: row.reviews,
    inStock: row.inStock,
    hsn: row.hsn,
    description: row.description,
    highlights: row.highlights,
    images: row.images,
    isHidden,
    archivedAt: archivedAt ? archivedAt.toISOString() : null,
    createdAt,
    updatedAt,
  }

  await doc.send(new PutCommand({ TableName: tableName(), Item: item }))
}

export async function updateProductFields(
  sku: string,
  fields: Partial<
    Pick<
      ProductRow,
      | 'price'
      | 'mrp'
      | 'name'
      | 'brand'
      | 'variant'
      | 'unit'
      | 'description'
      | 'isHidden'
      | 'inStock'
      | 'archivedAt'
    >
  >,
): Promise<ProductRow | null> {
  const existing = await getProductBySku(sku)
  if (!existing) return null
  const next: ProductRow = {
    ...existing,
    ...fields,
    updatedAt: new Date(),
  }
  await putProduct(next, { overwritePricing: true })
  return next
}

export async function listCategories(): Promise<CategoryRow[]> {
  const items = await queryAll({
    TableName: tableName(),
    IndexName: 'gsi1',
    KeyConditionExpression: 'gsi1pk = :pk',
    ExpressionAttributeValues: { ':pk': 'CATEGORIES' },
  })
  return items.map(categoryFromItem)
}

export async function putCategory(row: Omit<CategoryRow, 'createdAt' | 'updatedAt'> & {
  createdAt?: Date
  updatedAt?: Date
}): Promise<void> {
  const createdAt = (row.createdAt ?? new Date()).toISOString()
  const updatedAt = (row.updatedAt ?? new Date()).toISOString()
  await doc.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        ...keys.category(row.slug),
        ...keys.categoriesIndex(row.sortOrder, row.slug),
        entity: 'category',
        slug: row.slug,
        name: row.name,
        code: row.code,
        icon: row.icon,
        blurb: row.blurb,
        sortOrder: row.sortOrder,
        createdAt,
        updatedAt,
      },
    }),
  )
}

export async function listPriceHistory(sku: string, limit = 20): Promise<PriceHistoryRow[]> {
  const items = await queryAll({
    TableName: tableName(),
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': `PRODUCT#${sku}`,
      ':sk': 'PRICE#',
    },
    ScanIndexForward: false,
  })
  return items.slice(0, limit).map(priceHistoryFromItem)
}

export async function appendPriceHistory(input: {
  sku: string
  previousPrice: number
  newPrice: number
  previousMrp: number
  newMrp: number
  changedBy: string | null
  note?: string | null
}): Promise<void> {
  const id = createId()
  const createdAt = nowIso()
  await doc.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        ...keys.priceHistory(input.sku, createdAt, id),
        entity: 'price_history',
        id,
        sku: input.sku,
        previousPrice: input.previousPrice,
        newPrice: input.newPrice,
        previousMrp: input.previousMrp,
        newMrp: input.newMrp,
        changedBy: input.changedBy,
        note: input.note ?? null,
        createdAt,
      },
    }),
  )
}

export async function writeAudit(input: {
  actorId: string | null
  actorEmail: string
  action: string
  entity: string
  entityId: string
  detail?: Record<string, unknown> | null
}): Promise<void> {
  const id = createId()
  const createdAt = nowIso()
  await doc.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        ...keys.audit(createdAt, id),
        entity: 'audit',
        id,
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        action: input.action,
        auditEntity: input.entity,
        entityId: input.entityId,
        detail: input.detail ?? null,
        createdAt,
      },
    }),
  )
}

/** Scan fallback used only by seed/tests when GSIs are empty. */
export async function scanProductsFallback(): Promise<ProductRow[]> {
  const items = await scanEntity('product')
  return items.map(productFromItem)
}
