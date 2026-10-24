import { apiClient } from './client'
import type { User, AuthResponse } from '../types'

export async function register(data: { name: string; email: string; password: string }) {
  const res = await apiClient.post<{ data: AuthResponse }>('/api/auth/register', data)
  return res.data.data
}

export async function login(data: { email: string; password: string }) {
  const res = await apiClient.post<{ data: AuthResponse }>('/api/auth/login', data)
  return res.data.data
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<{ data: User }>('/api/auth/me')
  return res.data.data
}
