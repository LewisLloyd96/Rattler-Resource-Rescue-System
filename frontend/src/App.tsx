// Home screen based on the Figma wireframe. This is a technical proof that the
// React + TypeScript + Tailwind toolchain builds and runs; every link and button
// is a placeholder and nothing is wired to the backend yet.
import {
  Bell,
  Box,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Home,
  Info,
  LogIn,
  Mail,
  MessageSquare,
  Plus,
  Search,
  User,
  type LucideIcon,
} from 'lucide-react'

type NavItem = { label: string; icon: LucideIcon }

const mainNav: NavItem[] = [
  { label: 'Home', icon: Home },
  { label: 'Browse Items', icon: Search },
  { label: 'List an Item', icon: Plus },
  { label: 'My Reservations', icon: CalendarDays },
  { label: 'My Listings', icon: Box },
  { label: 'Messages', icon: Mail },
  { label: 'Profile', icon: User },
]

const supportNav: NavItem[] = [
  { label: 'About', icon: Info },
  { label: 'Help', icon: CircleHelp },
  { label: 'Contact Us', icon: MessageSquare },
]

const cards = [
  {
    title: 'Browse Items',
    text: 'Find textbooks, electronics, furniture and more.',
    icon: Search,
    style: 'from-emerald-50 to-emerald-100 text-emerald-700',
  },
  {
    title: 'List an Item',
    text: 'Give your items a second life on campus.',
    icon: Plus,
    style: 'from-amber-50 to-amber-100 text-amber-700',
  },
  {
    title: 'My Reservations',
    text: 'View and manage your reservations.',
    icon: CalendarDays,
    style: 'from-sky-50 to-sky-100 text-blue-700',
  },
  {
    title: 'My Listings',
    text: 'Track your listed items and their status.',
    icon: Box,
    style: 'from-violet-50 to-violet-100 text-violet-700',
  },
]

function NavLink({ item, active = false }: { item: NavItem; active?: boolean }) {
  const Icon = item.icon
  return (
    <a
      href="#"
      className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm transition-colors ${
        active ? 'bg-white/15 font-semibold ring-1 ring-white/20' : 'text-emerald-50/90 hover:bg-white/10'
      }`}
    >
      <Icon size={18} aria-hidden />
      {item.label}
    </a>
  )
}

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-slate-800 md:flex-row">
      <aside className="flex flex-col bg-gradient-to-b from-emerald-800 to-emerald-950 p-4 text-white md:w-64 md:shrink-0">
        <a href="#" className="mb-4 flex items-center gap-3 px-2 md:mb-6">
          <img src="/logo.svg" alt="" className="h-11 w-10" />
          <span className="text-sm font-semibold leading-tight">Rattler Resource Rescue System</span>
        </a>
        <nav aria-label="Main" className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0">
          {mainNav.map((item) => (
            <NavLink key={item.label} item={item} active={item.label === 'Home'} />
          ))}
        </nav>
        <nav aria-label="Support" className="-mx-4 mt-2 flex gap-1 overflow-x-auto px-4 md:mx-0 md:mt-auto md:flex-col md:border-t md:border-white/15 md:px-0 md:pt-4">
          {supportNav.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex items-center gap-3 border-b border-stone-200 px-4 py-4 sm:px-8">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-slate-500">
            <Search size={18} aria-hidden />
            <input
              type="search"
              placeholder="Search for items, people, or resources..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
          <button type="button" aria-label="Notifications" className="rounded-full p-2 text-slate-700 hover:bg-stone-100">
            <Bell size={20} />
          </button>
          <a
            href="#"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-900 to-emerald-700 px-4 py-2 text-sm font-semibold tracking-wide text-white hover:opacity-90"
          >
            <LogIn size={16} aria-hidden />
            Login
          </a>
        </header>

        <section className="grid bg-amber-50 md:grid-cols-[3fr_2fr]">
          <div className="px-6 py-10 sm:px-12">
            <p className="text-xs font-bold tracking-[0.2em] text-emerald-800">CAMPUS EXCHANGE</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Rattler Resource Rescue System
            </h1>
            <p className="mt-3 max-w-md text-slate-600">
              Find what you need. Share what you don&rsquo;t. Keep campus resources in use.
            </p>
          </div>
          {/* Placeholder for the hero photo in the wireframe */}
          <div
            aria-hidden
            className="hidden items-center justify-center bg-gradient-to-br from-emerald-200 via-lime-100 to-amber-100 md:flex"
          >
            <img src="/logo.svg" alt="" className="h-24 w-24 opacity-60" />
          </div>
        </section>

        <main className="grid flex-1 content-start gap-5 p-6 sm:grid-cols-2 sm:p-10">
          {cards.map(({ title, text, icon: Icon, style }) => (
            <a
              key={title}
              href="#"
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-sm ring-1 ring-black/5 transition hover:shadow-md ${style}`}
            >
              <Icon size={32} aria-hidden />
              <h2 className="mt-4 text-xl font-bold">{title}</h2>
              <p className="mt-1 max-w-xs pr-8 text-sm text-slate-700">{text}</p>
              <ChevronRight size={20} aria-hidden className="absolute right-6 bottom-6 transition group-hover:translate-x-1" />
            </a>
          ))}
        </main>
      </div>
    </div>
  )
}

export default App
