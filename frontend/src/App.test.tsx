import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import type { Account, DepartmentWorkspace, Listing, OrganizationWorkspace, Report, Role } from './data'

const demoPassword = 'Rattler2026!'
const roles: { role: Role; email: string; firstName: string; lastName: string; feature: string }[] = [
  { role: 'Administrator', email: 'angela.brooks@famu.edu', firstName: 'Angela', lastName: 'Brooks', feature: 'Manage the users' },
  { role: 'Campus User', email: 'jordan2.davis@famu.edu', firstName: 'Jordan', lastName: 'Davis', feature: 'Browse items' },
  { role: 'Department Representative', email: 'robert.hayes@famu.edu', firstName: 'Robert', lastName: 'Hayes', feature: 'Department inventory' },
  { role: 'Student Organization Representative', email: 'jasmine1.carter@famu.edu', firstName: 'Jasmine', lastName: 'Carter', feature: 'Organization activity' },
  { role: 'Community Moderator', email: 'marcus.johnson@famu.edu', firstName: 'Marcus', lastName: 'Johnson', feature: 'Report queue' },
]

const listings: Listing[] = [
  { id: 1, title: 'Calculus: Early Transcendentals, 8th Edition', description: 'Light highlighting in chapters 2–4.', category: 'Textbooks', condition: 'Good', quantity: 1, location: 'Coleman Library lobby', status: 'Available', owner: 'Jordan Davis', ownerType: 'Campus User', organizationId: null },
  { id: 2, title: 'Campbell Biology, 12th Edition', description: 'Hardcover, no writing inside.', category: 'Textbooks', condition: 'Like New', quantity: 1, location: 'Student Union', status: 'Available', owner: 'Imani Scott', ownerType: 'Campus User', organizationId: null },
]

const demoReports: Report[] = [
  { id: 2, reason: 'Suspicious Activity', target: 'User: Tyrell Jackson', type: 'Exchange problem', status: 'Under Review', reporter: 'Christopher Lee', details: 'Three reservations were not picked up.', date: 'Oct 28, 2026', caseStatus: 'Escalated' },
  { id: 3, reason: 'Misleading Event Information', target: 'Event: Electronics Giveaway Day', type: 'Listing', status: 'Open', reporter: 'Jordan Davis', details: 'The event description and advertised items do not match.', date: 'Nov 3, 2026', caseStatus: null },
  { id: 4, reason: 'Missing parts', target: 'Listing: Desk lamp', type: 'Listing', status: 'Resolved', reporter: 'Morgan Reed', details: 'The listing was missing its power cable.', date: 'Nov 4, 2026', caseStatus: 'Closed', reportedItemId: 44, itemOwner: 'Tyrell Jackson', ownerReportedListingsCount: 2 },
  { id: 5, reason: 'Inaccurate description', target: 'Listing: Textbook set', type: 'Listing', status: 'Under Review', reporter: 'Jordan Davis', details: 'The condition does not match the photos.', date: 'Nov 5, 2026', caseStatus: 'Open', reportedItemId: 45, itemOwner: 'Tyrell Jackson', ownerReportedListingsCount: 2 },
]

function accountFor(role: Role): Account {
  const account = roles.find((candidate) => candidate.role === role)
  if (!account) throw new Error(`Unknown test role: ${role}`)
  return {
    id: roles.indexOf(account) + 1,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    role,
    status: 'Active',
  }
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  const allUsers = roles.map((candidate) => accountFor(candidate.role))
  const department: DepartmentWorkspace = {
    organization: { id: 1, name: 'Department of Computer & Information Sciences', type: 'Department' },
    listings: [{ ...listings[0], id: 6, title: 'Dell OptiPlex 7070 Desktop Computers', owner: 'Department of Computer & Information Sciences', ownerType: 'Department', organizationId: 1 }],
    reservations: [{ id: 10, itemId: 14, itemTitle: 'Arduino Uno Starter Kits', category: 'Electronics', reservedBy: 'Robert Hayes', reservedAt: 'Nov 16, 2026', status: 'Active' }],
  }
  const organization: OrganizationWorkspace = {
    organization: { id: 4, name: 'FAMU Environmental Club', type: 'Student Organization' },
    listings: [
      { ...listings[0], id: 12, title: 'Study Tables', category: 'Furniture', status: 'Completed', owner: 'FAMU Environmental Club', ownerType: 'Student Organization', organizationId: 4 },
      { ...listings[0], id: 15, title: 'Reusable Water Bottles', category: 'Household', owner: 'FAMU Environmental Club', ownerType: 'Student Organization', organizationId: 4 },
    ],
    reservations: [{ id: 3, itemId: 12, itemTitle: 'Study Tables', category: 'Furniture', reservedBy: 'Jasmine Carter', reservedAt: 'Oct 14, 2026', status: 'Completed' }],
    events: [{ id: 1, title: 'Fall Move-Out Collection Drive', type: 'Collection Drive', status: 'Active', location: 'Gibbs Hall lobby', description: 'Donate dorm items and supplies.', date: 'Oct 20 – Nov 10, 2026' }],
    eventItems: [{ eventId: 1, itemId: 24, title: 'Twin XL Bedding Set', contributor: 'Jordan Davis', status: 'Available' }],
  }
  let availableListings = [...listings]

  fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    if (url.pathname.endsWith('/auth/login/')) {
      const body = JSON.parse(String(init?.body)) as { email: string; password: string }
      const account = allUsers.find((candidate) => candidate.email === body.email)
      if (!account || body.password !== demoPassword) return jsonResponse({ detail: 'Email or password is incorrect.' }, 401)
      return jsonResponse({ token: `token-${account.id}`, user: account })
    }
    if (url.pathname.endsWith('/auth/me/')) {
      const id = Number(String(init?.headers && new Headers(init.headers).get('Authorization')).replace('Bearer token-', ''))
      const account = allUsers.find((candidate) => candidate.id === id)
      return account ? jsonResponse(account) : jsonResponse({ detail: 'Session expired.' }, 401)
    }
    if (url.pathname.endsWith('/users/')) {
      let users = allUsers
      const query = url.searchParams.get('q')?.toLowerCase()
      const role = url.searchParams.get('role')
      if (query) users = users.filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(query))
      if (role) users = users.filter((user) => user.role === role)
      return jsonResponse({ users, roles: roles.map((candidate) => candidate.role) })
    }
    if (url.pathname.endsWith('/categories/') && init?.method === 'POST') return jsonResponse({ id: 8 }, 201)
    if (url.pathname.endsWith('/categories/')) {
      return jsonResponse({ categories: [{ id: 1, name: 'Textbooks', description: null, rules: null, isActive: true }] })
    }
    if (/\/categories\/\d+\/$/.test(url.pathname) && init?.method === 'PATCH') {
      return jsonResponse({ id: Number(url.pathname.match(/\d+/)?.[0]) })
    }
    if (url.pathname.endsWith('/items/create/') && init?.method === 'POST') {
      return jsonResponse({ id: 24, status: 'Pending Review' }, 201)
    }
    const reserveMatch = url.pathname.match(/\/items\/(\d+)\/reserve\/$/)
    if (reserveMatch && init?.method === 'POST') {
      const itemId = Number(reserveMatch[1])
      const item = availableListings.find((candidate) => candidate.id === itemId)
      if (!item) return jsonResponse({ detail: 'This item is no longer available.' }, 404)
      availableListings = availableListings.filter((candidate) => candidate.id !== itemId)
      return jsonResponse({
        reservation: {
          id: 14,
          itemId,
          itemTitle: item.title,
          status: 'Active',
          reservedAt: '2026-11-16T12:00:00',
        },
      }, 201)
    }
    if (url.pathname.endsWith('/items/')) {
      let items = availableListings
      const query = url.searchParams.get('q')?.toLowerCase()
      const category = url.searchParams.get('category')
      if (query) items = items.filter((item) => `${item.title} ${item.description} ${item.owner} ${item.category}`.toLowerCase().includes(query))
      if (category) items = items.filter((item) => item.category === category)
      return jsonResponse({ items, categories: ['Textbooks', 'Electronics'] })
    }
    if (url.pathname.endsWith('/department/')) return jsonResponse(department)
    if (url.pathname.endsWith('/organization/')) return jsonResponse(organization)
    if (url.pathname.endsWith('/reports/')) {
      let filteredReports = demoReports
      const query = url.searchParams.get('q')?.toLowerCase()
      const type = url.searchParams.get('type')
      const reportStatus = url.searchParams.get('status')
      const itemsOnly = url.searchParams.get('items_only')
      if (query) filteredReports = filteredReports.filter((report) => `${report.reason} ${report.target} ${report.reporter} ${report.itemOwner ?? ''} ${report.details}`.toLowerCase().includes(query))
      if (type) filteredReports = filteredReports.filter((report) => report.type === type)
      if (reportStatus === 'queue') filteredReports = filteredReports.filter((report) => ['Open', 'Under Review'].includes(report.status))
      if (itemsOnly === 'true') filteredReports = filteredReports.filter((report) => report.reportedItemId !== undefined)
      return jsonResponse({ reports: filteredReports })
    }
    if (url.pathname.endsWith('/health/')) return jsonResponse({ status: 'ok', database: 'connected' })
    return jsonResponse({ detail: `Unexpected test URL: ${url.pathname}` }, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

async function signIn(email: string) {
  fireEvent.change(screen.getByLabelText('FAMU email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: demoPassword } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  const account = roles.find((candidate) => candidate.email === email)
  if (!account) throw new Error(`No mocked account for ${email}`)
  return screen.findByRole('navigation', { name: `${account.role} navigation` })
}

test.each(roles)('$role is identified from the authenticated account', async ({ role, email, feature }) => {
  render(<App />)
  const navigation = await signIn(email)

  expect(screen.getByRole('heading', { level: 2, name: /manage your community|find something useful|department at a glance|make a difference|exchanges trustworthy/i })).toBeInTheDocument()
  expect(within(navigation).getByRole('button', { name: new RegExp(feature, 'i') })).toBeInTheDocument()
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/'),
    expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Bearer token-/) }) }),
  ))
})

test('campus users can submit a free item for review', async () => {
  render(<App />)
  await signIn('jordan2.davis@famu.edu')
  fireEvent.click(screen.getByRole('button', { name: 'List an item' }))

  expect(await screen.findByRole('heading', { name: 'List a free item' })).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Item name'), { target: { value: 'Desk lamp' } })
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Working lamp, lightly used.' } })
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Condition'), { target: { value: 'Good' } })
  fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Pickup location'), { target: { value: 'Student Union' } })
  fireEvent.click(screen.getByRole('button', { name: 'Submit listing for review' }))

  expect(await screen.findByText('Your free item was submitted for review.')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/items/create/',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        title: 'Desk lamp',
        description: 'Working lamp, lightly used.',
        category_id: 1,
        item_condition: 'Good',
        quantity: 1,
        pickup_location: 'Student Union',
      }),
    }),
  )
})

test('administrators can change a category active state using the API field name', async () => {
  render(<App />)
  await signIn('angela.brooks@famu.edu')
  fireEvent.click(screen.getByRole('button', { name: 'Manage categories' }))

  fireEvent.click(await screen.findByRole('button', { name: 'Deactivate' }))

  expect(await screen.findByText('Category status updated.')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/categories/1/',
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ is_active: false }),
    }),
  )
})

test('campus users search database listings', async () => {
  render(<App />)
  await signIn('jordan2.davis@famu.edu')
  fireEvent.click(screen.getByRole('button', { name: 'Browse available items' }))

  expect(await screen.findByText('Calculus: Early Transcendentals, 8th Edition')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Search available items'), { target: { value: 'campbell' } })
  expect(await screen.findByText('Campbell Biology, 12th Edition')).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByText('Calculus: Early Transcendentals, 8th Edition')).not.toBeInTheDocument())
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('q=campbell'), expect.any(Object))
})

test('campus users can reserve free items without seeing price points', async () => {
  render(<App />)
  await signIn('jordan2.davis@famu.edu')
  fireEvent.click(screen.getByRole('button', { name: 'Browse available items' }))

  const title = await screen.findByText('Calculus: Early Transcendentals, 8th Edition')
  expect(screen.queryByText('$45.00 est.')).not.toBeInTheDocument()
  expect(screen.getAllByText('Free').length).toBeGreaterThan(0)
  const ownedItemCard = title.closest('article')
  if (!ownedItemCard) throw new Error('Expected the listing to appear in an item card.')
  expect(within(ownedItemCard).queryByRole('button', { name: 'Reserve item' })).not.toBeInTheDocument()

  const reservableTitle = await screen.findByText('Campbell Biology, 12th Edition')
  const itemCard = reservableTitle.closest('article')
  if (!itemCard) throw new Error('Expected the listing to appear in an item card.')
  fireEvent.click(within(itemCard).getByRole('button', { name: 'Reserve item' }))

  expect(await screen.findByText(/Reserved Campbell Biology, 12th Edition/)).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByText('Campbell Biology, 12th Edition')).not.toBeInTheDocument())
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/items/2/reserve/'),
    expect.objectContaining({ method: 'POST' }),
  )
})

test('administrators search database users', async () => {
  render(<App />)
  const navigation = await signIn('angela.brooks@famu.edu')
  fireEvent.click(within(navigation).getByRole('button', { name: 'Manage the users' }))

  expect(await screen.findByText('Jordan Davis')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Search users'), { target: { value: 'jordan' } })
  expect(await screen.findByText('Jordan Davis')).toBeInTheDocument()
  await waitFor(() => expect(within(screen.getByRole('table')).queryByText('Angela Brooks')).not.toBeInTheDocument())
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('q=jordan'), expect.any(Object))
})

test('department and organization navigation options show separate data views', async () => {
  const { unmount } = render(<App />)
  const navigation = await signIn('robert.hayes@famu.edu')
  fireEvent.click(within(navigation).getByRole('button', { name: 'Department inventory' }))
  expect(await screen.findByText('Department of Computer & Information Sciences')).toBeInTheDocument()
  expect(screen.getByText('Dell OptiPlex 7070 Desktop Computers')).toBeInTheDocument()
  expect(screen.queryByText('Arduino Uno Starter Kits')).not.toBeInTheDocument()

  fireEvent.click(within(navigation).getByRole('button', { name: 'Reservations' }))
  expect(await screen.findByText('Arduino Uno Starter Kits')).toBeInTheDocument()
  expect(screen.queryByText('Dell OptiPlex 7070 Desktop Computers')).not.toBeInTheDocument()

  unmount()
  sessionStorage.clear()

  render(<App />)
  const organizationNavigation = await signIn('jasmine1.carter@famu.edu')
  fireEvent.click(within(organizationNavigation).getByRole('button', { name: 'Organization activity' }))
  expect(await screen.findByText('FAMU Environmental Club')).toBeInTheDocument()
  expect(screen.getByText('Completed free-item exchanges')).toBeInTheDocument()
  expect(screen.getAllByText('Furniture')).toHaveLength(2)
  expect(screen.queryByText('Study Tables')).not.toBeInTheDocument()
  expect(screen.queryByText('Fall Move-Out Collection Drive')).not.toBeInTheDocument()

  fireEvent.click(within(organizationNavigation).getByRole('button', { name: 'Listings & reservations' }))
  expect(await screen.findByText('Reusable Water Bottles')).toBeInTheDocument()
  expect(screen.getAllByText('Study Tables')).toHaveLength(2)
  expect(screen.queryByText('Fall Move-Out Collection Drive')).not.toBeInTheDocument()

  fireEvent.click(within(organizationNavigation).getByRole('button', { name: 'Drives & giveaways' }))
  expect(await screen.findByText('Fall Move-Out Collection Drive')).toBeInTheDocument()
  expect(screen.getByText('Twin XL Bedding Set')).toBeInTheDocument()
  expect(screen.queryByText('Reusable Water Bottles')).not.toBeInTheDocument()
})

test('moderators search and filter database reports', async () => {
  render(<App />)
  const navigation = await signIn('marcus.johnson@famu.edu')
  fireEvent.click(within(navigation).getByRole('button', { name: 'Report queue' }))

  expect(await screen.findByText(/Suspicious Activity/)).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Filter reports by type'), { target: { value: 'Exchange problem' } })
  expect(await screen.findByText(/Suspicious Activity/)).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByText(/Misleading Event Information/)).not.toBeInTheDocument())
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('type=Exchange'), expect.any(Object))
})

test('moderator report queue and reported listings show different scopes', async () => {
  render(<App />)
  const navigation = await signIn('marcus.johnson@famu.edu')

  fireEvent.click(within(navigation).getByRole('button', { name: 'Report queue' }))
  expect(await screen.findByText(/Misleading Event Information/)).toBeInTheDocument()
  expect(screen.queryByText(/Missing parts/)).not.toBeInTheDocument()

  fireEvent.click(within(navigation).getByRole('button', { name: 'Reported listings' }))
  expect(await screen.findByText('Desk lamp')).toBeInTheDocument()
  expect(screen.getByText('Textbook set')).toBeInTheDocument()
  expect(screen.getAllByText('Tyrell Jackson')).toHaveLength(2)
  expect(screen.getAllByText('2')).toHaveLength(2)
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('items_only=true'),
    expect.any(Object),
  )
})

test('shows a clear error if the backend cannot be reached', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Network unavailable'))
  render(<App />)
  fireEvent.change(screen.getByLabelText('FAMU email'), { target: { value: 'jordan2.davis@famu.edu' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: demoPassword } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the application API')
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
})

test('rejects invalid credentials without granting access', async () => {
  render(<App />)
  fireEvent.change(screen.getByLabelText('FAMU email'), { target: { value: 'jordan2.davis@famu.edu' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'incorrect' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.')
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
})
