import type { AdminUsersResponse, UserRole } from '../types'
import client from './clients'

export type AdminUserFilters = {
  page: number
  page_size: number
  search?: string
  role?: UserRole | ''
  status?: 'active' | 'blocked' | ''
}

/** Administración: el backend expone GET /admin/users y PATCH /admin/users/:id/status. */
export async function getAdminUsers(filters: AdminUserFilters): Promise<AdminUsersResponse> {
  const { data } = await client.get<AdminUsersResponse>('/admin/users', { params: filters })
  return data
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  await client.patch(`/admin/users/${userId}/${isActive ? 'unblock' : 'block'}`)
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await client.delete(`/admin/users/${userId}`)
}
