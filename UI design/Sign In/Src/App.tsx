import { useState } from 'react'
import snakeLogo from './assets/rrrs-snake-logo.jpg'

function RattlerLogo() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-label="Rattler logo">
      {/* Shield shape */}
      <path
        d="M32 4 L56 14 L56 36 C56 50 44 60 32 62 C20 60 8 50 8 36 L8 14 Z"
        fill="#1a3a2a"
        stroke="#4a9e6b"
        strokeWidth="1.5"
      />
      {/* Stylized R */}
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fill="#4a9e6b"
        fontSize="28"
        fontWeight="700"
        fontFamily="Nunito, sans-serif"
      >
        R
      </text>
      {/* Small accent dots */}
      <circle cx="20" cy="20" r="2" fill="#4a9e6b" opacity="0.5" />
      <circle cx="44" cy="20" r="2" fill="#4a9e6b" opacity="0.5" />
    </svg>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div
      className="relative isolate min-h-dvh w-full overflow-hidden flex"
      style={{ fontFamily: 'Nunito, sans-serif', background: '#0d1f16' }}
    >
      <img
        src={snakeLogo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full select-none object-cover opacity-55 mix-blend-screen lg:block"
        style={{ clipPath: 'inset(0 50% 0 0)' }}
      />
      <img
        src={snakeLogo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full select-none object-cover opacity-15 mix-blend-multiply lg:block"
        style={{ clipPath: 'inset(0 0 0 50%)' }}
      />

      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a3a2a 0%, #0d1f16 60%, #0a1910 100%)' }}
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#4a9e6b 1px, transparent 1px), linear-gradient(90deg, #4a9e6b 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Corner accent */}
        <div className="absolute top-0 left-0 w-40 h-40 opacity-20"
          style={{ background: 'radial-gradient(circle at 0% 0%, #4a9e6b, transparent 70%)' }} />

        <div className="relative z-30">
          <div className="flex items-center gap-3 mb-2">
            <RattlerLogo />
          </div>
          <div className="mt-4">
            <p className="text-xs tracking-[0.3em] uppercase mb-1" style={{ color: '#4a9e6b', fontFamily: 'DM Mono, monospace' }}>
              Est. 2026
            </p>
            <h1 className="text-3xl font-700 text-white leading-snug">
              Rattler Resource<br />
              <span style={{ color: '#4a9e6b' }}>Rescue System</span>
            </h1>
          </div>
        </div>

        <div className="relative z-30">
          <blockquote className="border-l-2 pl-4" style={{ borderColor: '#4a9e6b' }}>
            <p className="text-white/50 text-sm leading-relaxed font-300">
              Connecting communities with the resources they need — efficiently, securely, and with care.
            </p>
          </blockquote>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: 'Resources', value: '1,240' },
              { label: 'Families', value: '384' },
              { label: 'Partners', value: '52' },
            ].map(({ label, value }) => (
              <div key={label} className="border rounded px-3 py-3" style={{ borderColor: '#4a9e6b20', background: '#4a9e6b08' }}>
                <p className="text-lg font-700 text-white">{value}</p>
                <p className="text-[10px] tracking-widest uppercase" style={{ color: '#4a9e6b80', fontFamily: 'DM Mono, monospace' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12" style={{ background: '#f5f2ec' }}>

        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <RattlerLogo />
          <p className="mt-2 text-sm font-700 text-center" style={{ color: '#1a3a2a' }}>
            Rattler Resource Rescue System
          </p>
        </div>

        <div className="relative z-30 w-full max-w-[380px]">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-700 mb-1" style={{ color: '#0d1f16' }}>Welcome Back!</h2>
            <p className="text-sm" style={{ color: '#0d1f1670', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] tracking-[0.2em] uppercase font-600" style={{ color: '#1a3a2a', fontFamily: 'DM Mono, monospace' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 text-sm rounded border outline-none transition-all duration-150"
                style={{
                  background: '#fff',
                  border: '1.5px solid #1a3a2a20',
                  color: '#0d1f16',
                  fontFamily: 'Nunito, sans-serif',
                }}
                onFocus={e => (e.target.style.borderColor = '#4a9e6b')}
                onBlur={e => (e.target.style.borderColor = '#1a3a2a20')}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] tracking-[0.2em] uppercase font-600" style={{ color: '#1a3a2a', fontFamily: 'DM Mono, monospace' }}>
                  Password
                </label>
                <button
                  type="button"
                  className="shrink-0 cursor-pointer select-none whitespace-nowrap text-[11px] transition-colors duration-150 hover:underline"
                  style={{ color: '#4a9e6b', fontFamily: 'DM Mono, monospace' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 text-sm rounded border outline-none transition-all duration-150 pr-12"
                  style={{
                    background: '#fff',
                    border: '1.5px solid #1a3a2a20',
                    color: '#0d1f16',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#4a9e6b')}
                  onBlur={e => (e.target.style.borderColor = '#1a3a2a20')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tracking-wide"
                  style={{ color: '#1a3a2a50', fontFamily: 'DM Mono, monospace' }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              className="w-full py-3.5 mt-2 rounded text-sm font-700 tracking-widest uppercase transition-all duration-150 hover:opacity-90 active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, #1a3a2a 0%, #2d6a45 100%)',
                color: '#fff',
                letterSpacing: '0.15em',
              }}
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#1a3a2a15' }} />
            <span className="text-[10px] tracking-widest" style={{ color: '#1a3a2a40', fontFamily: 'DM Mono, monospace' }}>OR</span>
            <div className="flex-1 h-px" style={{ background: '#1a3a2a15' }} />
          </div>

          {/* Create account */}
          <p className="text-center text-sm" style={{ color: '#0d1f1660' }}>
            Don't have an account?{' '}
            <button
              type="button"
              className="font-700 transition-colors duration-150 hover:underline"
              style={{ color: '#4a9e6b' }}
            >
              Create Account
            </button>
          </p>

          {/* Footer */}
          <p className="text-center text-[10px] mt-10 tracking-wide" style={{ color: '#0d1f1630', fontFamily: 'DM Mono, monospace' }}>
            © 2026 Rattler Resource Rescue System
          </p>
        </div>
      </div>
    </div>
  )
}
