import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Flag,
  HandHelping,
  LayoutDashboard,
  Leaf,
  LogIn,
  LogOut,
  MapPin,
  Package,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  getCurrentAccount,
  getActivityReport,
  getCategories,
  getDepartment,
  getItems,
  getMessages,
  getModerationActions,
  getMyListings,
  getMyReservations,
  getOrganization,
  getOrganizationProfile,
  getPendingListings,
  getReports,
  getSystemSettings,
  getUsers,
  cancelReservation,
  createCategory,
  createListing,
  removeMyListing,
  reserveItem,
  reviewPendingListing,
  sendMessage,
  signIn,
  updateCategory,
  updateOrganizationProfile,
  updateReportStatus,
  updateSystemSetting,
  ApiError,
} from './api'
import type {
  ActivityReport,
  Account,
  CampusMessage,
  Category,
  CollectionEvent,
  DepartmentWorkspace,
  EventItem,
  Listing,
  ModerationAction,
  MyListing,
  MyReservation,
  OrganizationWorkspace,
  Report,
  Reservation,
  Role,
  SystemSetting,
} from './data'

type Screen = 'overview' | 'users' | 'categories' | 'reports-queue' | 'reported-listings' | 'activity' | 'settings'
  | 'browse' | 'create-listing' | 'reservations' | 'my-listings' | 'messages'
  | 'department' | 'department-reservations' | 'department-profile'
  | 'organization-activity' | 'organization-listings-reservations'
  | 'organization-drives' | 'organization-profile' | 'actions'
type NavigationItem = { label: string; screen: Screen; icon: LucideIcon }
type WorkspaceData =
  | { kind: 'users'; users: Account[]; roles: string[] }
  | { kind: 'items'; items: Listing[]; categories: string[] }
  | { kind: 'department'; workspace: DepartmentWorkspace }
  | { kind: 'organization'; workspace: OrganizationWorkspace }
  | { kind: 'reports'; reports: Report[]; pendingListings?: MyListing[] }
  | { kind: 'categories'; categories: Category[] }
  | { kind: 'activity'; report: ActivityReport }
  | { kind: 'settings'; settings: SystemSetting[] }
  | { kind: 'create-listing'; categories: Category[] }
  | { kind: 'my-listings'; listings: MyListing[] }
  | { kind: 'reservations'; reservations: MyReservation[] }
  | { kind: 'messages'; messages: CampusMessage[] }
  | { kind: 'profile'; organization: { id: number; name: string; type: string; location: string | null; contact_email: string | null; status: string } }
  | { kind: 'actions'; actions: ModerationAction[] }

const TOKEN_KEY = 'rrrs_api_token'

const roleNavigation: Record<Role, NavigationItem[]> = {
  Administrator: [
    { label: 'Overview', screen: 'overview', icon: LayoutDashboard },
    { label: 'Manage users', screen: 'users', icon: Users },
    { label: 'Manage categories', screen: 'categories', icon: Tag },
    { label: 'Review reports', screen: 'reports-queue', icon: Flag },
    { label: 'Activity reports', screen: 'activity', icon: ClipboardList },
    { label: 'System settings', screen: 'settings', icon: Settings },
  ],
  'Campus User': [
    { label: 'Overview', screen: 'overview', icon: LayoutDashboard },
    { label: 'Browse items', screen: 'browse', icon: Search },
    { label: 'List an item', screen: 'create-listing', icon: Package },
    { label: 'My reservations', screen: 'reservations', icon: CalendarDays },
    { label: 'My listings', screen: 'my-listings', icon: BookOpen },
    { label: 'Messages', screen: 'messages', icon: Bell },
  ],
  'Department Representative': [
    { label: 'Overview', screen: 'overview', icon: LayoutDashboard },
    { label: 'Department inventory', screen: 'department', icon: Building2 },
    { label: 'Reservations', screen: 'department-reservations', icon: CalendarDays },
    { label: 'Department profile', screen: 'department-profile', icon: BadgeCheck },
    { label: 'Activity report', screen: 'activity', icon: ClipboardList },
  ],
  'Student Organization Representative': [
    { label: 'Overview', screen: 'overview', icon: LayoutDashboard },
    { label: 'Organization activity', screen: 'organization-activity', icon: Leaf },
    { label: 'Listings & reservations', screen: 'organization-listings-reservations', icon: Package },
    { label: 'Drives & giveaways', screen: 'organization-drives', icon: CalendarDays },
    { label: 'Organization profile', screen: 'organization-profile', icon: BadgeCheck },
  ],
  'Community Moderator': [
    { label: 'Overview', screen: 'overview', icon: LayoutDashboard },
    { label: 'Report queue', screen: 'reports-queue', icon: Flag },
    { label: 'Reported listings', screen: 'reported-listings', icon: Package },
    { label: 'Exchange problems', screen: 'reports-queue', icon: HandHelping },
    { label: 'Action history', screen: 'actions', icon: ClipboardList },
  ],
}

const roleHeadlines: Record<Role, { title: string; description: string; feature: string; screen: Screen }> = {
  Administrator: {
    title: 'Manage your community',
    description: 'Search campus accounts and keep the resource exchange running smoothly.',
    feature: 'Search user accounts',
    screen: 'users',
  },
  'Campus User': {
    title: 'Find something useful',
    description: 'Browse free and reusable resources shared across the FAMU community.',
    feature: 'Browse available items',
    screen: 'browse',
  },
  'Department Representative': {
    title: 'Your department at a glance',
    description: 'Keep track of shared department inventory and incoming reservations.',
    feature: 'View department inventory',
    screen: 'department',
  },
  'Student Organization Representative': {
    title: 'Make a difference together',
    description: 'Manage your organization’s listings, reservations, and campus events.',
    feature: 'View organization activity',
    screen: 'organization-activity',
  },
  'Community Moderator': {
    title: 'Keep exchanges trustworthy',
    description: 'Review community reports about listings, members, and exchanges.',
    feature: 'Review reported content',
    screen: 'reports-queue',
  },
}

const allRoles: Role[] = [
  'Campus User',
  'Department Representative',
  'Student Organization Representative',
  'Community Moderator',
  'Administrator',
]

function fullName(account: Pick<Account, 'firstName' | 'lastName'>) {
  return `${account.firstName} ${account.lastName}`
}

function statusStyle(status: string) {
  if (['Active', 'Available', 'Completed', 'Resolved', 'Accepted', 'Distributed'].includes(status)) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
  }
  if (['Pending', 'Pending Review', 'Under Review', 'Reserved', 'Planned'].includes(status)) {
    return 'bg-amber-50 text-amber-800 ring-amber-600/15'
  }
  return 'bg-stone-100 text-stone-600 ring-stone-500/15'
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(status)}`}>{status}</span>
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  )
}

function Metric({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="rounded-xl bg-emerald-50 p-2 text-emerald-800"><Icon size={18} aria-hidden /></span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  )
}

function EmptyState({ children }: { children: string }) {
  return <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-center text-sm text-slate-500">{children}</div>
}

function TableFrame({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm"><table className="w-full min-w-[680px] text-left text-sm">{children}</table></div>
}

function TableHead({ labels }: { labels: string[] }) {
  return <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr>{labels.map((label) => <th key={label} className="px-5 py-3.5">{label}</th>)}</tr></thead>
}

function ListingCards({
  items,
  onReserve,
  reservingItemId = null,
  reserveOwner,
}: {
  items: Listing[]
  onReserve?: (item: Listing) => void
  reservingItemId?: number | null
  reserveOwner?: string
}) {
  if (!items.length) return <EmptyState>No listings match those filters. Try another search.</EmptyState>
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-32 items-center justify-center bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50">
            {item.mainPhoto
              ? <img src={item.mainPhoto} alt="" className="h-full w-full object-cover" />
              : <Package size={38} strokeWidth={1.4} className="text-emerald-800/60" aria-hidden />}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-600">{item.category}</span>
              <StatusBadge status={item.status} />
            </div>
            <h3 className="mt-3 font-semibold leading-snug text-slate-900">{item.title}</h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">{item.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4 text-sm">
              <span className="font-semibold text-slate-900">{item.quantity > 1 ? `${item.quantity} available` : item.condition}</span>
              <span className="font-semibold text-emerald-800">Free</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={14} aria-hidden />{item.location}</p>
            <p className="mt-1 text-xs text-slate-400">Shared by {item.owner}</p>
            {onReserve && item.owner !== reserveOwner && (
              <button
                type="button"
                onClick={() => onReserve(item)}
                disabled={reservingItemId !== null}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
              >
                <HandHelping size={16} aria-hidden />
                {reservingItemId === item.id ? 'Reserving…' : 'Reserve item'}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function SignIn({ onSignIn, notice }: { onSignIn: (token: string, account: Account) => void; notice: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(notice)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = await signIn(email, password)
      onSignIn(result.token, result.user)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="h-10 w-9" />
          <span className="font-bold tracking-tight">Rattler Resource Rescue</span>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900">FAMU campus exchange</span>
      </header>
      <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-5 py-8 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <section className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900"><Sparkles size={14} aria-hidden /> Reuse resources. Support each other.</p>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">Good things deserve a second life.</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">Find what you need. Share what you don’t. Keep campus resources in use.</p>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {[
              { icon: HandHelping, title: 'Share freely', text: 'Give useful items a new home.' },
              { icon: Leaf, title: 'Waste less', text: 'Keep resources in circulation.' },
              { icon: Users, title: 'Grow together', text: 'Connect across campus.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-stone-200 bg-white/80 p-4">
                <Icon size={20} className="text-emerald-800" aria-hidden />
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-9">
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in with an account from the Rattler Resource Rescue database.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              FAMU email
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@famu.edu"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
              />
            </label>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70">
              <LogIn size={17} aria-hidden />{submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Local sample accounts</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">The Sprint III sample users use the shared development password <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-emerald-900">Rattler2026!</code>. Their role is loaded from the database after sign-in.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

function App() {
  const [account, setAccount] = useState<Account | null>(null)
  const [token, setToken] = useState('')
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionNotice, setSessionNotice] = useState('')
  const [screen, setScreen] = useState<Screen>('overview')
  const [activeNavigationLabel, setActiveNavigationLabel] = useState('Overview')
  const [userSearch, setUserSearch] = useState('')
  const [userRole, setUserRole] = useState('All roles')
  const [listingSearch, setListingSearch] = useState('')
  const [listingCategory, setListingCategory] = useState('All categories')
  const [reportSearch, setReportSearch] = useState('')
  const [reportType, setReportType] = useState('All reports')
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [reservationFeedback, setReservationFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [reservingItemId, setReservingItemId] = useState<number | null>(null)
  const [featureFeedback, setFeatureFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [featureBusy, setFeatureBusy] = useState(false)

  useEffect(() => {
    const savedToken = sessionStorage.getItem(TOKEN_KEY)
    if (!savedToken) {
      setSessionLoading(false)
      return
    }
    let active = true
    getCurrentAccount(savedToken)
      .then((currentAccount) => {
        if (!active) return
        setToken(savedToken)
        setAccount(currentAccount)
      })
      .catch((error: unknown) => {
        if (!active) return
        sessionStorage.removeItem(TOKEN_KEY)
        setSessionNotice(error instanceof Error ? error.message : 'Your saved session is no longer valid. Please sign in again.')
      })
      .finally(() => {
        if (active) setSessionLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!account || !token) {
      setWorkspaceData(null)
      return
    }

    const controller = new AbortController()
    const requestedScreen = screen === 'overview' ? roleHeadlines[account.role].screen : screen
    let load: Promise<WorkspaceData> | null = null

    if (requestedScreen === 'users' && account.role === 'Administrator') {
      load = getUsers(token, screen === 'users' ? userSearch : '', screen === 'users' ? userRole : '', controller.signal)
        .then((result) => ({ kind: 'users', users: result.users, roles: result.roles }))
    } else if (requestedScreen === 'categories' && account.role === 'Administrator') {
      load = getCategories(token, controller.signal)
        .then((result) => ({ kind: 'categories', categories: result.categories }))
    } else if (requestedScreen === 'settings' && account.role === 'Administrator') {
      load = getSystemSettings(token, controller.signal)
        .then((result) => ({ kind: 'settings', settings: result.settings }))
    } else if (requestedScreen === 'activity'
      && ['Administrator', 'Department Representative'].includes(account.role)) {
      load = getActivityReport(token, controller.signal)
        .then((report) => ({ kind: 'activity', report }))
    } else if (requestedScreen === 'browse' && account.role === 'Campus User') {
      load = getItems(token, screen === 'browse' ? listingSearch : '', screen === 'browse' ? listingCategory : '', controller.signal)
        .then((result) => ({ kind: 'items', items: result.items, categories: result.categories }))
    } else if (requestedScreen === 'create-listing' && account.role === 'Campus User') {
      load = getCategories(token, controller.signal)
        .then((result) => ({ kind: 'create-listing', categories: result.categories.filter((category) => category.isActive) }))
    } else if (requestedScreen === 'my-listings' && account.role === 'Campus User') {
      load = getMyListings(token, controller.signal)
        .then((result) => ({ kind: 'my-listings', listings: result.listings }))
    } else if (requestedScreen === 'reservations' && account.role === 'Campus User') {
      load = getMyReservations(token, controller.signal)
        .then((result) => ({ kind: 'reservations', reservations: result.reservations }))
    } else if (requestedScreen === 'messages' && account.role === 'Campus User') {
      load = getMessages(token, controller.signal)
        .then((result) => ({ kind: 'messages', messages: result.messages }))
    } else if (
      ['department', 'department-reservations'].includes(requestedScreen)
      && account.role === 'Department Representative'
    ) {
      load = getDepartment(token, controller.signal).then((workspace) => ({ kind: 'department', workspace }))
    } else if (requestedScreen === 'department-profile' && account.role === 'Department Representative') {
      load = getOrganizationProfile(token, true, controller.signal)
        .then((result) => ({ kind: 'profile', organization: result.organization }))
    } else if (
      ['organization-activity', 'organization-listings-reservations', 'organization-drives'].includes(requestedScreen)
      && account.role === 'Student Organization Representative'
    ) {
      load = getOrganization(token, controller.signal).then((workspace) => ({ kind: 'organization', workspace }))
    } else if (requestedScreen === 'organization-profile' && account.role === 'Student Organization Representative') {
      load = getOrganizationProfile(token, false, controller.signal)
        .then((result) => ({ kind: 'profile', organization: result.organization }))
    } else if (requestedScreen === 'actions' && account.role === 'Community Moderator') {
      load = getModerationActions(token, controller.signal)
        .then((result) => ({ kind: 'actions', actions: result.actions }))
    } else if (requestedScreen === 'reported-listings' && account.role === 'Community Moderator') {
      load = getReports(token, reportSearch, 'Listing', controller.signal, { status: 'all', itemsOnly: true })
        .then((result) => ({ kind: 'reports', reports: result.reports }))
    } else if (requestedScreen === 'reports-queue'
      && ['Administrator', 'Community Moderator'].includes(account.role)) {
      const reports = getReports(
        token,
        screen === 'reports-queue' ? reportSearch : '',
        screen === 'reports-queue' ? reportType : '',
        controller.signal,
        { status: 'queue' },
      )
      if (account.role === 'Administrator') {
        load = Promise.all([reports, getPendingListings(token, controller.signal)])
          .then(([result, pending]) => ({
            kind: 'reports',
            reports: result.reports,
            pendingListings: pending.listings,
          }))
      } else {
        load = reports.then((result) => ({ kind: 'reports', reports: result.reports }))
      }
    }

    if (!load) {
      setWorkspaceData(null)
      setDataLoading(false)
      setDataError('')
      return () => controller.abort()
    }

    setDataLoading(true)
    setDataError('')
    setWorkspaceData(null)
    load
      .then((result) => {
        if (!controller.signal.aborted) setWorkspaceData(result)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY)
          setAccount(null)
          setToken('')
          setSessionNotice(error.message)
          return
        }
        setDataError(error instanceof Error ? error.message : 'Could not load data from the database.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setDataLoading(false)
      })

    return () => controller.abort()
  }, [
    account,
    token,
    screen,
    userSearch,
    userRole,
    listingSearch,
    listingCategory,
    reportSearch,
    reportType,
    refreshVersion,
  ])

  if (sessionLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5] text-sm text-slate-500">Restoring your session…</div>
  }
  if (!account) {
    return <SignIn notice={sessionNotice} onSignIn={(newToken, newAccount) => {
      sessionStorage.setItem(TOKEN_KEY, newToken)
      setToken(newToken)
      setAccount(newAccount)
      setScreen('overview')
      setActiveNavigationLabel('Overview')
      setSessionNotice('')
    }} />
  }

  const role = account.role
  const accountId = account.id
  const reserveOwner = fullName(account)
  const navigation = roleNavigation[role]
  const headline = roleHeadlines[role]
  const department = workspaceData?.kind === 'department' ? workspaceData.workspace : null
  const organization = workspaceData?.kind === 'organization' ? workspaceData.workspace : null
  const displayedUsers = workspaceData?.kind === 'users' ? workspaceData.users : []
  const userRoles = workspaceData?.kind === 'users' ? workspaceData.roles : [...allRoles]
  const displayedItems = workspaceData?.kind === 'items' ? workspaceData.items : []
  const categories = workspaceData?.kind === 'items' ? workspaceData.categories : []
  const displayedReports = workspaceData?.kind === 'reports' ? workspaceData.reports : []

  function openScreen(nextScreen: Screen, label?: string) {
    setScreen(nextScreen)
    const navigationLabel = label ?? navigation.find((item) => item.screen === nextScreen)?.label ?? 'Overview'
    setActiveNavigationLabel(navigationLabel)
    if (navigationLabel === 'Reported listings') {
      setReportType('Listing')
      setReportSearch('')
    }
    else if (navigationLabel === 'Exchange problems') setReportType('Exchange problem')
    else if (navigationLabel === 'Review reports' || navigationLabel === 'Report queue') setReportType('All reports')
    setFeatureFeedback(null)
  }

  async function runFeatureAction(action: () => Promise<unknown>, successMessage: string) {
    setFeatureFeedback(null)
    setFeatureBusy(true)
    try {
      await action()
      setFeatureFeedback({ kind: 'success', message: successMessage })
      setRefreshVersion((value) => value + 1)
      return true
    } catch (error) {
      setFeatureFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'The action failed. Please try again.',
      })
      return false
    } finally {
      setFeatureBusy(false)
    }
  }

  async function handleReserve(item: Listing) {
    setReservingItemId(item.id)
    setReservationFeedback(null)
    try {
      await reserveItem(token, item.id)
      setReservationFeedback({
        kind: 'success',
        message: `Reserved ${item.title}. Pick-up location: ${item.location}.`,
      })
      setRefreshVersion((value) => value + 1)
    } catch (error) {
      setReservationFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not reserve this item. Please try again.',
      })
    } finally {
      setReservingItemId(null)
    }
  }

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY)
    setAccount(null)
    setToken('')
    setScreen('overview')
    setActiveNavigationLabel('Overview')
    setWorkspaceData(null)
    setSessionNotice('')
    setReservationFeedback(null)
    setFeatureFeedback(null)
  }

  function metricValue(value: number | undefined) {
    if (dataLoading && workspaceData === null) return '…'
    if (dataError) return '—'
    return value ?? '—'
  }

  function renderOverview() {
    let metrics: { label: string; value: number | undefined; note: string; icon: LucideIcon }[] = []
    if (role === 'Administrator') {
      const users = workspaceData?.kind === 'users' ? workspaceData.users : null
      metrics = [
        { label: 'Registered users', value: users?.length, note: 'Accounts in the database', icon: Users },
        { label: 'Active accounts', value: users?.filter((user) => user.status === 'Active').length, note: 'Accounts ready to use the exchange', icon: BadgeCheck },
        { label: 'System roles', value: users ? new Set(users.map((user) => user.role)).size : undefined, note: 'Role-based access enabled', icon: Shield },
      ]
    } else if (role === 'Campus User') {
      const items = workspaceData?.kind === 'items' ? workspaceData.items : null
      metrics = [
        { label: 'Available items', value: items?.length, note: 'Ready to find a new home', icon: Package },
        { label: 'Categories', value: items ? categories.length : undefined, note: 'Active item categories', icon: Tag },
        { label: 'Community members', value: items ? new Set(items.map((item) => item.owner)).size : undefined, note: 'Sharing resources with students', icon: Users },
      ]
    } else if (role === 'Department Representative') {
      metrics = [
        { label: 'Department listings', value: department?.listings.length, note: department?.organization.name ?? 'Your department', icon: Building2 },
        { label: 'Reservations', value: department?.reservations.length, note: 'Associated with department items', icon: CalendarDays },
        { label: 'Available items', value: department?.listings.filter((item) => item.status === 'Available').length, note: 'Ready to be shared', icon: Package },
      ]
    } else if (role === 'Student Organization Representative') {
      metrics = [
        { label: 'Organization listings', value: organization?.listings.length, note: organization?.organization.name ?? 'Your organization', icon: Leaf },
        { label: 'Reservations', value: organization?.reservations.length, note: 'Associated with your organization', icon: CalendarDays },
        { label: 'Drives & giveaways', value: organization?.events.length, note: 'Current and upcoming events', icon: Sparkles },
      ]
    } else {
      metrics = [
        { label: 'Open reports', value: workspaceData?.kind === 'reports' ? workspaceData.reports.filter((report) => report.status === 'Open').length : undefined, note: 'Awaiting an initial review', icon: Flag },
        { label: 'Under review', value: workspaceData?.kind === 'reports' ? workspaceData.reports.filter((report) => report.status === 'Under Review').length : undefined, note: 'Active moderation cases', icon: ClipboardList },
        { label: 'Reported listings', value: workspaceData?.kind === 'reports' ? workspaceData.reports.filter((report) => report.type === 'Listing').length : undefined, note: 'Listings and events reported', icon: Package },
      ]
    }

    return (
      <>
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#074b3b] via-emerald-900 to-[#123c35] p-7 text-white shadow-lg sm:p-10">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">{role} workspace</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{headline.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">{headline.description}</p>
            <button onClick={() => openScreen(headline.screen)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50">
              {headline.feature}<ArrowUpRight size={17} aria-hidden />
            </button>
          </div>
          <div aria-hidden className="absolute -right-8 -top-14 hidden h-72 w-72 rounded-full border border-white/10 sm:block" />
          <div aria-hidden className="absolute -right-1 -top-6 hidden h-56 w-56 rounded-full border border-white/10 sm:block" />
          <Leaf aria-hidden className="absolute bottom-7 right-12 hidden h-24 w-24 text-white/10 sm:block" />
        </section>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => <Metric key={metric.label} {...metric} value={metricValue(metric.value)} />)}
        </section>
        <section className="mt-9">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-800">Your workspace</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">Quick access</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {navigation.filter((item) => item.screen !== 'overview').map(({ label, screen: targetScreen, icon: Icon }) => (
              <button key={label} onClick={() => openScreen(targetScreen, label)} className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md">
                <span className="rounded-xl bg-emerald-50 p-3 text-emerald-800"><Icon size={20} aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold text-slate-900">{label}<ChevronRight size={16} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-800" aria-hidden /></span>
                  <span className="mt-1 block text-sm text-slate-500">Open this part of your workspace.</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </>
    )
  }

  function renderUsers() {
    if (workspaceData?.kind !== 'users') return null
    return (
      <>
        <SectionTitle eyebrow="Administration" title="Manage users" description="Search and browse registered accounts and their assigned system roles." />
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-slate-400 shadow-sm">
            <Search size={17} aria-hidden />
            <input aria-label="Search users" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search name or email" className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-slate-500 shadow-sm">
            <SlidersHorizontal size={16} aria-hidden />
            <select aria-label="Filter users by role" value={userRole} onChange={(event) => setUserRole(event.target.value)} className="bg-transparent text-slate-700 outline-none">
              <option>All roles</option>
              {userRoles.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <p className="mb-3 text-sm text-slate-500">{displayedUsers.length} accounts</p>
        <TableFrame>
          <TableHead labels={['User', 'Email', 'System role', 'Account status']} />
          <tbody className="divide-y divide-stone-100">
            {displayedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-stone-50/70">
                <td className="px-5 py-4 font-medium text-slate-900">{fullName(user)}</td>
                <td className="px-5 py-4 text-slate-600">{user.email}</td>
                <td className="px-5 py-4 text-slate-600">{user.role}</td>
                <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
        {!displayedUsers.length && <div className="mt-4"><EmptyState>No accounts match your search.</EmptyState></div>}
      </>
    )
  }

  function renderBrowse() {
    if (workspaceData?.kind !== 'items') return null
    return (
      <>
        <SectionTitle eyebrow="Free campus resources" title="Browse available items" description="Find lightly used items shared by the FAMU community. Everything is free—reserve an item to arrange pickup." />
        {reservationFeedback && (
          <div
            role={reservationFeedback.kind === 'error' ? 'alert' : 'status'}
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${reservationFeedback.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}
          >
            {reservationFeedback.message}
          </div>
        )}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-slate-400 shadow-sm">
            <Search size={17} aria-hidden />
            <input aria-label="Search available items" value={listingSearch} onChange={(event) => setListingSearch(event.target.value)} placeholder="Try “calculator” or “dorm essentials”" className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-slate-500 shadow-sm">
            <SlidersHorizontal size={16} aria-hidden />
            <select aria-label="Filter by category" value={listingCategory} onChange={(event) => setListingCategory(event.target.value)} className="bg-transparent text-slate-700 outline-none">
              <option>All categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
        </div>
        <p className="mb-4 text-sm text-slate-500">{displayedItems.length} available items</p>
        <ListingCards
          items={displayedItems}
          onReserve={handleReserve}
          reservingItemId={reservingItemId}
          reserveOwner={reserveOwner}
        />
      </>
    )
  }

  function renderReservations(items: Reservation[]) {
    if (!items.length) return <EmptyState>No reservations are currently associated with these items.</EmptyState>
    return (
      <TableFrame>
        <TableHead labels={['Item', 'Reserved by', 'Date', 'Status']} />
        <tbody className="divide-y divide-stone-100">
          {items.map((reservation) => (
            <tr key={reservation.id}>
              <td className="px-5 py-4 font-medium text-slate-900">{reservation.itemTitle}</td>
              <td className="px-5 py-4 text-slate-600">{reservation.reservedBy}</td>
              <td className="px-5 py-4 text-slate-600">{reservation.reservedAt}</td>
              <td className="px-5 py-4"><StatusBadge status={reservation.status} /></td>
            </tr>
          ))}
        </tbody>
      </TableFrame>
    )
  }

  function renderDepartmentInventory() {
    if (!department) return null
    return (
      <>
        <SectionTitle eyebrow="Department inventory" title={department.organization.name} description="Inventory currently managed by your department." />
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <Metric label="Total listings" value={department.listings.length} note="Department-owned items" icon={Package} />
          <Metric label="Available" value={department.listings.filter((item) => item.status === 'Available').length} note="Ready for campus pickup" icon={BadgeCheck} />
          <Metric label="Reserved items" value={department.listings.filter((item) => item.status === 'Reserved').length} note="Currently held for pickup" icon={CalendarDays} />
        </div>
        {department.listings.length ? (
          <TableFrame>
            <TableHead labels={['Item', 'Category', 'Quantity', 'Status']} />
            <tbody className="divide-y divide-stone-100">
              {department.listings.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-medium text-slate-900">{item.title}<span className="mt-1 block text-xs text-slate-500">{item.location}</span></td>
                  <td className="px-5 py-4 text-slate-600">{item.category}</td>
                  <td className="px-5 py-4 text-slate-600">{item.quantity}</td>
                  <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        ) : <EmptyState>This department has no listings in the database.</EmptyState>}
      </>
    )
  }

  function renderDepartmentReservations() {
    if (!department) return null
    return (
      <>
        <SectionTitle eyebrow="Department reservations" title="Reservations" description={`Reservation activity for items managed by ${department.organization.name}.`} />
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <Metric label="Total reservations" value={department.reservations.length} note="For department-owned items" icon={CalendarDays} />
          <Metric label="Open reservations" value={department.reservations.filter((reservation) => ['Pending', 'Active'].includes(reservation.status)).length} note="Pending or active" icon={BadgeCheck} />
          <Metric label="Completed" value={department.reservations.filter((reservation) => reservation.status === 'Completed').length} note="Successfully picked up" icon={Package} />
        </div>
        {renderReservations(department.reservations)}
      </>
    )
  }

  function renderOrganizationActivity() {
    if (!organization) return null
    const completedReservations = organization.reservations.filter((reservation) => reservation.status === 'Completed')
    const completedByCategory = new Map<string, number>()
    completedReservations.forEach((reservation) => {
      const category = reservation.category || organization.listings.find((item) => item.id === reservation.itemId)?.category || 'Uncategorized'
      completedByCategory.set(category, (completedByCategory.get(category) ?? 0) + 1)
    })
    const categoryMetrics = [...completedByCategory.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category))

    return (
      <>
        <SectionTitle eyebrow="Organization activity" title={organization.organization.name} description="Track completed free-item exchanges by category. These metrics show completed reservations, not paid sales." />
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <Metric label="Completed free-item exchanges" value={completedReservations.length} note="Successfully completed reservations" icon={HandHelping} />
          <Metric label="Categories exchanged" value={categoryMetrics.length} note="Categories with completed exchanges" icon={Tag} />
          <Metric label="Most exchanged category" value={categoryMetrics[0]?.category ?? '—'} note={categoryMetrics[0] ? `${categoryMetrics[0].count} completed exchanges` : 'No completed exchanges yet'} icon={Package} />
        </div>
        <h3 className="mb-3 text-lg font-bold text-slate-900">Completed exchanges by category</h3>
        {categoryMetrics.length ? (
          <TableFrame>
            <TableHead labels={['Item category', 'Completed exchanges']} />
            <tbody className="divide-y divide-stone-100">
              {categoryMetrics.map(({ category, count }) => (
                <tr key={category}>
                  <td className="px-5 py-4 font-medium text-slate-900">{category}</td>
                  <td className="px-5 py-4 text-slate-600">{count}</td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        ) : <EmptyState>No completed exchanges are available to report yet.</EmptyState>}
      </>
    )
  }

  function renderOrganizationListingsReservations() {
    if (!organization) return null
    return (
      <>
        <SectionTitle eyebrow="Organization inventory" title="Listings & reservations" description={`Items and reservation activity associated with ${organization.organization.name}.`} />
        <h3 className="mb-3 text-lg font-bold text-slate-900">Listings</h3>
        {organization.listings.length ? <ListingCards items={organization.listings} /> : <EmptyState>Your organization has no listings in the database.</EmptyState>}
        <h3 className="mb-3 mt-8 text-lg font-bold text-slate-900">Reservations</h3>
        {renderReservations(organization.reservations)}
      </>
    )
  }

  function renderOrganizationDrives() {
    if (!organization) return null
    const distributedItems = organization.eventItems.filter((eventItem) => eventItem.status === 'Distributed').length
    return (
      <>
        <SectionTitle eyebrow="Organization events" title="Drives & giveaways" description={`Collection drives and giveaways hosted by ${organization.organization.name}.`} />
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <Metric label="Events" value={organization.events.length} note="Drives and giveaways" icon={CalendarDays} />
          <Metric label="Active events" value={organization.events.filter((event) => event.status === 'Active').length} note="Currently underway" icon={Leaf} />
          <Metric label="Items distributed" value={distributedItems} note="Given out through organization events" icon={HandHelping} />
        </div>
        {organization.events.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {organization.events.map((event: CollectionEvent) => (
              <article key={event.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{event.type}</span><StatusBadge status={event.status} /></div>
                <h4 className="mt-3 font-bold text-slate-900">{event.title}</h4>
                <p className="mt-1 text-sm leading-6 text-slate-500">{event.description}</p>
                <p className="mt-3 text-xs text-slate-500">{event.date} · {event.location}</p>
                {organization.eventItems.filter((eventItem: EventItem) => eventItem.eventId === event.id).length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-stone-100 pt-3">
                    {organization.eventItems.filter((eventItem: EventItem) => eventItem.eventId === event.id).map((eventItem: EventItem) => (
                      <li key={eventItem.itemId} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-slate-700">{eventItem.title}</span><StatusBadge status={eventItem.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        ) : <EmptyState>Your organization has no drives or giveaways in the database.</EmptyState>}
      </>
    )
  }

  function renderCreateListing() {
    if (workspaceData?.kind !== 'create-listing') return null
    function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const form = event.currentTarget
      const values = new FormData(form)
      void runFeatureAction(
        () => createListing(token, {
          title: String(values.get('title') ?? ''),
          description: String(values.get('description') ?? ''),
          category_id: Number(values.get('category_id')),
          item_condition: String(values.get('item_condition') ?? ''),
          quantity: Number(values.get('quantity')),
          pickup_location: String(values.get('pickup_location') ?? ''),
        }),
        'Your free item was submitted for review.',
      ).then((succeeded) => { if (succeeded) form.reset() })
    }

    return (
      <>
        <SectionTitle eyebrow="Share with campus" title="List a free item" description="Give a lightly used item a new home. New listings are reviewed before they appear in browse results." />
        <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <label className="block text-sm font-medium text-slate-700">Item name
            <input name="title" required maxLength={150} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 outline-none focus:border-emerald-700" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Description
            <textarea name="description" required rows={4} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 outline-none focus:border-emerald-700" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Category
              <select name="category_id" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3">
                <option value="" disabled>Choose a category</option>
                {workspaceData.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">Condition
              <select name="item_condition" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3">
                <option value="" disabled>Choose a condition</option>
                {['New', 'Like New', 'Good', 'Fair', 'Poor'].map((condition) => <option key={condition}>{condition}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Quantity
              <input name="quantity" type="number" min="1" defaultValue="1" required className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Pickup location
              <input name="pickup_location" required maxLength={200} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
            </label>
          </div>
          <p className="text-sm text-slate-500">Listings are free for FAMU community members.</p>
          <button type="submit" disabled={featureBusy} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Submit listing for review</button>
        </form>
      </>
    )
  }

  function renderMyListings() {
    if (workspaceData?.kind !== 'my-listings') return null
    return (
      <>
        <SectionTitle eyebrow="Your contributions" title="My listings" description="Track review status and remove items you no longer want to offer." />
        {workspaceData.listings.length ? (
          <TableFrame>
            <TableHead labels={['Item', 'Category', 'Condition', 'Quantity', 'Status', 'Action']} />
            <tbody className="divide-y divide-stone-100">
              {workspaceData.listings.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-medium text-slate-900">{item.title}<span className="mt-1 block text-xs text-slate-500">{item.location}</span></td>
                  <td className="px-5 py-4 text-slate-600">{item.category}</td>
                  <td className="px-5 py-4 text-slate-600">{item.condition}</td>
                  <td className="px-5 py-4 text-slate-600">{item.quantity}</td>
                  <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-4">
                    {['Available', 'Pending Review'].includes(item.status) && (
                      <button type="button" disabled={featureBusy} onClick={() => void runFeatureAction(() => removeMyListing(token, item.id), 'Listing removed.')} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        ) : <EmptyState>You have not listed any items yet.</EmptyState>}
      </>
    )
  }

  function renderMyReservations() {
    if (workspaceData?.kind !== 'reservations') return null
    return (
      <>
        <SectionTitle eyebrow="Items you claimed" title="My reservations" description="Review pickup details and cancel reservations you no longer need." />
        {workspaceData.reservations.length ? (
          <TableFrame>
            <TableHead labels={['Item', 'Shared by', 'Pickup', 'Reserved', 'Expires', 'Status', 'Action']} />
            <tbody className="divide-y divide-stone-100">
              {workspaceData.reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="px-5 py-4 font-medium text-slate-900">{reservation.itemTitle}</td>
                  <td className="px-5 py-4 text-slate-600">{reservation.owner}</td>
                  <td className="px-5 py-4 text-slate-600">{reservation.location}</td>
                  <td className="px-5 py-4 text-slate-600">{new Date(reservation.reservedAt).toLocaleString()}</td>
                  <td className="px-5 py-4 text-slate-600">{new Date(reservation.expiresAt).toLocaleString()}</td>
                  <td className="px-5 py-4"><StatusBadge status={reservation.status} /></td>
                  <td className="px-5 py-4">
                    {['Pending', 'Active'].includes(reservation.status) && (
                      <button type="button" disabled={featureBusy} onClick={() => void runFeatureAction(() => cancelReservation(token, reservation.id), 'Reservation cancelled.')} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        ) : <EmptyState>You have no reservations yet. Browse free items to reserve one.</EmptyState>}
      </>
    )
  }

  function renderMessages() {
    if (workspaceData?.kind !== 'messages') return null
    function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const form = event.currentTarget
      const values = new FormData(form)
      const reservationId = String(values.get('reservation_id') ?? '').trim()
      void runFeatureAction(
        () => sendMessage(token, {
          recipient_email: String(values.get('recipient_email') ?? ''),
          body: String(values.get('body') ?? ''),
          ...(reservationId ? { reservation_id: Number(reservationId) } : {}),
        }),
        'Message sent.',
      ).then((succeeded) => { if (succeeded) form.reset() })
    }
    return (
      <>
        <SectionTitle eyebrow="Campus communication" title="Messages" description="Contact another campus member to coordinate a pickup or ask about an item." />
        <form onSubmit={submit} className="mb-7 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Recipient FAMU email
            <input name="recipient_email" type="email" required className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Reservation ID (optional)
            <input name="reservation_id" type="number" min="1" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Message
            <textarea name="body" required maxLength={5000} rows={3} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
          </label>
          <div><button type="submit" disabled={featureBusy} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Send message</button></div>
        </form>
        <h3 className="mb-3 text-lg font-bold text-slate-900">Conversation history</h3>
        {workspaceData.messages.length ? (
          <div className="space-y-3">
            {workspaceData.messages.map((message) => (
              <article key={message.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                  <span>{message.senderId === accountId ? `To ${message.recipient}` : `From ${message.sender}`}</span>
                  <time>{new Date(message.sentAt).toLocaleString()}</time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{message.body}</p>
                {message.reservationId && <p className="mt-2 text-xs text-slate-400">Reservation #{message.reservationId}</p>}
              </article>
            ))}
          </div>
        ) : <EmptyState>No messages yet. Send a message to coordinate an exchange.</EmptyState>}
      </>
    )
  }

  function renderCategories() {
    if (workspaceData?.kind !== 'categories') return null
    function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const form = event.currentTarget
      const values = new FormData(form)
      void runFeatureAction(
        () => createCategory(token, {
          name: String(values.get('name') ?? ''),
          description: String(values.get('description') ?? ''),
          rules: String(values.get('rules') ?? ''),
        }),
        'Category created.',
      ).then((succeeded) => { if (succeeded) form.reset() })
    }
    return (
      <>
        <SectionTitle eyebrow="Administration" title="Manage categories" description="Create categories and activate or deactivate them for new item listings." />
        <form onSubmit={submit} className="mb-7 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700">Name
            <input name="name" required maxLength={100} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Description
            <input name="description" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Listing rules
            <input name="rules" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
          </label>
          <div className="sm:col-span-3"><button type="submit" disabled={featureBusy} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Add category</button></div>
        </form>
        <TableFrame>
          <TableHead labels={['Category', 'Description', 'Rules', 'Status', 'Action']} />
          <tbody className="divide-y divide-stone-100">
            {workspaceData.categories.map((category) => (
              <tr key={category.id}>
                <td className="px-5 py-4 font-medium text-slate-900">{category.name}</td>
                <td className="px-5 py-4 text-slate-600">{category.description || '—'}</td>
                <td className="px-5 py-4 text-slate-600">{category.rules || '—'}</td>
                <td className="px-5 py-4"><StatusBadge status={category.isActive ? 'Active' : 'Inactive'} /></td>
                <td className="px-5 py-4">
                  <button type="button" disabled={featureBusy} onClick={() => void runFeatureAction(() => updateCategory(token, category.id, { isActive: !category.isActive }), 'Category status updated.')} className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-stone-50 disabled:opacity-50">{category.isActive ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      </>
    )
  }

  function renderActivityReport() {
    if (workspaceData?.kind !== 'activity') return null
    return (
      <>
        <SectionTitle eyebrow="Resource activity" title="Activity report" description={`Live activity summary for ${workspaceData.report.scope}.`} />
        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(workspaceData.report.metrics).map(([key, value]) => (
            <Metric key={key} label={key.replace(/([A-Z])/g, ' $1')} value={value} note="Current database total" icon={ClipboardList} />
          ))}
        </div>
        <h3 className="mb-3 text-lg font-bold text-slate-900">Listings by category</h3>
        {workspaceData.report.byCategory.length ? (
          <TableFrame>
            <TableHead labels={['Category', 'Listings']} />
            <tbody className="divide-y divide-stone-100">
              {workspaceData.report.byCategory.map((row) => <tr key={row.category}><td className="px-5 py-4 font-medium text-slate-900">{row.category}</td><td className="px-5 py-4 text-slate-600">{row.listings}</td></tr>)}
            </tbody>
          </TableFrame>
        ) : <EmptyState>No listing activity is available for this organization.</EmptyState>}
      </>
    )
  }

  function renderSystemSettings() {
    if (workspaceData?.kind !== 'settings') return null
    return (
      <>
        <SectionTitle eyebrow="Administration" title="System settings" description="Update reservation, listing, and campus email rules used by the application." />
        <div className="space-y-3">
          {workspaceData.settings.map((setting) => (
            <form key={setting.key} onSubmit={(event) => {
              event.preventDefault()
              const value = String(new FormData(event.currentTarget).get('setting_value') ?? '')
              void runFeatureAction(() => updateSystemSetting(token, setting.key, value), `${setting.key} updated.`)
            }} className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-800" htmlFor={`setting-${setting.key}`}>{setting.key.replace(/_/g, ' ')}</label>
                <input id={`setting-${setting.key}`} name="setting_value" defaultValue={setting.value} required className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
              </div>
              <span className="text-xs text-slate-400">Updated {new Date(setting.updatedAt).toLocaleString()}</span>
              <button type="submit" disabled={featureBusy} className="rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Save</button>
            </form>
          ))}
        </div>
      </>
    )
  }

  function renderOrganizationProfile() {
    if (workspaceData?.kind !== 'profile') return null
    function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const form = event.currentTarget
      const values = new FormData(form)
      const departmentProfile = role === 'Department Representative'
      void runFeatureAction(
        () => updateOrganizationProfile(token, departmentProfile, {
          location: String(values.get('location') ?? ''),
          contact_email: String(values.get('contact_email') ?? ''),
        }),
        'Organization profile saved.',
      )
    }
    const organizationProfile = workspaceData.organization
    return (
      <>
        <SectionTitle eyebrow={role === 'Department Representative' ? 'Department details' : 'Organization details'} title={organizationProfile.name} description="Keep your public pickup location and contact information current." />
        <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm text-slate-500">Profile status: <StatusBadge status={organizationProfile.status} /></p>
          <label className="block text-sm font-medium text-slate-700">Pickup location
            <input name="location" defaultValue={organizationProfile.location ?? ''} maxLength={150} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Contact email
            <input name="contact_email" type="email" defaultValue={organizationProfile.contact_email ?? ''} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3" />
          </label>
          <button type="submit" disabled={featureBusy} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Save profile</button>
        </form>
      </>
    )
  }

  function renderModerationActions() {
    if (workspaceData?.kind !== 'actions') return null
    return (
      <>
        <SectionTitle eyebrow="Community safety" title="Action history" description="Review moderation actions and their associated report cases." />
        {workspaceData.actions.length ? (
          <TableFrame>
            <TableHead labels={['Action', 'Reason', 'Case', 'Performed by', 'Date']} />
            <tbody className="divide-y divide-stone-100">
              {workspaceData.actions.map((action) => (
                <tr key={action.id}>
                  <td className="px-5 py-4 font-medium text-slate-900">{action.actionType}<span className="mt-1 block text-xs text-slate-500">Report #{action.reportId}: {action.reportReason}</span></td>
                  <td className="px-5 py-4 text-slate-600">{action.reason}</td>
                  <td className="px-5 py-4"><StatusBadge status={action.caseStatus} /></td>
                  <td className="px-5 py-4 text-slate-600">{action.performedBy}</td>
                  <td className="px-5 py-4 text-slate-600">{new Date(action.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        ) : <EmptyState>No moderation actions have been recorded.</EmptyState>}
      </>
    )
  }

  function renderReports() {
    if (workspaceData?.kind !== 'reports') return null
    return (
      <>
        <SectionTitle
          eyebrow={role === 'Administrator' ? 'Administration' : 'Community safety'}
          title={role === 'Administrator' ? 'Review reports' : activeNavigationLabel}
          description="Reports that are open or under review and still need moderator attention."
        />
        {role === 'Administrator' && (
          <section className="mb-8">
            <h3 className="mb-3 text-lg font-bold text-slate-900">Listings awaiting review</h3>
            {workspaceData.pendingListings?.length ? (
              <div className="space-y-3">
                {workspaceData.pendingListings.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-slate-900">{item.title}</h4><StatusBadge status="Pending Review" /></div>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                        <p className="mt-2 text-xs text-slate-500">{item.category} · {item.condition} · quantity {item.quantity} · {item.location} · submitted by {item.owner}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" disabled={featureBusy} onClick={() => void runFeatureAction(() => reviewPendingListing(token, item.id, 'approve'), 'Listing approved and available to campus.')} className="rounded-lg bg-emerald-900 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">Approve</button>
                        <button type="button" disabled={featureBusy} onClick={() => void runFeatureAction(() => reviewPendingListing(token, item.id, 'reject'), 'Listing rejected.')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Reject</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : <EmptyState>No listings are waiting for review.</EmptyState>}
          </section>
        )}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-slate-400 shadow-sm">
            <Search size={17} aria-hidden />
            <input aria-label="Search reports" value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} placeholder="Search report, target, or reporter" className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-slate-500 shadow-sm">
            <SlidersHorizontal size={16} aria-hidden />
            <select aria-label="Filter reports by type" value={reportType} onChange={(event) => setReportType(event.target.value)} className="bg-transparent text-slate-700 outline-none">
              <option>All reports</option>
              <option>Listing</option>
              <option>Exchange problem</option>
            </select>
          </label>
        </div>
        <p className="mb-3 text-sm text-slate-500">{displayedReports.length} reports need review</p>
        <div className="space-y-3">
          {displayedReports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Report #{report.id}</span><StatusBadge status={report.status} /><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-600">{report.type}</span></div>
                  <h3 className="mt-3 text-base font-bold text-slate-900">{report.reason}: {report.target}</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{report.details}</p>
                  {report.caseStatus && <p className="mt-2 text-xs text-slate-500">Moderation case: {report.caseStatus}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <span className="text-xs text-slate-400">{report.date}</span>
                  {report.status !== 'Resolved' && report.status !== 'Dismissed' && (
                    <button
                      type="button"
                      disabled={featureBusy}
                      onClick={() => {
                        const nextStatus = report.status === 'Open' ? 'Under Review' : 'Resolved'
                        void runFeatureAction(() => updateReportStatus(token, report.id, nextStatus), `Report #${report.id} marked ${nextStatus}.`)
                      }}
                      className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-stone-50 disabled:opacity-50"
                    >
                      {report.status === 'Open' ? 'Start review' : 'Resolve report'}
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-slate-500">Reported by <span className="font-medium text-slate-700">{report.reporter}</span></p>
            </article>
          ))}
          {!displayedReports.length && <EmptyState>No reports match your search.</EmptyState>}
        </div>
      </>
    )
  }

  function renderReportedListings() {
    if (workspaceData?.kind !== 'reports') return null
    return (
      <>
        <SectionTitle
          eyebrow="Community safety"
          title="Reported listings"
          description="Items that have been reported, including resolved reports. Owner totals count distinct listings reported across all statuses."
        />
        <label className="mb-4 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-slate-400 shadow-sm">
          <Search size={17} aria-hidden />
          <input aria-label="Search reported listings" value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} placeholder="Search item, owner, or report reason" className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
        </label>
        <p className="mb-3 text-sm text-slate-500">{displayedReports.length} reported listings</p>
        {displayedReports.length ? (
          <TableFrame>
            <TableHead labels={['Item & report', 'Item owner', 'Reported listings by owner', 'Status', 'Reported by', 'Date']} />
            <tbody className="divide-y divide-stone-100">
              {displayedReports.map((report) => (
                <tr key={report.id}>
                  <td className="px-5 py-4">
                    <span className="font-medium text-slate-900">{report.target.replace(/^Listing:\s*/, '')}</span>
                    <span className="mt-1 block text-xs text-slate-500">{report.reason}</span>
                    {report.details && <span className="mt-1 block max-w-sm text-xs text-slate-500">{report.details}</span>}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{report.itemOwner ?? 'Owner unavailable'}</td>
                  <td className="px-5 py-4 text-slate-700">
                    {report.ownerReportedListingsCount === undefined || report.ownerReportedListingsCount === null
                      ? 'Unavailable'
                      : report.ownerReportedListingsCount}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={report.status} /></td>
                  <td className="px-5 py-4 text-slate-600">{report.reporter}</td>
                  <td className="px-5 py-4 text-slate-600">{report.date}</td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        ) : <EmptyState>No reported items match your search.</EmptyState>}
      </>
    )
  }

  const pageTitle = screen === 'overview' ? 'Overview' : activeNavigationLabel

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-slate-800 md:flex">
      <aside className="flex flex-col bg-gradient-to-b from-emerald-950 to-[#063d32] p-4 text-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
        <div className="mb-7 flex items-center gap-3 px-2">
          <img src="/logo.svg" alt="" className="h-10 w-9" />
          <span className="text-sm font-bold leading-tight">Rattler Resource<br />Rescue</span>
        </div>
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/70">Workspace</p>
        <nav aria-label={`${role} navigation`} className="flex gap-1 overflow-x-auto md:flex-col">
          {navigation.map(({ label, screen: targetScreen, icon: Icon }) => (
            <button
              key={label}
              onClick={() => openScreen(targetScreen, label)}
              aria-current={activeNavigationLabel === label ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition md:w-full ${activeNavigationLabel === label ? 'bg-white/15 font-semibold text-white ring-1 ring-white/15' : 'text-emerald-50/80 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon size={17} aria-hidden /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-5 border-t border-white/10 pt-4 md:mt-auto">
          <div className="mb-3 rounded-xl bg-white/5 p-3">
            <p className="truncate text-sm font-semibold">{fullName(account)}</p>
            <p className="mt-0.5 truncate text-xs text-emerald-100/70">{role}</p>
          </div>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-emerald-50/80 hover:bg-white/10 hover:text-white"><LogOut size={17} aria-hidden />Sign out</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-stone-200 bg-white/95 px-5 py-3.5 backdrop-blur sm:px-8">
          <div>
            <p className="text-xs text-slate-400">Campus Resource Rescue <span className="px-1">/</span><span className="font-medium text-slate-600">{pageTitle}</span></p>
            <h1 className="mt-0.5 text-lg font-bold text-slate-900">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold sm:inline-flex ${dataError ? 'bg-red-50 text-red-800' : dataLoading ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dataError ? 'bg-red-600' : dataLoading ? 'bg-amber-500' : 'bg-emerald-600'}`} />
              {dataError ? 'API error' : dataLoading ? 'Loading data' : 'Database connected'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900" aria-label={`Signed in as ${fullName(account)}`}>{account.firstName[0]}{account.lastName[0]}</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] p-5 sm:p-8 lg:p-10">
          {dataLoading && <div role="status" className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Loading live data from the database…</div>}
          {featureFeedback && (
            <div role={featureFeedback.kind === 'error' ? 'alert' : 'status'} className={`mb-5 rounded-xl border px-4 py-3 text-sm ${featureFeedback.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
              {featureFeedback.message}
            </div>
          )}
          {dataError && (
            <div role="alert" className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center">
              <span>{dataError}</span>
              <button onClick={() => setRefreshVersion((value) => value + 1)} className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 font-semibold hover:bg-red-100">Retry</button>
            </div>
          )}
          {!dataLoading && !dataError && (
            <>
              {screen === 'overview' && renderOverview()}
              {screen === 'users' && role === 'Administrator' && renderUsers()}
              {screen === 'categories' && role === 'Administrator' && renderCategories()}
              {screen === 'activity' && ['Administrator', 'Department Representative'].includes(role) && renderActivityReport()}
              {screen === 'settings' && role === 'Administrator' && renderSystemSettings()}
              {screen === 'browse' && role === 'Campus User' && renderBrowse()}
              {screen === 'create-listing' && role === 'Campus User' && renderCreateListing()}
              {screen === 'my-listings' && role === 'Campus User' && renderMyListings()}
              {screen === 'reservations' && role === 'Campus User' && renderMyReservations()}
              {screen === 'messages' && role === 'Campus User' && renderMessages()}
              {screen === 'department' && role === 'Department Representative' && renderDepartmentInventory()}
              {screen === 'department-reservations' && role === 'Department Representative' && renderDepartmentReservations()}
              {screen === 'department-profile' && role === 'Department Representative' && renderOrganizationProfile()}
              {screen === 'organization-activity' && role === 'Student Organization Representative' && renderOrganizationActivity()}
              {screen === 'organization-listings-reservations' && role === 'Student Organization Representative' && renderOrganizationListingsReservations()}
              {screen === 'organization-drives' && role === 'Student Organization Representative' && renderOrganizationDrives()}
              {screen === 'organization-profile' && role === 'Student Organization Representative' && renderOrganizationProfile()}
              {screen === 'reports-queue' && ['Administrator', 'Community Moderator'].includes(role) && renderReports()}
              {screen === 'reported-listings' && role === 'Community Moderator' && renderReportedListings()}
              {screen === 'actions' && role === 'Community Moderator' && renderModerationActions()}
            </>
          )}
          <div className="mt-8 flex justify-end">
            <button onClick={() => setRefreshVersion((value) => value + 1)} disabled={dataLoading} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-stone-50 disabled:opacity-50">Refresh database data</button>
          </div>
        </main>
        <footer className="px-5 pb-6 text-center text-xs text-slate-400 sm:px-8">Campus Resource Rescue · Sprint III database-backed workflows</footer>
      </div>
    </div>
  )
}

export default App
