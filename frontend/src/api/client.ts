import axios from 'axios'

const apiBase = import.meta.env.VITE_API_URL || ''

export const apiClient = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/api/auth/')
      if (!isAuthRoute) {
        localStorage.removeItem('taskflow_token')
        localStorage.removeItem('taskflow_user')
        // only redirect if not already on login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export function getApiErrorMessage(error: unknown): { message: string; details?: Array<{field:string; message:string}> } {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any
    if (data?.error) {
      const details = Array.isArray(data.error.details) ? data.error.details : undefined
      return { message: data.error.message || error.message, details }
    }
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return { message: 'Unable to connect to server. Please check if the API is running.' }
    }
    return { message: error.message }
  }
  if (error instanceof Error) return { message: error.message }
  return { message: 'Something went wrong. Please try again.' }
}
