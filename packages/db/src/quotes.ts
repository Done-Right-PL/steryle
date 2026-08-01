import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { createId, doc, nowIso, tableName } from './client'
import { keys, quoteFromItem } from './keys'
import type { DynItem, QuoteRequestRow, QuoteStatus } from './types'

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

export async function createQuoteRequest(input: {
  organisation: string
  requirement: string
  contactName?: string | null
  contactPhone?: string | null
}): Promise<QuoteRequestRow> {
  const id = createId()
  const createdAt = nowIso()
  const item: DynItem = {
    ...keys.quote(id),
    ...keys.quotesIndex(createdAt, id),
    entity: 'quote',
    id,
    organisation: input.organisation.trim(),
    requirement: input.requirement.trim(),
    contactName: input.contactName?.trim() || null,
    contactPhone: input.contactPhone?.trim() || null,
    status: 'new',
    createdAt,
    updatedAt: createdAt,
  }
  await doc.send(new PutCommand({ TableName: tableName(), Item: item }))
  return quoteFromItem(item)
}

export async function listQuoteRequests(): Promise<QuoteRequestRow[]> {
  const items = await queryAll({
    TableName: tableName(),
    IndexName: 'gsi1',
    KeyConditionExpression: 'gsi1pk = :pk',
    ExpressionAttributeValues: { ':pk': 'QUOTES' },
    ScanIndexForward: false,
  })
  return items.map(quoteFromItem)
}

export async function getQuoteRequest(id: string): Promise<QuoteRequestRow | null> {
  const res = await doc.send(
    new GetCommand({ TableName: tableName(), Key: keys.quote(id) }),
  )
  return res.Item ? quoteFromItem(res.Item as DynItem) : null
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus,
): Promise<QuoteRequestRow | null> {
  const existing = await getQuoteRequest(id)
  if (!existing) return null
  const updatedAt = nowIso()
  await doc.send(
    new UpdateCommand({
      TableName: tableName(),
      Key: keys.quote(id),
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status, ':updatedAt': updatedAt },
    }),
  )
  return { ...existing, status, updatedAt: new Date(updatedAt) }
}
