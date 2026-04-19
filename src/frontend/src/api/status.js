import { client } from './client'

export const getStatus = () =>
  client.get('/api/status/').then(r => {
    const monitors = r.data.monitors ?? r.data
    return monitors.map(m => ({
      ...m,
      uptimePercent: m.uptimePercentage ?? m.uptimePercent ?? null,
    }))
  })
