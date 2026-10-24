import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { User, AuthResponse } from '../types'
import * as authApi from '../api/auth'
import { apiClient } from '../api/client'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('taskflow_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('taskflow_token'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!token && !!user

  const saveAuth = (data: AuthResponse) => {
    localStorage.setItem('taskflow_token', data.token)
    localStorage.setItem('taskflow_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }

  const logout = useCallback(() => {
    localStorage.removeItem('taskflow_token')
    localStorage.removeItem('taskflow_user')
    delete apiClient.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      const me = await authApi.getMe()
      setUser(me)
      localStorage.setItem('taskflow_user', JSON.stringify(me))
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [token, logout])

  useEffect(() => {
    if (token) {
      refreshUser()
    } else {
      setLoading(false)
    }
  }, [token, refreshUser])

  const login = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      const data = await authApi.login({ email, password })
      saveAuth(data)
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      const data = await authApi.register({ name, email, password })
      saveAuth(data)
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Registration failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, isAuthenticated, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
