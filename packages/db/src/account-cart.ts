import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { doc, nowIso, tableName } from './client'
import { keys } from './keys'
import type { DynItem } from './types'

export type AccountCartLine = {
  sku: string
  name: string
  slug: string
  brand: string
  price: number
  image?: string
  qty: number
}

export type WishlistItem = {
  sku: string
  name: string
  slug: string
  brand: string
  price: number
  image?: string
  addedAt: string
}

async function queryAll(params: ConstructorParameters<typeof QueryCommand>[0]): Promise<DynItem[]> {
  const out: DynItem[] = []
  let ExclusiveStartKey: Record<string, unknown> | undefined
  do {
    const res = await doc.send(new QueryCommand({ ...params, ExclusiveStartKey }))
    out.push(...((res.Items as DynItem[]) ?? []))
    ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (ExclusiveStartKey)
  return out
}

export async function getCart(customerId: string): Promise<AccountCartLine[]> {
  const items = await queryAll({
    TableName: tableName(),
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
    ExpressionAttributeValues: { ':pk': `CUSTOMER#${customerId}`, ':sk': 'CART#' },
  })
  return items.map((item) => ({
    sku: String(item.sku),
    name: String(item.name),
    slug: String(item.slug),
    brand: String(item.brand),
    price: Number(item.price),
    image: item.image == null ? undefined : String(item.image),
    qty: Number(item.qty),
  }))
}

export async function putCartLine(customerId: string, line: AccountCartLine): Promise<void> {
  await doc.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        ...keys.cartLine(customerId, line.sku),
        entity: 'cart_line',
        ...line,
        updatedAt: nowIso(),
      },
    }),
  )
}

export async function removeCartLine(customerId: string, sku: string): Promise<void> {
  await doc.send(
    new DeleteCommand({
      TableName: tableName(),
      Key: keys.cartLine(customerId, sku),
    }),
  )
}

export async function clearCart(customerId: string): Promise<void> {
  const lines = await getCart(customerId)
  await Promise.all(lines.map((line) => removeCartLine(customerId, line.sku)))
}

export async function replaceCart(
  customerId: string,
  lines: AccountCartLine[],
): Promise<AccountCartLine[]> {
  await clearCart(customerId)
  await Promise.all(lines.map((line) => putCartLine(customerId, line)))
  return getCart(customerId)
}

/** Merge guest lines into the account cart (qty adds when SKU overlaps). */
export async function mergeCart(
  customerId: string,
  guestLines: AccountCartLine[],
): Promise<AccountCartLine[]> {
  const existing = await getCart(customerId)
  const bySku = new Map(existing.map((l) => [l.sku, l]))
  for (const line of guestLines) {
    const prev = bySku.get(line.sku)
    bySku.set(line.sku, prev ? { ...line, qty: prev.qty + line.qty } : line)
  }
  return replaceCart(customerId, [...bySku.values()])
}

export async function getWishlist(customerId: string): Promise<WishlistItem[]> {
  const items = await queryAll({
    TableName: tableName(),
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
    ExpressionAttributeValues: { ':pk': `CUSTOMER#${customerId}`, ':sk': 'WISH#' },
    ScanIndexForward: false,
  })
  return items.map((item) => ({
    sku: String(item.sku),
    name: String(item.name),
    slug: String(item.slug),
    brand: String(item.brand),
    price: Number(item.price),
    image: item.image == null ? undefined : String(item.image),
    addedAt: String(item.addedAt ?? item.createdAt ?? nowIso()),
  }))
}

export async function addWishlistItem(
  customerId: string,
  item: Omit<WishlistItem, 'addedAt'>,
): Promise<WishlistItem> {
  const addedAt = nowIso()
  const row: WishlistItem = { ...item, addedAt }
  await doc.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        ...keys.wishlistItem(customerId, item.sku),
        ...keys.wishlistIndex(addedAt, customerId, item.sku),
        entity: 'wishlist',
        ...row,
      },
    }),
  )
  return row
}

export async function removeWishlistItem(customerId: string, sku: string): Promise<void> {
  await doc.send(
    new DeleteCommand({
      TableName: tableName(),
      Key: keys.wishlistItem(customerId, sku),
    }),
  )
}
