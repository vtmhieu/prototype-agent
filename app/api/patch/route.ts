import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { patchPrototype } from '@/lib/gemini'

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, message, currentHtml } = await request.json()

  if (!id || !message?.trim() || !currentHtml) {
    return NextResponse.json({ error: 'id, message and currentHtml are required' }, { status: 400 })
  }

  // Verify ownership via RLS
  const { data: prototype, error } = await supabase
    .from('prototypes')
    .select('id')
    .eq('id', id)
    .single()

  if (error || !prototype) {
    return NextResponse.json({ error: 'Prototype not found' }, { status: 404 })
  }

  try {
    const { html, summary } = await patchPrototype(currentHtml, message.trim())
    return NextResponse.json({ html, summary })
  } catch (e) {
    console.error('Gemini patch error:', e)
    return NextResponse.json({ error: 'Patch failed' }, { status: 500 })
  }
}
