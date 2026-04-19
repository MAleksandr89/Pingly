import { client } from './client'

export const loginUser = (data) =>
  client.post('/api/v1/auth/login', data).then(r => r.data)

export const registerUser = (data) =>
  client.post('/api/v1/auth/register', data).then(r => r.data)
