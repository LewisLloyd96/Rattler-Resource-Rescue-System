import type {
  Account,
  ActivityReport,
  CampusMessage,
  Category,
  DepartmentWorkspace,
  Listing,
  LoginResponse,
  ModerationAction,
  MyListing,
  MyReservation,
  OrganizationWorkspace,
  Report,
  SystemSetting,
} from './data'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = {
  token?: string
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(`Could not reach the application API at ${API_BASE_URL}. Start the backend and check its database configuration.`, 0)
  }

  const payload = await response.json().catch(() => null) as Record<string, unknown> | null
  if (!response.ok) {
    const detail = payload?.detail
    const fieldError = Object.entries(payload ?? {}).find(([, value]) => Array.isArray(value) && typeof value[0] === 'string')
    const message = typeof detail === 'string'
      ? detail
      : fieldError ? String((fieldError[1] as string[])[0]) : `The application API returned an error (${response.status}).`
    throw new ApiError(message, response.status)
  }
  if (payload === null) throw new ApiError('The application API returned an invalid response.', response.status)
  return payload as T
}

export function signIn(email: string, password: string) {
  return request<LoginResponse>('/auth/login/', {
    method: 'POST',
    body: { email, password },
  })
}

export function getCurrentAccount(token: string) {
  return request<Account>('/auth/me/', { token })
}

export async function getUsers(token: string, search: string, role: string, signal?: AbortSignal) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('q', search.trim())
  if (role && role !== 'All roles') params.set('role', role)
  const suffix = params.size ? `?${params.toString()}` : ''
  return request<{ users: Account[]; roles: string[] }>(`/users/${suffix}`, { token, signal })
}

export function updateAccountStatus(token: string, userId: number, status: 'Active' | 'Deactivated', justification: string) {
  return request<{ id: number; status: Account['status'] }>(`/users/${userId}/status/`, {
    token, method: 'PATCH', body: { status, justification },
  })
}

export async function getItems(token: string, search: string, category: string, signal?: AbortSignal) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('q', search.trim())
  if (category && category !== 'All categories') params.set('category', category)
  const suffix = params.size ? `?${params.toString()}` : ''
  return request<{ items: Listing[]; categories: string[] }>(`/items/${suffix}`, { token, signal })
}

export function reserveItem(token: string, itemId: number) {
  return request<{ reservation: { id: number; itemId: number; itemTitle: string; status: string; reservedAt: string } }>(
    `/items/${itemId}/reserve/`,
    { token, method: 'POST', body: {} },
  )
}

type ListingFields = {
  title: string
  description: string
  category_id: number
  item_condition: string
  quantity: number
  pickup_location: string
}

export function createListing(token: string, listing: ListingFields) {
  return request<{ id: number; status: string }>('/items/create/', {
    token,
    method: 'POST',
    body: listing,
  })
}

export function saveDepartmentListing(token: string, listing: ListingFields, itemId?: number) {
  const path = itemId === undefined ? '/department/listings/' : `/department/listings/${itemId}/`
  return request<{ id: number; status: string }>(path, {
    token, method: itemId === undefined ? 'POST' : 'PATCH', body: listing,
  })
}

export function createOrganizationEvent(token: string, event: {
  event_type: string
  title: string
  description: string
  participation_instructions: string
  location: string
  start_at: string
  end_at: string
}) {
  return request<{ id: number; status: string }>('/organization/events/', {
    token, method: 'POST', body: event,
  })
}

export function getMyListings(token: string, signal?: AbortSignal) {
  return request<{ listings: MyListing[] }>('/my-items/', { token, signal })
}

export function removeMyListing(token: string, itemId: number) {
  return request<{ id: number; status: string }>(`/my-items/${itemId}/`, {
    token,
    method: 'PATCH',
    body: { action: 'remove' },
  })
}

export function getMyReservations(token: string, signal?: AbortSignal) {
  return request<{ reservations: MyReservation[] }>('/reservations/', { token, signal })
}

export function cancelReservation(token: string, reservationId: number) {
  return request<{ id: number; status: string }>(`/reservations/${reservationId}/cancel/`, {
    token,
    method: 'POST',
    body: {},
  })
}

export function getMessages(token: string, signal?: AbortSignal) {
  return request<{ messages: CampusMessage[] }>('/messages/', { token, signal })
}

export function sendMessage(token: string, message: {
  recipient_email: string
  body: string
  reservation_id?: number
}) {
  return request<{ id: number }>('/messages/', { token, method: 'POST', body: message })
}

export function getCategories(token: string, signal?: AbortSignal) {
  return request<{ categories: Category[] }>('/categories/', { token, signal })
}

export function createCategory(token: string, category: Pick<Category, 'name' | 'description' | 'rules'>) {
  return request<{ id: number }>('/categories/', { token, method: 'POST', body: category })
}

export function updateCategory(token: string, categoryId: number, patch: Partial<Category>) {
  const { isActive, ...fields } = patch
  const body = {
    ...fields,
    ...(isActive === undefined ? {} : { is_active: isActive }),
  }
  return request<{ id: number }>(`/categories/${categoryId}/`, { token, method: 'PATCH', body })
}

export function getActivityReport(token: string, signal?: AbortSignal) {
  return request<ActivityReport>('/activity-reports/', { token, signal })
}

export function getSystemSettings(token: string, signal?: AbortSignal) {
  return request<{ settings: SystemSetting[] }>('/settings/', { token, signal })
}

export function updateSystemSetting(token: string, key: string, value: string) {
  return request<{ key: string; value: string }>('/settings/', {
    token,
    method: 'PATCH',
    body: { setting_key: key, setting_value: value },
  })
}

export function getOrganizationProfile(token: string, department: boolean, signal?: AbortSignal) {
  const path = department ? '/department/profile/' : '/organization/profile/'
  return request<{ organization: { id: number; name: string; type: string; location: string | null; contact_email: string | null; status: string } }>(path, { token, signal })
}

export function updateOrganizationProfile(token: string, department: boolean, patch: {
  location?: string
  contact_email?: string
}) {
  const path = department ? '/department/profile/' : '/organization/profile/'
  return request<{ organization: { id: number; name: string; type: string; location: string | null; contact_email: string | null; status: string } }>(
    path,
    { token, method: 'PATCH', body: patch },
  )
}

export function getModerationActions(token: string, signal?: AbortSignal) {
  return request<{ actions: ModerationAction[] }>('/moderation/actions/', { token, signal })
}

export function getPendingListings(token: string, signal?: AbortSignal) {
  return request<{ listings: MyListing[] }>('/admin/pending-listings/', { token, signal })
}

export function reviewPendingListing(token: string, itemId: number, action: 'approve' | 'reject') {
  return request<{ id: number; status: string }>(`/admin/pending-listings/${itemId}/`, {
    token,
    method: 'PATCH',
    body: { action },
  })
}

export function updateReportStatus(token: string, reportId: number, status: Report['status'], decision?: string) {
  return request<{ id: number; status: string }>(`/reports/${reportId}/`, {
    token,
    method: 'PATCH',
    body: { status, decision },
  })
}

export function getDepartment(token: string, signal?: AbortSignal) {
  return request<DepartmentWorkspace>('/department/', { token, signal })
}

export function getOrganization(token: string, signal?: AbortSignal) {
  return request<OrganizationWorkspace>('/organization/', { token, signal })
}

export async function getReports(
  token: string,
  search: string,
  type: string,
  signal?: AbortSignal,
  filters: { status?: 'queue' | 'all'; itemsOnly?: boolean } = {},
) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('q', search.trim())
  if (type && type !== 'All reports') params.set('type', type)
  if (filters.status) params.set('status', filters.status)
  if (filters.itemsOnly) params.set('items_only', 'true')
  const suffix = params.size ? `?${params.toString()}` : ''
  return request<{ reports: Report[] }>(`/reports/${suffix}`, { token, signal })
}
