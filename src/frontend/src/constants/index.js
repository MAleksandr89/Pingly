export const QUERY_KEYS = {
  monitors: ['monitors'],
  monitor: (id) => ['monitors', id],
  incidents: ['incidents'],
  monitorIncidents: (id) => ['incidents', { monitorId: id }],
  status: ['status'],
}

export const ROUTES = {
  status: '/status',
  login: '/login',
  dashboard: '/',
  monitorDetail: (id) => `/monitors/${id}`,
}

export const MONITOR_INTERVALS = [1, 5, 10, 15, 30, 60]

export const STATUS_LABELS = {
  up: 'Работает',
  down: 'Сбой',
  nodata: 'Нет данных',
}

export const UPTIME_HISTORY_DAYS = 90
