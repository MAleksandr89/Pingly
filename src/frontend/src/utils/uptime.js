import { UPTIME_HISTORY_DAYS } from '../constants'

export const calcUptimePercent = (history) => {
  if (!history?.length) return null
  const upDays = history.filter(d => d.status === 'up').length
  return Math.round((upDays / history.length) * 1000) / 10
}

const generate90Days = () => {
  const days = []
  const now = new Date()
  for (let i = UPTIME_HISTORY_DAYS - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export const buildUptimeGrid = (history) => {
  const days = generate90Days()
  const byDate = Object.fromEntries((history ?? []).map(h => [h.date, h.status]))
  return days.map(date => ({ date, status: byDate[date] ?? 'nodata' }))
}
