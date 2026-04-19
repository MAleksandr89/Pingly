import { useQuery } from '@tanstack/react-query'

import { getStatus } from '@/api/status'
import { QUERY_KEYS } from '@/constants'

export const useStatus = () =>
  useQuery({
    queryKey: QUERY_KEYS.status,
    queryFn: getStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
