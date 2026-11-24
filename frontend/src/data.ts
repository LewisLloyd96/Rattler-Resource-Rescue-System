export type Role =
  | 'Administrator'
  | 'Campus User'
  | 'Department Representative'
  | 'Student Organization Representative'
  | 'Community Moderator'

export type Account = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: Role
  status: 'Active' | 'Suspended' | 'Banned' | 'Deactivated'
}

export type Listing = {
  id: number
  title: string
  description: string
  category: string
  categoryId?: number
  condition: string
  quantity: number
  location: string
  status: 'Available' | 'Reserved' | 'Pending Review' | 'Completed' | 'Cancelled' | 'Removed'
  owner: string
  ownerType: string
  organizationId: number | null
  mainPhoto?: string | null
}

export type Reservation = {
  id: number
  itemId: number
  itemTitle: string
  category: string
  reservedBy: string
  reservedAt: string
  status: 'Pending' | 'Active' | 'Completed' | 'Cancelled' | 'Expired'
}

export type Organization = {
  id: number
  name: string
  type: 'Department' | 'Student Organization'
}

export type CollectionEvent = {
  id: number
  title: string
  type: 'Collection Drive' | 'Giveaway'
  status: string
  location: string
  description: string | null
  date: string
  instructions?: string | null
}

export type EventItem = {
  eventId: number
  itemId: number
  title: string
  contributor: string
  status: string
}

export type Report = {
  id: number
  reason: string
  target: string
  type: 'Listing' | 'Exchange problem' | 'Account'
  status: string
  reporter: string
  details: string | null
  date: string
  caseStatus: string | null
  decision?: string | null
  reportedItemId?: number | null
  itemOwner?: string | null
  ownerEmail?: string | null
  ownerReportedListingsCount?: number | null
}

export type Category = {
  id: number
  name: string
  description: string | null
  rules: string | null
  isActive: boolean
}

export type SystemSetting = {
  key: string
  value: string
  updatedAt: string
}

export type ActivityReport = {
  scope: string
  metrics: Record<string, number>
  byCategory: { category: string; listings: number }[]
}

export type MyListing = {
  id: number
  title: string
  description: string
  category: string
  condition: string
  quantity: number
  location: string
  status: string
  createdAt: string
  owner?: string
}

export type MyReservation = {
  id: number
  itemId: number
  itemTitle: string
  status: string
  reservedAt: string
  expiresAt: string
  location: string
  owner: string
}

export type CampusMessage = {
  id: number
  reservationId: number | null
  senderId: number
  recipientId: number
  sender: string
  recipient: string
  body: string
  sentAt: string
  isRead: boolean
}

export type ModerationAction = {
  id: number
  actionType: string
  reason: string
  notes: string | null
  restrictionEndsAt: string | null
  createdAt: string
  performedBy: string
  caseId: number
  caseStatus: string
  reportId: number
  reportReason: string
}

export type LoginResponse = {
  token: string
  user: Account
}

export type DepartmentWorkspace = {
  organization: Organization
  listings: Listing[]
  reservations: Reservation[]
}

export type OrganizationWorkspace = DepartmentWorkspace & {
  events: CollectionEvent[]
  eventItems: EventItem[]
}
