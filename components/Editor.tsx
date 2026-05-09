'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Prototype } from '@/lib/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Editor({
  prototype,
  initialHtml,
}: {
  prototype: Prototype
  initialHtml: string
}) {
  const [html, setHtml] = useState(initialHtml)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'I\'m ready to help you edit this prototype. Describe any change you\'d like to make.' },
  ])
  const [input, setInput] = useState('')
  const [patching, setPatching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Warn on accidental close when there are unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!saved) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saved])

  const saveHtml = useCallback(async (htmlToSave: string) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prototype.id, html: htmlToSave }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [prototype.id])

  // Auto-save 3 seconds after the last patch
  function scheduleAutoSave(newHtml: string) {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => saveHtml(newHtml), 3000)
  }

  async function sendMessage() {
    if (!input.trim() || patching) return

    const userMsg = input.trim()
    setInput('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setPatching(true)

    try {
      const res = await fetch('/api/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prototype.id, message: userMsg, currentHtml: html }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Patch failed')

      setHtml(data.html)
      setSaved(false)
      scheduleAutoSave(data.html)
      setMessages(prev => [...prev, { role: 'assistant', content: `✓ ${data.summary}` }])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      setError(msg)
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${msg}` }])
    } finally {
      setPatching(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function downloadHtml() {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prototype.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <a
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 shrink-0"
        >
          ← Dashboard
        </a>
        <span className="text-gray-300 hidden sm:block">|</span>
        <span className="text-sm font-medium text-gray-800 flex-1 truncate hidden sm:block">
          {prototype.title}
        </span>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <a
            href={`/prototype/${prototype.id}`}
            target="_blank"
            className="text-sm text-blue-500 hover:underline"
          >
            Preview ↗
          </a>
          <button
            onClick={downloadHtml}
            className="text-sm text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="Download HTML"
          >
            Download
          </button>
          <button
            onClick={() => saveHtml(html)}
            disabled={saved || saving}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              saved
                ? 'bg-gray-100 text-gray-400 cursor-default'
                : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}
          >
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
          </button>
          {/* Toggle sidebar on mobile */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="sm:hidden p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            aria-label="Toggle AI panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content — stacks vertically on mobile, side-by-side on sm+ */}
      <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">
        {/* Prototype iframe */}
        <div className={`bg-white border-gray-200 overflow-hidden ${sidebarOpen ? 'flex-1 border-b sm:border-b-0 sm:border-r' : 'flex-1'}`}>
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            title="Prototype preview"
            sandbox="allow-scripts allow-forms allow-modals"
          />
        </div>

        {/* Chat sidebar */}
        {sidebarOpen && (
          <div className="w-full sm:w-80 flex flex-col bg-white shrink-0 h-72 sm:h-auto">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {patching && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-xl px-3 py-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Error */}
            {error && (
              <p className="px-4 py-2 text-xs text-red-500 bg-red-50 border-t border-red-100">
                {error}
              </p>
            )}

            {/* Auto-save notice */}
            {!saved && !saving && (
              <p className="px-4 py-1.5 text-xs text-amber-600 bg-amber-50 border-t border-amber-100">
                Auto-saving in 3s…
              </p>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 p-3">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={patching}
                  rows={2}
                  placeholder="Describe a change… (Enter to send)"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none disabled:bg-gray-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || patching}
                  className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed self-end"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
