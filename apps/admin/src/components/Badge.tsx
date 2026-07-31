/**
 * Status pills.
 *
 * The palette is monochrome, so status is encoded by fill weight instead of
 * hue: solid for states that need action or are terminal-negative, outline for
 * in-flight, muted for inert. A dot glyph carries the same information for
 * anyone who cannot distinguish the fills.
 */
import type { NotificationStatus, OrderStatus } from '@steryle/db'

type Tone = 'solid' | 'outline' | 'muted'

const TONE_CLASS: Record<Tone, string> = {
  solid: 'badge-solid',
  outline: 'badge-outline',
  muted: 'badge-muted',
}

export function Badge({
  children,
  tone = 'outline',
}: {
  children: React.ReactNode
  tone?: Tone
}) {
  return <span className={`badge ${TONE_CLASS[tone]}`}>{children}</span>
}

const ORDER_TONE: Record<OrderStatus, Tone> = {
  pending: 'solid',
  confirmed: 'outline',
  shipped: 'outline',
  delivered: 'muted',
  cancelled: 'muted',
  refunded: 'muted',
}

const ORDER_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONE[status]}>{ORDER_LABEL[status]}</Badge>
}

const NOTIFICATION_TONE: Record<NotificationStatus, Tone> = {
  draft: 'muted',
  scheduled: 'outline',
  sent: 'solid',
  archived: 'muted',
}

export function NotificationStatusBadge({ status }: { status: NotificationStatus }) {
  return <Badge tone={NOTIFICATION_TONE[status]}>{status[0]?.toUpperCase() + status.slice(1)}</Badge>
}

/** Catalogue visibility, derived from the two independent admin switches. */
export function VisibilityBadge({
  isHidden,
  archivedAt,
}: {
  isHidden: boolean
  archivedAt: Date | null
}) {
  if (archivedAt) return <Badge tone="muted">Removed</Badge>
  if (isHidden) return <Badge tone="solid">Hidden</Badge>
  return <Badge tone="outline">Live</Badge>
}
