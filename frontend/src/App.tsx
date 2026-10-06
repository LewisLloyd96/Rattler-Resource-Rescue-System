// Splash/home screen: a technical proof that the React + TypeScript + Tailwind
// toolchain builds and runs. Navigation links are placeholders only.
const navItems = ['Browse Items', 'About', 'Help', 'Contact Us']

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-emerald-50 text-slate-800">
      <header className="bg-emerald-800 text-white shadow">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <a href="#" className="flex items-center gap-2 font-semibold">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
            Campus Resource Rescue
          </a>
          <ul className="flex flex-wrap items-center gap-4 text-sm">
            {navItems.map((item) => (
              <li key={item}>
                <a href="#" className="hover:underline">
                  {item}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#"
                className="rounded bg-amber-400 px-3 py-1.5 font-semibold text-emerald-950 hover:bg-amber-300"
              >
                Login
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <img src="/logo.svg" alt="Campus Resource Rescue System logo" className="mb-6 h-28 w-28" />
        <h1 className="text-4xl font-bold text-emerald-900 sm:text-5xl">
          Campus Resource Rescue System
        </h1>
        <p className="mt-4 text-lg font-medium text-emerald-700">
          Share it. Reuse it. Rescue it.
        </p>
        <p className="mt-4 text-slate-600">
          A campus marketplace where students, employees, and departments share unused
          textbooks, electronics, furniture, and school supplies to reduce waste and save
          money.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#" className="rounded bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-600">
            Get Started
          </a>
          <a href="#" className="rounded border border-emerald-700 px-5 py-2.5 font-semibold text-emerald-800 hover:bg-emerald-100">
            Learn More
          </a>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Campus Resource Rescue System Team
      </footer>
    </div>
  )
}

export default App
