import { QueryClient } from '@tanstack/react-query'

/**
 * The catalogue currently ships in-bundle via @stryle/core, so queries are
 * cheap and local. The client is configured up front so screens can move to a
 * remote catalogue API without changing their call sites.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
