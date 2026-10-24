import { apiClient } from './client'
import type { Task, PaginatedResponse } from '../types'

export interface ListTasksParams {
  page?: number
  limit?: number
  search?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  assignedTo?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export async function listProjectTasks(projectId: string, params: ListTasksParams = {}) {
  const res = await apiClient.get<PaginatedResponse<Task>>(`/api/projects/${projectId}/tasks`, { params })
  return res.data
}

export async function createTask(data: {
  projectId: string
  title: string
  description?: string | null
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  dueDate?: string | null
  assignedTo?: string | null
}) {
  const res = await apiClient.post<{ data: Task }>('/api/tasks', data)
  return res.data.data
}

export async function createProjectTask(projectId: string, data: {
  title: string
  description?: string | null
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  dueDate?: string | null
  assignedTo?: string | null
}) {
  const res = await apiClient.post<{ data: Task }>(`/api/projects/${projectId}/tasks`, data)
  return res.data.data
}

export async function getTask(taskId: string) {
  const res = await apiClient.get<{ data: Task }>(`/api/tasks/${taskId}`)
  return res.data.data
}

export async function updateTask(taskId: string, data: {
  title?: string
  description?: string | null
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  dueDate?: string | null
  assignedTo?: string | null
}) {
  const res = await apiClient.patch<{ data: Task }>(`/api/tasks/${taskId}`, data)
  return res.data.data
}

export async function deleteTask(taskId: string) {
  await apiClient.delete(`/api/tasks/${taskId}`)
}
