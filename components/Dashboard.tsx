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

  function reset() {
    setStatus('idle')
    setErrorMsg('')
    setLastPlan('')
    setLastId('')
  }

  const busy = status !== 'idle'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-semibold text-gray-900">Prototype Agent</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{userEmail}</span>
            <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-800">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Generate form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New prototype</h2>
          <div className="mb-4">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !description && handleGenerate()}
              disabled={busy}
              placeholder="What do you want to build? e.g. CRM dashboard for sales leads"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div className="mb-5">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={busy}
              rows={3}
              placeholder="Details (optional) — features, layout, data to show, interactions..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!title.trim() || busy}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Generate Prototype
          </button>
        </div>

        {/* Status */}
        {status !== 'idle' && (
          <div className="mb-6">
            {(status === 'generating' || status === 'updating') && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600">
                <Spinner />
                <span>
                  {status === 'generating' ? 'Generating prototype' : 'Updating prototype'}
                  <span className="text-gray-400 ml-2">{elapsed}s</span>
                </span>
              </div>
            )}

            {status === 'deleting' && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600">
                <Spinner />
                Deleting...
              </div>
            )}

            {status === 'done' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <p className="text-green-800 font-medium mb-1">
                  {lastId ? '✅ Ready' : '✅ Done'}
                </p>
                {lastPlan && (
                  <pre className="text-xs text-green-700 whitespace-pre-wrap mb-3 font-sans">{lastPlan}</pre>
                )}
                <div className="flex items-center gap-3">
                  {lastId && (
                    <a
                      href={`/prototype/${lastId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <p className="text-red-800 font-medium mb-1">❌ Failed</p>
                <p className="text-red-700 text-sm mb-3">{errorMsg}</p>
                <button onClick={reset} className="text-sm text-red-700 hover:underline">
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Prototype list */}
        {loadingList ? (
          <div className="text-sm text-gray-400 text-center py-8">Loading...</div>
        ) : prototypes.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">
            No prototypes yet. Generate your first one above.
          </div>
        ) : (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Your prototypes
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {prototypes.map(p => (
                <div key={p.id}>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{p.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(p.updated_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/prototype/${p.id}`}
                        target="_blank"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Open
                      </a>
                      <span className="text-gray-200">|</span>
                      <a
                        href={`/prototype/${p.id}/edit`}
                        className="text-xs text-gray-500 hover:text-gray-800"
                      >
                        Edit
                      </a>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => { setUpdatingId(updatingId === p.id ? null : p.id); setUpdateRequest('') }}
                        disabled={busy}
                        className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
                      >
                        Regenerate
                      </button>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={busy}
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Inline update form */}
                  {updatingId === p.id && status === 'idle' && (
                    <div className="px-5 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                      <textarea
                        value={updateRequest}
                        onChange={e => setUpdateRequest(e.target.value)}
                        rows={2}
                        placeholder="What do you want to change? e.g. Add dark mode, change colours to blue, add an export button..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none bg-white mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(p.id)}
                          disabled={!updateRequest.trim()}
                          className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Apply update
                        </button>
                        <button
                          onClick={() => { setUpdatingId(null); setUpdateRequest('') }}
                          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800"
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

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
