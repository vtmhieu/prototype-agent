import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePrototype } from '@/lib/gemini'

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, updateRequest } = await request.json()

  if (!id || !updateRequest?.trim()) {
    return NextResponse.json({ error: 'id and updateRequest are required' }, { status: 400 })
  }

  // Fetch the prototype — RLS ensures ownership
  const { data: prototype, error: fetchError } = await supabase
    .from('prototypes')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !prototype) {
    return NextResponse.json({ error: 'Prototype not found' }, { status: 404 })
  }

  let plan: string
  let html: string

  try {
    ;({ plan, html } = await generatePrototype(
      prototype.title,
      prototype.description ?? '',
      updateRequest.trim()
    ))
  } catch (e) {
    console.error('Gemini error:', e)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }

  // Overwrite the existing file in storage
  const { error: uploadError } = await supabase.storage
    .from('prototypes')
    .update(prototype.storage_path, new Blob([html], { type: 'text/html' }))

  if (uploadError) {
    console.error('Storage error:', uploadError)
    return NextResponse.json({ error: 'Failed to save updated prototype' }, { status: 500 })
  }

  // Update metadata
  await supabase
    .from('prototypes')
    .update({ plan })
    .eq('id', id)

  return NextResponse.json({ id, plan })
}
