'use client'

import { useState, useRef, useEffect } from 'react'
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  async function save() {
    if (saved || saving) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prototype.id, html }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shrink-0">
        <a
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
        >
          ← Dashboard
        </a>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-medium text-gray-800 flex-1 truncate">
          {prototype.title}
        </span>
        <a
          href={`/prototype/${prototype.id}`}
          target="_blank"
          className="text-sm text-blue-500 hover:underline shrink-0"
        >
          Preview ↗
        </a>
        <button
          onClick={save}
          disabled={saved || saving}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors shrink-0 ${
            saved
              ? 'bg-gray-100 text-gray-400 cursor-default'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
        </button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Prototype iframe */}
        <div className="flex-1 bg-white border-r border-gray-200 overflow-hidden">
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            title="Prototype preview"
          />
        </div>

        {/* Chat sidebar */}
        <div className="w-80 flex flex-col bg-white shrink-0">
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
      </div>
    </div>
  )
}
