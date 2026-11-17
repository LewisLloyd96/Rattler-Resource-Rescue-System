
import { useState, type FormEvent } from 'react'
import { ArrowLeft, LockKeyhole, Mail } from 'lucide-react'

type SignInProps = {
  onBack: () => void
  onSubmit: (email: string, password: string) => void
}

function SignIn({ onBack, onSubmit }: SignInProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(email, password)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm text-emerald-800 hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>

        <div className="mb-6 text-center">
          <img
            src="/brand/rrr-mark.jpg"
            alt="Rattler Resource Rescue logo"
            className="mx-auto mb-4 h-16 w-16"
          />

          <h1 className="text-2xl font-bold text-emerald-950">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to Rattler Resource Rescue System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              FAMU Email
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-stone-300 px-3">
              <Mail size={18} className="text-slate-400" />

              <input
                id="email"
                type="email"
                required
                placeholder="you@famu.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-stone-300 px-3">
              <LockKeyhole size={18} className="text-slate-400" />

              <input
                id="password"
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full py-3 text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-900 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Rattler Resource Rescue System
        </p>
      </section>
    </main>
  )
}

export default SignIn
