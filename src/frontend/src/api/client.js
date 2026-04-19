import axios from 'axios'

import { keysToCamel, keysToSnake } from '@utils/camelCase'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data) config.data = keysToSnake(config.data)
  return config
})

client.interceptors.response.use(
  (response) => {
    response.data = keysToCamel(response.data)
    return response
  },
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export { client }
