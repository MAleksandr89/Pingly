import { client } from './client'

export const getMonitors = () =>
  client.get('/api/v1/monitors/').then(r => r.data)

export const createMonitor = (data) =>
  client.post('/api/v1/monitors/', data).then(r => r.data)

export const updateMonitor = (id, data) =>
  client.put(`/api/v1/monitors/${id}`, data).then(r => r.data)

export const deleteMonitor = (id) =>
  client.delete(`/api/v1/monitors/${id}`).then(r => r.data)

export const getIncidents = (monitorId) =>
  client.get('/api/v1/incidents/', {
    params: monitorId ? { monitor_id: monitorId } : undefined,
  }).then(r => r.data)
