import { apiClient } from './client'
import type { Project, PaginatedResponse } from '../types'

export interface ListProjectsParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export async function listProjects(params: ListProjectsParams = {}) {
  const res = await apiClient.get<PaginatedResponse<Project>>('/api/projects', { params })
  return res.data
}

export async function getProject(projectId: string) {
  const res = await apiClient.get<{ data: Project }>(`/api/projects/${projectId}`)
  return res.data.data
}

export async function createProject(data: { title: string; description?: string | null }) {
  const res = await apiClient.post<{ data: Project }>('/api/projects', data)
  return res.data.data
}

export async function updateProject(projectId: string, data: { title?: string; description?: string | null }) {
  const res = await apiClient.patch<{ data: Project }>(`/api/projects/${projectId}`, data)
  return res.data.data
}

export async function deleteProject(projectId: string) {
  await apiClient.delete(`/api/projects/${projectId}`)
}
