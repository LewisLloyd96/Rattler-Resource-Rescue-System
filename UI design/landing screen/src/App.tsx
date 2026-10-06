import { useState, type CSSProperties, type ReactNode } from "react";

type IconName =
  | "activity"
  | "bell"
  | "box"
  | "calendar"
  | "chart"
  | "check"
  | "chevron"
  | "grid"
  | "home"
  | "leaf"
  | "logout"
  | "mail"
  | "plus"
  | "report"
  | "search"
  | "settings"
  | "shield"
  | "store"
  | "users";

type Role = "campus" | "department" | "organization" | "moderator" | "admin";

type DashboardConfig = {
  label: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  nav: { label: string; icon: IconName }[];
  stats?: { label: string; value: string; icon: IconName; tone: string }[];
  cards: {
    title: string;
    description: string;
    icon: IconName;
    tone: string;
  }[];
};

const dashboards: Record<Role, DashboardConfig> = {
  campus: {
    label: "Campus User",
    shortLabel: "Campus",
    title: "Welcome back, Alex!",
    subtitle: "Find what you need. Share what you don’t. Keep campus resources in use.",
    accent: "#0d5138",
    accentSoft: "#def4e6",
    nav: [
      { label: "Home", icon: "home" },
      { label: "Browse Items", icon: "search" },
      { label: "List an Item", icon: "plus" },
      { label: "My Reservations", icon: "calendar" },
      { label: "My Listings", icon: "box" },
      { label: "Messages", icon: "mail" },
      { label: "Profile", icon: "users" },
    ],
    cards: [
      { title: "Browse Items", description: "Find textbooks, electronics, furniture and more.", icon: "search", tone: "mint" },
      { title: "List an Item", description: "Give your items a second life on campus.", icon: "plus", tone: "yellow" },
      { title: "My Reservations", description: "View and manage your reservations.", icon: "calendar", tone: "blue" },
      { title: "My Listings", description: "Track your listed items and their status.", icon: "box", tone: "violet" },
    ],
  },
  department: {
    label: "Department Representative",
    shortLabel: "Department",
    title: "Department Dashboard",
    subtitle: "Manage your department’s resources and support students.",
    accent: "#123c63",
    accentSoft: "#ddecfb",
    nav: [
      { label: "Home", icon: "home" },
      { label: "Manage Department Listings", icon: "store" },
      { label: "Approve Requests", icon: "check" },
      { label: "Department Analytics", icon: "chart" },
      { label: "Messages", icon: "mail" },
      { label: "Profile", icon: "users" },
    ],
    stats: [
      { label: "Department", value: "Computer Science", icon: "store", tone: "blue" },
      { label: "Active Listings", value: "12", icon: "box", tone: "blue" },
      { label: "Pending Requests", value: "3", icon: "activity", tone: "blue" },
    ],
    cards: [
      { title: "Manage Department Listings", description: "Create, edit, and monitor department items.", icon: "store", tone: "blue" },
      { title: "Approve Requests", description: "Review and approve reservation requests.", icon: "check", tone: "mint" },
      { title: "Department Analytics", description: "View usage and impact statistics.", icon: "chart", tone: "violet" },
      { title: "Messages", description: "Communicate with students and other departments.", icon: "mail", tone: "orange" },
    ],
  },
  organization: {
    label: "Student Organization",
    shortLabel: "Organization",
    title: "Student Organization Dashboard",
    subtitle: "Share, manage, and access resources for your organization.",
    accent: "#43124f",
    accentSoft: "#eedff5",
    nav: [
      { label: "Home", icon: "home" },
      { label: "Manage Org Listings", icon: "search" },
      { label: "Event & Bulk Requests", icon: "calendar" },
      { label: "My Reservations", icon: "box" },
      { label: "Messages", icon: "mail" },
      { label: "Profile", icon: "users" },
    ],
    stats: [
      { label: "Organization", value: "Environmental Club", icon: "users", tone: "violet" },
      { label: "Active Listings", value: "8", icon: "box", tone: "violet" },
      { label: "Upcoming Events", value: "2", icon: "calendar", tone: "violet" },
    ],
    cards: [
      { title: "Manage Org Listings", description: "List and manage items for your organization.", icon: "store", tone: "rose" },
      { title: "Event & Bulk Requests", description: "Request items for events or large needs.", icon: "calendar", tone: "green" },
      { title: "My Reservations", description: "View and manage your reservations.", icon: "calendar", tone: "blue" },
      { title: "Messages", description: "Connect with members, moderators, and other groups.", icon: "mail", tone: "violet" },
    ],
  },
  moderator: {
    label: "Community Moderator",
    shortLabel: "Moderator",
    title: "Community Moderator Dashboard",
    subtitle: "Keep our campus marketplace safe, fair, and active.",
    accent: "#713516",
    accentSoft: "#fae5d0",
    nav: [
      { label: "Home", icon: "home" },
      { label: "Review Listings", icon: "shield" },
      { label: "Handle Reports", icon: "report" },
      { label: "Manage Users", icon: "users" },
      { label: "Messages", icon: "mail" },
      { label: "Activity Log", icon: "activity" },
      { label: "Profile", icon: "users" },
    ],
    stats: [
      { label: "Pending Listings", value: "5", icon: "store", tone: "orange" },
      { label: "Reported Items", value: "3", icon: "report", tone: "rose" },
      { label: "Active Users", value: "150", icon: "users", tone: "orange" },
    ],
    cards: [
      { title: "Review Listings", description: "Approve or remove new listings.", icon: "store", tone: "yellow" },
      { title: "Handle Reports", description: "Review and resolve reported content.", icon: "report", tone: "rose" },
      { title: "Manage Users", description: "Monitor user activity and take action when needed.", icon: "users", tone: "blue" },
      { title: "Activity Log", description: "View recent system activity and moderation actions.", icon: "chart", tone: "violet" },
    ],
  },
  admin: {
    label: "Administrator",
    shortLabel: "Admin",
    title: "Administrator Dashboard",
    subtitle: "Oversee the Campus Resource Rescue system.",
    accent: "#20262c",
    accentSoft: "#e7eaed",
    nav: [
      { label: "Home", icon: "home" },
      { label: "Manage Users", icon: "users" },
      { label: "Manage Categories", icon: "grid" },
      { label: "System Settings", icon: "settings" },
      { label: "Review Reports", icon: "report" },
      { label: "Generate Reports", icon: "chart" },
      { label: "Activity Log", icon: "activity" },
      { label: "Profile", icon: "users" },
    ],
    stats: [
      { label: "Total Users", value: "1,245", icon: "users", tone: "blue" },
      { label: "Active Listings", value: "320", icon: "box", tone: "blue" },
      { label: "Reports", value: "7", icon: "report", tone: "rose" },
      { label: "System Status", value: "Online", icon: "activity", tone: "green" },
    ],
    cards: [
      { title: "Manage Users", description: "Add, edit, or remove users and roles.", icon: "users", tone: "mint" },
      { title: "Manage Categories", description: "Create and organize item categories.", icon: "box", tone: "blue" },
      { title: "Review Reports", description: "Handle reported items and user issues.", icon: "report", tone: "rose" },
      { title: "Generate Reports", description: "View system reports and usage data.", icon: "chart", tone: "violet" },
    ],
  },
};

const roleOrder: Role[] = ["campus", "department", "organization", "moderator", "admin"];

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    activity: <><path d="M4 12h3l2-7 4 14 2-7h5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    box: <><path d="m21 8-9 5-9-5 9-5 9 5Z" /><path d="m3 8 9 5v9l-9-5V8Zm18 0-9 5v9l9-5V8Z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></>,
    chart: <><path d="M5 20V10M12 20V4M19 20v-7" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    grid: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 9v11" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    leaf: <><path d="M20 3C11 3 5 8 5 15c0 2 1 4 3 5" /><path d="M4 21c3-6 7-10 16-18" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3M15 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    plus: <><path d="M12 4v16M4 12h16" /></>,
    report: <><path d="M5 21V4" /><path d="M5 5h13l-2 4 2 4H5" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-5" /></>,
    store: <><path d="M4 10v10h16V10M3 4h18l-2 6H5L3 4Z" /><path d="M9 20v-6h6v6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Sidebar({ config }: { config: DashboardConfig }) {
  return (
    <aside className="sidebar">
      <nav className="nav-list" aria-label="Dashboard navigation">
        {config.nav.map((item, index) => (
          <button className={`nav-item ${index === 0 ? "active" : ""}`} key={item.label}>
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <button className="logout"><Icon name="logout" size={19} /> Log out</button>
    </aside>
  );
}

function Header() {
  return (
    <header className="topbar">
      <label className="search">
        <Icon name="search" size={18} />
        <input aria-label="Search" placeholder="Search for items, people, or resources..." />
        <kbd>⌘ K</kbd>
      </label>
      <button className="icon-button" aria-label="Notifications">
        <Icon name="bell" size={21} />
        <span className="notification-dot" />
      </button>
      <button className="avatar-button" aria-label="Open profile">
        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80" alt="" />
      </button>
    </header>
  );
}

function Stats({ stats }: { stats: NonNullable<DashboardConfig["stats"]> }) {
  return (
    <section className="stats" aria-label="Dashboard summary">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <span className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} size={28} /></span>
          <span>
            <small>{stat.label}</small>
            <strong>{stat.value}</strong>
          </span>
        </div>
      ))}
    </section>
  );
}

function ActionCard({ card }: { card: DashboardConfig["cards"][number] }) {
  return (
    <button className={`action-card ${card.tone}`}>
      <span className="card-icon"><Icon name={card.icon} size={31} /></span>
      <span className="card-copy">
        <strong>{card.title}</strong>
        <small>{card.description}</small>
      </span>
      <span className="card-arrow"><Icon name="chevron" size={19} /></span>
    </button>
  );
}

function RoleSwitcher({ role, setRole }: { role: Role; setRole: (role: Role) => void }) {
  return (
    <div className="role-switcher" aria-label="Choose dashboard role">
      <span className="switch-label">View as</span>
      <div className="role-options">
        {roleOrder.map((item) => (
          <button className={item === role ? "selected" : ""} onClick={() => setRole(item)} key={item}>
            {dashboards[item].shortLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState<Role>("campus");
  const config = dashboards[role];
  const shellStyle = {
    "--accent": config.accent,
    "--accent-soft": config.accentSoft,
  } as CSSProperties;

  return (
    <main className="page" style={shellStyle}>
      <RoleSwitcher role={role} setRole={setRole} />
      <div className="app-shell">
        <Sidebar config={config} />
        <div className="workspace">
          <Header />
          <div className="content">
            {role === "campus" ? (
              <section className="campus-hero">
                <div className="hero-copy">
                  <span className="eyebrow">Campus exchange</span>
                  <h1>{config.title}</h1>
                  <p>{config.subtitle}</p>
                </div>
                <div className="hero-image" role="img" aria-label="Students walking through a leafy university campus" />
              </section>
            ) : (
              <section className="page-heading">
                <span className="eyebrow">{config.label}</span>
                <h1>{config.title}</h1>
                <p>{config.subtitle}</p>
              </section>
            )}
            {config.stats && <Stats stats={config.stats} />}
            <section className="cards-grid" aria-label="Quick actions">
              {config.cards.map((card) => <ActionCard card={card} key={card.title} />)}
            </section>
          </div>
        </div>
      </div>
      <p className="photo-credit">
        Campus photo by <a href="https://unsplash.com/@meredithspencer22" target="_blank" rel="noreferrer">Meredith Spencer</a> on Unsplash
      </p>
    </main>
  );
}
