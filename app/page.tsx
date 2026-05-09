import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginButton from '@/components/LoginButton'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-violet-700/18 blur-[130px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[400px] rounded-full bg-fuchsia-700/10 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-violet-900/50">P</span>
          <span className="text-sm font-semibold text-white/90">Prototype Agent</span>
        </div>
        <LoginButton compact />
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 flex-1">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Free · Powered by Gemini · No credit card
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] max-w-4xl mb-6">
          From idea to{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            live prototype
          </span>
          <br className="hidden sm:block" /> in 30 seconds
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-white/45 max-w-lg leading-relaxed mb-10">
          Describe any UI in plain English. Get a fully interactive,
          self-contained HTML prototype — no code, no setup, no waiting.
        </p>

        {/* CTA */}
        <LoginButton />
        <p className="mt-4 text-xs text-white/25">Sign in with Google or GitHub · Free forever</p>

        {/* Demo window */}
        <div className="mt-20 w-full max-w-3xl mx-auto rounded-2xl border border-white/10 bg-[#111111] overflow-hidden shadow-2xl shadow-black/70">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/[0.02]">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="flex-1 mx-3 rounded-md bg-white/5 h-5 text-[10px] text-white/25 flex items-center justify-center">
              prototype-agent.vercel.app/dashboard
            </span>
          </div>

          {/* Fake dashboard UI */}
          <div className="p-6">
            {/* Prompt box */}
            <div className="rounded-xl border border-violet-500/30 bg-white/4 p-4 mb-5 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]">
              <p className="text-sm text-white/70 mb-3">
                CRM dashboard — pipeline view, deal stages, revenue chart
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-full border border-white/10 bg-white/4 text-[10px] text-white/35">Add details ↓</span>
                </div>
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 rounded-lg text-xs font-semibold text-white">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate
                </div>
              </div>
            </div>

            {/* Success banner */}
            <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/8 px-4 py-3 mb-5 text-xs">
              <span className="text-green-400 font-semibold">✓ Prototype ready</span>
              <span className="text-green-500/50 ml-auto">in 24s</span>
              <a className="px-3 py-1 bg-green-600 text-white rounded-md font-semibold">Open →</a>
            </div>

            {/* Card grid */}
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Your prototypes · 3</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'CRM Dashboard', g: 'from-violet-500 to-fuchsia-500', t: '2m ago' },
                { label: 'Expense Tracker', g: 'from-blue-500 to-cyan-400', t: '3h ago' },
                { label: 'Kanban Board', g: 'from-emerald-500 to-teal-400', t: '2d ago' },
              ].map(c => (
                <div key={c.label} className="rounded-xl border border-white/8 bg-white/4 overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${c.g}`} />
                  <div className="p-3">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${c.g} flex items-center justify-center text-white text-[10px] font-bold mb-2`}>
                      {c.label[0]}
                    </div>
                    <p className="text-[11px] font-medium text-white/80 leading-tight mb-1">{c.label}</p>
                    <p className="text-[9px] text-white/30">{c.t}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 border-t border-white/8 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest text-center mb-10">How it works</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Describe your UI', body: 'Type what you want to build — a dashboard, a landing page, a form. Add optional details.' },
              { step: '02', title: 'AI generates it', body: 'Gemini writes a complete, self-contained HTML file with real interactivity and dummy data.' },
              { step: '03', title: 'Edit with chat', body: 'Open the split-pane editor. Describe any change — the prototype updates live, no reload.' },
            ].map(s => (
              <div key={s.step} className="relative pl-10">
                <span className="absolute left-0 top-0 text-xs font-bold text-violet-500/60 font-mono">{s.step}</span>
                <h3 className="text-sm font-semibold text-white/85 mb-2">{s.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 border-t border-white/8 bg-white/[0.015] px-6 py-16">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-5">
          {[
            {
              icon: (
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: 'Instant generation',
              body: 'Full interactive HTML — filters, charts, modals, tabs — all wired up and working in under 30 seconds.',
            },
            {
              icon: (
                <svg className="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ),
              title: 'AI chat editor',
              body: 'Describe any change in plain English. Live split-pane preview updates instantly. Auto-saves every 3 seconds.',
            },
            {
              icon: (
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
              title: 'Completely private',
              body: 'Row-level security on every query. Your prototypes are yours alone — URLs only work when you\'re logged in.',
            },
            {
              icon: (
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              ),
              title: 'Download anytime',
              body: 'Export your prototype as a single HTML file. Take it anywhere — no lock-in, no dependencies.',
            },
            {
              icon: (
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Free forever',
              body: 'Built on Gemini free tier, Supabase free tier, and Vercel free tier. No credit card, no billing surprises.',
            },
            {
              icon: (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ),
              title: 'Mobile friendly',
              body: 'The editor sidebar collapses on small screens. Generated prototypes are responsive by default.',
            },
          ].map(f => (
            <div key={f.title} className="rounded-2xl border border-white/8 bg-white/3 p-5 hover:bg-white/6 hover:border-white/14 transition-all">
              <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-white/85 mb-2">{f.title}</h3>
              <p className="text-xs text-white/38 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 border-t border-white/8 px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Ready to build something?
        </h2>
        <p className="text-white/40 text-sm mb-8 max-w-sm mx-auto">
          Sign in and generate your first prototype in under a minute.
        </p>
        <div className="flex justify-center">
          <LoginButton />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/8 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-white/20">
          <span>Prototype Agent</span>
          <span>Next.js · Supabase · Gemini · Vercel</span>
        </div>
      </footer>
    </main>
  )
}
