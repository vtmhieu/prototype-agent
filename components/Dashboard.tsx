'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Prototype } from '@/lib/types'

type Status = 'idle' | 'generating' | 'updating' | 'deleting' | 'done' | 'error'

export default function Dashboard({ userEmail }: { userEmail: string }) {
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateRequest, setUpdateRequest] = useState('')

  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [lastPlan, setLastPlan] = useState('')
  const [lastId, setLastId] = useState('')

  const [prototypes, setPrototypes] = useState<Prototype[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadPrototypes = useCallback(async () => {
    const { data } = await supabase
      .from('prototypes')
      .select('*')
      .order('created_at', { ascending: false })
    setPrototypes(data ?? [])
    setLoadingList(false)
  }, [supabase])

  useEffect(() => { loadPrototypes() }, [loadPrototypes])

  useEffect(() => {
    if (status !== 'generating' && status !== 'updating') return
    setElapsed(0)
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [status])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function handleGenerate() {
    if (!title.trim() || status !== 'idle') return
    setStatus('generating')
    setErrorMsg('')
    setLastPlan('')
    setLastId('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      setLastId(data.id)
      setLastPlan(data.plan)
      setTitle('')
      setDescription('')
      setShowDetails(false)
      setStatus('done')
      loadPrototypes()
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error')
      setStatus('error')
    }
  }

  async function handleUpdate(id: string) {
    if (!updateRequest.trim() || status !== 'idle') return
    setStatus('updating')
    setErrorMsg('')
    setLastPlan('')
    setLastId(id)

    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updateRequest: updateRequest.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')

      setLastPlan(data.plan)
      setUpdateRequest('')
      setUpdatingId(null)
      setStatus('done')
      loadPrototypes()
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error')
      setStatus('error')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this prototype?')) return
    setStatus('deleting')
    try {
      await fetch(`/api/delete/${id}`, { method: 'DELETE' })
      loadPrototypes()
    } finally {
      setStatus('idle')
    }
  }

  async function copyLink(id: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/prototype/${id}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function reset() {
    setStatus('idle')
    setErrorMsg('')
    setLastPlan('')
    setLastId('')
  }

  const busy = status !== 'idle'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-violet-700/15 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/8 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-violet-900/50">P</div>
            <span className="font-semibold text-white/90 text-sm">Prototype Agent</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-xs text-white/30 hidden sm:block">{userEmail}</span>
            <button
              onClick={signOut}
              className="text-xs text-white/40 hover:text-white/80 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Hero prompt area */}
      <section className="relative z-10 pt-14 pb-12 px-5">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            What do you want to{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              build?
            </span>
          </h1>
          <p className="text-white/40 text-sm">
            Describe any UI — get a live, interactive prototype in ~30 seconds.
          </p>
        </div>

        {/* Prompt box */}
        <div className="max-w-2xl mx-auto">
          <div className={`relative rounded-2xl border transition-all duration-200 ${
            busy ? 'border-white/10 bg-white/3' : 'border-white/12 bg-white/5 hover:border-white/20 focus-within:border-violet-500/60 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]'
          }`}>
            {/* Main input */}
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !showDetails && handleGenerate()}
              disabled={busy}
              placeholder="e.g. Analytics dashboard for a SaaS product"
              className="w-full bg-transparent px-5 pt-4 pb-3 text-sm text-white placeholder-white/30 focus:outline-none disabled:opacity-50"
            />

            {/* Collapsible details */}
            {showDetails && (
              <div className="px-5 pb-3">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={busy}
                  rows={3}
                  placeholder="Details — features, layout, data, interactions, colour scheme..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-violet-500/50 resize-none transition"
                />
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 pb-3.5 gap-3">
              <button
                type="button"
                onClick={() => setShowDetails(v => !v)}
                disabled={busy}
                className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors disabled:opacity-40"
              >
                <svg className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {showDetails ? 'Hide details' : 'Add details'}
              </button>

              <button
                onClick={handleGenerate}
                disabled={!title.trim() || busy}
                className="inline-flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/40"
              >
                {status === 'generating' ? (
                  <>
                    <Spinner className="text-white/70" />
                    Generating… {elapsed > 0 && <span className="text-white/50">{elapsed}s</span>}
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Example prompts */}
          {!title && !busy && (
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {EXAMPLE_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => setTitle(p)}
                  className="px-3 py-1.5 rounded-full border border-white/10 bg-white/4 hover:bg-white/8 text-xs text-white/40 hover:text-white/70 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Status banners */}
      {status !== 'idle' && status !== 'generating' && (
        <div className="relative z-10 max-w-2xl mx-auto px-5 pb-8">
          {status === 'updating' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/60">
              <Spinner /> Regenerating… <span className="text-white/30">{elapsed}s</span>
            </div>
          )}
          {status === 'deleting' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/60">
              <Spinner /> Deleting…
            </div>
          )}
          {status === 'done' && (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/8 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-green-400 font-semibold text-sm mb-1">
                    ✓ Prototype ready
                    {elapsed > 0 && <span className="font-normal text-green-500/60 ml-2 text-xs">in {elapsed}s</span>}
                  </p>
                  {lastPlan && (
                    <pre className="text-xs text-green-500/70 whitespace-pre-wrap font-sans leading-relaxed mt-2 mb-3">{lastPlan}</pre>
                  )}
                  {lastId && (
                    <a
                      href={`/prototype/${lastId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Open prototype →
                    </a>
                  )}
                </div>
                <button onClick={reset} className="text-green-600 hover:text-green-400 transition-colors shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-red-400 font-semibold text-sm mb-1">Generation failed</p>
                  <p className="text-red-500/70 text-xs font-mono">{errorMsg}</p>
                </div>
                <button onClick={reset} className="text-red-600 hover:text-red-400 transition-colors shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider + list */}
      <section className="relative z-10 border-t border-white/8 bg-white/[0.02] min-h-[40vh] px-5 py-10">
        <div className="max-w-5xl mx-auto">

          {loadingList ? (
            <div className="flex items-center justify-center py-20 gap-2 text-sm text-white/30">
              <Spinner /> Loading…
            </div>
          ) : prototypes.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Stats row */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">
                  Your prototypes
                </h2>
                <span className="text-xs text-white/20">
                  {prototypes.length} {prototypes.length === 1 ? 'prototype' : 'prototypes'}
                </span>
              </div>

              {/* Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {prototypes.map(p => (
                  <PrototypeCard
                    key={p.id}
                    prototype={p}
                    busy={busy}
                    copiedId={copiedId}
                    updatingId={updatingId}
                    updateRequest={updateRequest}
                    onOpen={() => window.open(`/prototype/${p.id}`, '_blank')}
                    onEdit={() => window.location.href = `/prototype/${p.id}/edit`}
                    onCopy={() => copyLink(p.id)}
                    onToggleRegenerate={() => {
                      setUpdatingId(updatingId === p.id ? null : p.id)
                      setUpdateRequest('')
                    }}
                    onDelete={() => handleDelete(p.id)}
                    onUpdateRequest={setUpdateRequest}
                    onSubmitUpdate={() => handleUpdate(p.id)}
                    onCancelUpdate={() => { setUpdatingId(null); setUpdateRequest('') }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

// ── Prototype Card ────────────────────────────────────────────────────────────

function PrototypeCard({
  prototype: p,
  busy,
  copiedId,
  updatingId,
  updateRequest,
  onOpen,
  onEdit,
  onCopy,
  onToggleRegenerate,
  onDelete,
  onUpdateRequest,
  onSubmitUpdate,
  onCancelUpdate,
}: {
  prototype: Prototype
  busy: boolean
  copiedId: string | null
  updatingId: string | null
  updateRequest: string
  onOpen: () => void
  onEdit: () => void
  onCopy: () => void
  onToggleRegenerate: () => void
  onDelete: () => void
  onUpdateRequest: (v: string) => void
  onSubmitUpdate: () => void
  onCancelUpdate: () => void
}) {
  const isUpdating = updatingId === p.id

  return (
    <div className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 ${
      isUpdating
        ? 'border-violet-500/40 bg-violet-900/10'
        : 'border-white/8 bg-white/4 hover:bg-white/7 hover:border-white/15'
    }`}>
      {/* Gradient top bar */}
      <div className="h-1 w-full" style={{ background: idToGradient(p.id) }} />

      <div className="p-5">
        {/* Avatar + title */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-lg"
            style={{ background: idToGradient(p.id) }}
          >
            {p.title.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-white/90 leading-snug line-clamp-2">{p.title}</p>
            <p className="text-xs text-white/30 mt-1">
              {timeAgo(p.updated_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {!isUpdating ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={onOpen}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/80 hover:bg-violet-600 text-white transition-colors text-center"
            >
              Open
            </button>
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/8 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/8 transition-colors"
            >
              {copiedId === p.id ? '✓ Copied' : 'Copy link'}
            </button>
            <button
              onClick={onToggleRegenerate}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/8 transition-colors disabled:opacity-30"
            >
              Regenerate
            </button>
            <button
              onClick={onDelete}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
            >
              Delete
            </button>
          </div>
        ) : (
          <div>
            <textarea
              value={updateRequest}
              onChange={e => onUpdateRequest(e.target.value)}
              rows={2}
              autoFocus
              placeholder="What to change? e.g. add dark mode, change colours..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 placeholder-white/25 focus:outline-none focus:border-violet-500/50 resize-none mb-2 transition"
            />
            <div className="flex gap-2">
              <button
                onClick={onSubmitUpdate}
                disabled={!updateRequest.trim()}
                className="flex-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={onCancelUpdate}
                className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="relative inline-block mb-6">
        <div className="w-20 h-20 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mx-auto">
          <svg className="w-9 h-9 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="absolute -inset-3 rounded-3xl bg-violet-600/10 blur-xl -z-10" />
      </div>
      <p className="text-white/70 font-semibold text-base mb-2">No prototypes yet</p>
      <p className="text-sm text-white/30">Type a requirement above and hit Generate.</p>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Spinner({ className = 'text-white/40' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function idToGradient(id: string) {
  const palettes = [
    'linear-gradient(135deg,#7c3aed,#a855f7)',
    'linear-gradient(135deg,#2563eb,#60a5fa)',
    'linear-gradient(135deg,#059669,#34d399)',
    'linear-gradient(135deg,#d97706,#fbbf24)',
    'linear-gradient(135deg,#db2777,#f472b6)',
    'linear-gradient(135deg,#0891b2,#22d3ee)',
    'linear-gradient(135deg,#7c3aed,#2563eb)',
    'linear-gradient(135deg,#dc2626,#f97316)',
  ]
  return palettes[parseInt(id[0], 16) % palettes.length]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const EXAMPLE_PROMPTS = [
  'CRM dashboard for sales leads',
  'Expense tracker with charts',
  'Kanban board for a dev team',
  'Landing page for a SaaS product',
  'Admin panel with user table',
]
