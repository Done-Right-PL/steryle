import 'server-only'

/**
 * Dashboard aggregates — implemented in `@steryle/db` against DynamoDB.
 */
export {
  getOverview,
  getRevenueSeries,
  getOrdersByStatus,
  getTopProducts,
  getTopCustomers,
  getCategoryMix,
  getCustomerStats,
  getCatalogueAlerts,
  type Trend,
} from '@steryle/db'
