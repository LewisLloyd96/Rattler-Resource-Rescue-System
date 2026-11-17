
import {
  Users,
  Package,
  Building2,
  CalendarDays,
  Gift,
  Flag,
  ClipboardList,
  Search,
  Settings,
  BarChart3,
  LogOut,
  ShieldCheck,
} from 'lucide-react'

export type UserRole =
  | 'Administrator'
  | 'Campus User'
  | 'Department Representative'
  | 'Student Organization Representative'
  | 'Community Moderator'

type DashboardProps = {
  role: UserRole
  onLogout: () => void
}

type DashboardOption = {
  title: string
  description: string
  icon: typeof Users
  active: boolean
}

const roleOptions: Record<UserRole, DashboardOption[]> = {
  Administrator: [
    {
      title: 'Manage Users',
      description: 'Search, browse, and view registered users.',
      icon: Users,
      active: true,
    },
    {
      title: 'Manage Categories',
      description: 'Manage item categories.',
      icon: Package,
      active: false,
    },
    {
      title: 'Review Reports',
      description: 'Review submitted reports.',
      icon: Flag,
      active: false,
    },
    {
      title: 'Generate Reports',
      description: 'View system activity and reports.',
      icon: BarChart3,
      active: false,
    },
    {
      title: 'System Settings',
      description: 'Manage system configuration.',
      icon: Settings,
      active: false,
    },
  ],

  'Campus User': [
    {
      title: 'Browse Available Items',
      description: 'Search and browse items available on campus.',
      icon: Search,
      active: true,
    },
    {
      title: 'My Reservations',
      description: 'View your item reservations.',
      icon: ClipboardList,
      active: false,
    },
    {
      title: 'My Listings',
      description: 'View items you have listed.',
      icon: Package,
      active: false,
    },
    {
      title: 'Collection Drives',
      description: 'Explore campus collection drives.',
      icon: CalendarDays,
      active: false,
    },
  ],

  'Department Representative': [
    {
      title: 'Department Items',
      description: 'View items associated with your department.',
      icon: Package,
      active: true,
    },
    {
      title: 'Department Reservations',
      description: 'View reservations associated with your department.',
      icon: ClipboardList,
      active: true,
    },
    {
      title: 'Department Profile',
      description: 'Manage department information.',
      icon: Building2,
      active: false,
    },
  ],

  'Student Organization Representative': [
    {
      title: 'Organization Listings',
      description: 'View your organization’s current listings.',
      icon: Package,
      active: true,
    },
    {
      title: 'Organization Reservations',
      description: 'View reservations associated with your organization.',
      icon: ClipboardList,
      active: true,
    },
    {
      title: 'Giveaways',
      description: 'View organization giveaways.',
      icon: Gift,
      active: true,
    },
    {
      title: 'Collection Drives',
      description: 'View organization collection drives.',
      icon: CalendarDays,
      active: true,
    },
  ],

  'Community Moderator': [
    {
      title: 'Reported Listings',
      description: 'View listings reported by community members.',
      icon: Flag,
      active: true,
    },
    {
      title: 'Reported Exchange Problems',
      description: 'Review reported exchange issues.',
      icon: ClipboardList,
      active: true,
    },
  ],
}

function Dashboard({ role, onLogout }: DashboardProps) {
  const options = roleOptions[role]

  return (
    <div className="flex min-h-screen bg-stone-100">
      <aside className="hidden w-64 flex-col bg-emerald-950 p-6 text-white md:flex">
        <div className="mb-10">
          <h1 className="text-xl font-bold">Rattler Resource</h1>
          <p className="text-sm text-emerald-200">Rescue System</p>
        </div>

        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-emerald-300">
            Signed in as
          </p>
          <p className="mt-2 font-semibold">{role}</p>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="rounded-lg bg-emerald-800 px-4 py-3 font-medium">
            Dashboard
          </div>
        </nav>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-emerald-100 hover:bg-emerald-800"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Rattler Resource Rescue System
            </p>
            <h2 className="mt-1 text-3xl font-bold text-emerald-950">
              Welcome, {role}
            </h2>
            <p className="mt-2 text-slate-600">
              Access the resources and functions available to your role.
            </p>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50 md:hidden"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </header>

        <section>
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="text-emerald-800" size={22} />
            <h3 className="text-lg font-semibold text-emerald-950">
              Your Dashboard
            </h3>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {options.map((option) => {
              const Icon = option.icon

              return (
                <article
                  key={option.title}
                  className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900">
                    <Icon size={24} />
                  </div>

                  <h4 className="font-semibold text-emerald-950">
                    {option.title}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {option.description}
                  </p>

                  <div className="mt-5">
                    {option.active ? (
                      <span className="text-xs font-medium text-emerald-800">
                        Sprint IV retrieval requirement
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Future functionality
                      </span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
