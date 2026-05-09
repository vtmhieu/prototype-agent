'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Prototype } from '@/lib/types'

type Status = 'idle' | 'generating' | 'updating' | 'deleting' | 'done' | 'error'

export default function Dashboard({ userEmail }: { userEmail: string }) {
  const supabase = createClient()

  // form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // update
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateRequest, setUpdateRequest] = useState('')

  // state
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [lastPlan, setLastPlan] = useState('')
  const [lastId, setLastId] = useState('')

  // list
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

  // elapsed timer
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

  // ── Generate ────────────────────────────────────────────────────────────

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
      setStatus('done')
      loadPrototypes()
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error')
      setStatus('error')
    }
  }

  // ── Update ──────────────────────────────────────────────────────────────

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

  // ── Delete ──────────────────────────────────────────────────────────────

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
    const url = `${window.location.origin}/prototype/${id}`
    await navigator.clipboard.writeText(url)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center text-xs font-bold text-white">P</span>
            <span className="font-semibold text-gray-900 text-sm">Prototype Agent</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:block">{userEmail}</span>
            <button onClick={signOut} className="text-xs text-gray-500 hover:text-gray-800 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Hero text */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">What do you want to build?</h1>
          <p className="text-sm text-gray-500">Describe a UI — get a live, interactive prototype in ~30 seconds.</p>
        </div>

        {/* Generate form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="mb-3">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !description && handleGenerate()}
              disabled={busy}
              placeholder="e.g. CRM dashboard for sales leads"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition"
            />
          </div>
          <div className="mb-4">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={busy}
              rows={3}
              placeholder="Details (optional) — features, layout, data to show, interactions..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-400 transition"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!title.trim() || busy}
            className="w-full py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-violet-200"
          >
            {busy && status === 'generating' ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Generating…
              </span>
            ) : 'Generate Prototype'}
          </button>
        </div>

        {/* Status */}
        {status !== 'idle' && (
          <div className="mb-6">
            {status === 'updating' && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-600 shadow-sm">
                <Spinner />
                <span>Regenerating prototype <span className="text-gray-400 ml-1">{elapsed}s</span></span>
              </div>
            )}

            {status === 'deleting' && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-600 shadow-sm">
                <Spinner /> Deleting…
              </div>
            )}

            {status === 'done' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm">
                <p className="text-green-800 font-semibold mb-1 text-sm">
                  {lastId ? '✅ Ready' : '✅ Done'}
                  {elapsed > 0 && <span className="font-normal text-green-600 ml-2 text-xs">in {elapsed}s</span>}
                </p>
                {lastPlan && (
                  <pre className="text-xs text-green-700 whitespace-pre-wrap mb-3 font-sans leading-relaxed">{lastPlan}</pre>
                )}
                <div className="flex items-center gap-3">
                  {lastId && (
                    <a
                      href={`/prototype/${lastId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors"
                    >
                      Open prototype →
                    </a>
                  )}
                  <button onClick={reset} className="text-sm text-green-700 hover:underline">
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm">
                <p className="text-red-800 font-semibold mb-1 text-sm">Generation failed</p>
                <p className="text-red-600 text-xs mb-3 font-mono">{errorMsg}</p>
                <button onClick={reset} className="text-sm text-red-700 hover:underline">
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Prototype list */}
        {loadingList ? (
          <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-400">
            <Spinner /> Loading…
          </div>
        ) : prototypes.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Your prototypes ({prototypes.length})
            </h2>
            <div className="space-y-2">
              {prototypes.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Row */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Colour swatch derived from id */}
                    <div
                      className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: idToGradient(p.id) }}
                    >
                      {p.title.slice(0, 1).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Updated {new Date(p.updated_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`/prototype/${p.id}`}
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                      >
                        Open
                      </a>
                      <a
                        href={`/prototype/${p.id}/edit`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Edit
                      </a>
                      <button
                        onClick={() => copyLink(p.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {copiedId === p.id ? '✓ Copied' : 'Copy link'}
                      </button>
                      <button
                        onClick={() => { setUpdatingId(updatingId === p.id ? null : p.id); setUpdateRequest('') }}
                        disabled={busy}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={busy}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Inline regenerate form */}
                  {updatingId === p.id && status === 'idle' && (
                    <div className="px-5 pb-4 pt-3 border-t border-gray-100 bg-gray-50">
                      <textarea
                        value={updateRequest}
                        onChange={e => setUpdateRequest(e.target.value)}
                        rows={2}
                        placeholder="What do you want to change? e.g. Add dark mode, change colours to blue, add an export button..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none bg-white mb-2 transition"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(p.id)}
                          disabled={!updateRequest.trim()}
                          className="px-4 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Regenerate
                        </button>
                        <button
                          onClick={() => { setUpdatingId(null); setUpdateRequest('') }}
                          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-gray-800 font-semibold mb-1">No prototypes yet</p>
      <p className="text-sm text-gray-400">Type a requirement above and hit Generate.</p>
    </div>
  )
}

// Deterministic gradient from a UUID — picks from a palette based on first char
function idToGradient(id: string) {
  const palettes = [
    'linear-gradient(135deg, #7c3aed, #a855f7)',
    'linear-gradient(135deg, #2563eb, #60a5fa)',
    'linear-gradient(135deg, #059669, #34d399)',
    'linear-gradient(135deg, #d97706, #fbbf24)',
    'linear-gradient(135deg, #db2777, #f472b6)',
    'linear-gradient(135deg, #0891b2, #22d3ee)',
    'linear-gradient(135deg, #7c3aed, #2563eb)',
    'linear-gradient(135deg, #dc2626, #f97316)',
  ]
  const idx = parseInt(id[0], 16) % palettes.length
  return palettes[idx]
}
