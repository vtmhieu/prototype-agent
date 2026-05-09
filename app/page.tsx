import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginButton from '@/components/LoginButton'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">

      {/* Radial glow backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-violet-500 flex items-center justify-center text-xs font-bold">P</span>
          <span className="text-sm font-semibold text-white/90">Prototype Agent</span>
        </div>
        <LoginButton compact />
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-28 flex-1">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/60 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Free · Powered by Gemini
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] max-w-3xl mb-6">
          From idea to{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            live prototype
          </span>
          <br />in 30 seconds
        </h1>

        {/* Sub */}
        <p className="text-lg text-white/50 max-w-xl leading-relaxed mb-10">
          Describe any UI in plain English. Get a fully interactive, self-contained
          HTML prototype — no code, no setup, no waiting.
        </p>

        {/* CTA */}
        <LoginButton />

        <p className="mt-4 text-xs text-white/30">No credit card · Sign in with GitHub</p>

        {/* Demo window */}
        <div className="mt-20 w-full max-w-3xl mx-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/60">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="flex-1 mx-4 rounded-md bg-white/5 h-5 text-center text-[10px] text-white/30 flex items-center justify-center">
              prototype-agent.vercel.app/dashboard
            </span>
          </div>
          {/* Fake UI */}
          <div className="p-6 space-y-4 text-left">
            <div className="text-xs text-white/30 font-medium uppercase tracking-widest mb-2">New prototype</div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white/60">
              CRM dashboard for a B2B SaaS — pipeline, deal stages, revenue chart
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white/30 h-12" />
            <div className="rounded-lg bg-violet-600 text-white text-sm font-medium text-center py-2.5">
              Generate Prototype
            </div>
            {/* Status bar */}
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
              <span className="text-green-400 text-sm">✅ Ready</span>
              <span className="ml-auto text-xs text-green-400/60">27s</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 border-t border-white/10 bg-white/[0.02] px-6 py-20">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: '⚡',
              title: 'Instant generation',
              body: 'Full interactive HTML — filters, charts, modals, tabs — all wired up and working in under 30 seconds.',
            },
            {
              icon: '🤖',
              title: 'AI chat editor',
              body: 'Describe any change in plain English. The prototype updates live in a split-pane view — no code required.',
            },
            {
              icon: '🔒',
              title: 'Completely private',
              body: 'Row-level security on every row. Your prototypes are yours alone — no shared URLs, no leaking.',
            },
          ].map(f => (
            <div key={f.title} className="space-y-3">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="text-sm font-semibold text-white/90">{f.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-white/20">
          <span>Prototype Agent</span>
          <span>Built with Next.js · Supabase · Gemini · Vercel</span>
        </div>
      </footer>
    </main>
  )
}
