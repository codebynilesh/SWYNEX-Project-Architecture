export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface Project {
  id: string
  title: string
  description: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  taskCount: number
}

export interface Task {
  id: string
  projectId: string
  assignedTo: string | null
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  dueDate: string | null
  createdAt: string
  updatedAt: string
  assignee: User | null
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Array<{ field: string; message: string }> | unknown
  }
}

