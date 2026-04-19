import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { getMonitors, createMonitor, updateMonitor, deleteMonitor, getIncidents } from '@/api/monitors'
import { getStatus } from '@/api/status'
import { QUERY_KEYS } from '@/constants'

export const useMonitors = () =>
  useQuery({ queryKey: QUERY_KEYS.monitors, queryFn: getMonitors, staleTime: 30_000 })

export const useMonitorsWithStatus = () => {
  const monitorsQuery = useMonitors()
  const statusQuery = useQuery({
    queryKey: QUERY_KEYS.status,
    queryFn: getStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const data = React.useMemo(() => {
    if (!monitorsQuery.data) return monitorsQuery.data
    const statusById = Object.fromEntries((statusQuery.data ?? []).map(s => [String(s.id), s]))
    return monitorsQuery.data.map(m => ({ ...m, ...statusById[String(m.id)] }))
  }, [monitorsQuery.data, statusQuery.data])

  return {
    data,
    isLoading: monitorsQuery.isLoading,
    isError: monitorsQuery.isError || statusQuery.isError,
    error: monitorsQuery.error ?? statusQuery.error,
  }
}

export const useMonitorIncidents = (monitorId) =>
  useQuery({
    queryKey: QUERY_KEYS.monitorIncidents(monitorId),
    queryFn: () => getIncidents(monitorId),
    enabled: !!monitorId,
  })

export const useCreateMonitor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMonitor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monitors }),
  })
}

export const useUpdateMonitor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateMonitor(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monitors }),
  })
}

export const useDeleteMonitor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMonitor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monitors }),
  })
}
