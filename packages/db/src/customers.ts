import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { createId, doc, nowIso, tableName } from './client'
import {
  customerFromItem,
  keys,
  orderFromItem,
  orderItemFromItem,
} from './keys'
import type {
  CustomerRow,
  CustomerStatus,
  DynItem,
  OrderItemRow,
  OrderRow,
  OrderStatus,
} from './types'

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

export async function listAllCustomers(): Promise<CustomerRow[]> {
  const items = await queryAll({
    TableName: tableName(),
    IndexName: 'gsi1',
    KeyConditionExpression: 'gsi1pk = :pk',
    ExpressionAttributeValues: { ':pk': 'CUSTOMERS' },
    ScanIndexForward: false,
  })
  return items.map(customerFromItem)
}

export async function getCustomerById(id: string): Promise<CustomerRow | null> {
  const res = await doc.send(
    new GetCommand({ TableName: tableName(), Key: keys.customer(id) }),
  )
  return res.Item ? customerFromItem(res.Item as DynItem) : null
}

export async function putCustomer(
  row: Omit<CustomerRow, 'createdAt' | 'updatedAt' | 'id'> & {
    id?: string
    createdAt?: Date
    updatedAt?: Date
  },
): Promise<CustomerRow> {
  const id = row.id ?? createId()
  const createdAt = (row.createdAt ?? new Date()).toISOString()
  const updatedAt = (row.updatedAt ?? new Date()).toISOString()
  const item: DynItem = {
    ...keys.customer(id),
    ...keys.customersIndex(createdAt, id),
    ...keys.customerPhone(row.phone),
    entity: 'customer',
    id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    state: row.state,
    gstin: row.gstin,
    status: row.status,
    marketingOptIn: row.marketingOptIn,
    lastSeenAt: row.lastSeenAt ? row.lastSeenAt.toISOString() : null,
    createdAt,
    updatedAt,
  }
  await doc.send(new PutCommand({ TableName: tableName(), Item: item }))
  return customerFromItem(item)
}

export async function updateCustomerFields(
  id: string,
  fields: Partial<Pick<CustomerRow, 'status' | 'marketingOptIn'>>,
): Promise<CustomerRow | null> {
  const existing = await getCustomerById(id)
  if (!existing) return null
  return putCustomer({ ...existing, ...fields, updatedAt: new Date() })
}

export async function listAllOrders(): Promise<OrderRow[]> {
  const items = await queryAll({
    TableName: tableName(),
    IndexName: 'gsi1',
    KeyConditionExpression: 'gsi1pk = :pk',
    ExpressionAttributeValues: { ':pk': 'ORDERS' },
    ScanIndexForward: false,
  })
  return items.map(orderFromItem)
}

export async function getOrdersForCustomer(
  customerId: string,
  limit = 50,
): Promise<OrderRow[]> {
  const items = await queryAll({
    TableName: tableName(),
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': `CUSTOMER#${customerId}`,
      ':sk': 'ORDER#',
    },
    ScanIndexForward: false,
  })
  const orders = items.slice(0, limit).map(orderFromItem)
  await Promise.all(
    orders.map(async (order) => {
      order.items = await listOrderItems(order.id)
    }),
  )
  return orders
}

export async function listOrderItems(orderId: string): Promise<OrderItemRow[]> {
  const items = await queryAll({
    TableName: tableName(),
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': `ORDER#${orderId}`,
      ':sk': 'ITEM#',
    },
  })
  return items.map(orderItemFromItem)
}

export async function putOrder(input: {
  id?: string
  reference: string
  customerId: string
  status: OrderStatus
  subtotal: number
  shipping: number
  tax: number
  total: number
  placedAt: Date
  items: Array<{ sku: string; name: string; unitPrice: number; qty: number }>
}): Promise<OrderRow> {
  const id = input.id ?? createId()
  const placedAt = input.placedAt.toISOString()
  const createdAt = placedAt
  const orderItem: DynItem = {
    ...keys.order(input.customerId, placedAt, id),
    ...keys.ordersIndex(placedAt, id),
    ...keys.orderRef(input.reference),
    entity: 'order',
    id,
    reference: input.reference,
    customerId: input.customerId,
    status: input.status,
    subtotal: input.subtotal,
    shipping: input.shipping,
    tax: input.tax,
    total: input.total,
    placedAt,
    createdAt,
    updatedAt: createdAt,
  }

  // Secondary META row so items can be queried by order id alone.
  const metaItem: DynItem = {
    ...keys.orderMeta(id),
    entity: 'order_meta',
    id,
    reference: input.reference,
    customerId: input.customerId,
    placedAt,
  }

  await doc.send(new PutCommand({ TableName: tableName(), Item: orderItem }))
  await doc.send(new PutCommand({ TableName: tableName(), Item: metaItem }))

  for (const line of input.items) {
    const itemId = createId()
    await doc.send(
      new PutCommand({
        TableName: tableName(),
        Item: {
          ...keys.orderItem(id, line.sku),
          entity: 'order_item',
          id: itemId,
          orderId: id,
          sku: line.sku,
          name: line.name,
          unitPrice: line.unitPrice,
          qty: line.qty,
        },
      }),
    )
  }

  return orderFromItem(orderItem)
}

export type { CustomerStatus }
