/**
 * DynamoDB document client for Steryle.
 *
 * Mirrors the SuperPhysio pattern: lazy DocumentClient, table name from
 * `TABLE_NAME` / SST Resource link, ids without dashes.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'

const globalForDb = globalThis as unknown as {
  __steryleDynamo?: DynamoDBDocumentClient
}

export const doc =
  globalForDb.__steryleDynamo ??
  DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  })

if (process.env.NODE_ENV !== 'production') globalForDb.__steryleDynamo = doc

type LinkedResources = typeof Resource & {
  Steryle: { name: string }
}

export function tableName(): string {
  if (process.env.TABLE_NAME) return process.env.TABLE_NAME
  try {
    return (Resource as LinkedResources).Steryle.name
  } catch {
    throw new Error(
      'TABLE_NAME is not set and SST Resource.Steryle is unavailable. Deploy with `pnpm deploy:backend` or export TABLE_NAME.',
    )
  }
}

export function createId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export function nowIso(): string {
  return new Date().toISOString()
}
