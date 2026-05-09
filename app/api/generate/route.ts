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

  const { title, description } = await request.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  let plan: string
  let html: string

  try {
    ;({ plan, html } = await generatePrototype(title, description ?? ''))
  } catch (e) {
    console.error('Gemini error:', e)
    const msg = e instanceof Error ? e.message : 'Generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const prototypeId = crypto.randomUUID()
  const storagePath = `${user.id}/${prototypeId}/index.html`

  const { error: uploadError } = await supabase.storage
    .from('prototypes')
    .upload(storagePath, new Blob([html], { type: 'text/html' }))

  if (uploadError) {
    console.error('Storage error:', uploadError)
    return NextResponse.json({ error: 'Failed to save prototype' }, { status: 500 })
  }

  const { error: dbError } = await supabase.from('prototypes').insert({
    id: prototypeId,
    user_id: user.id,
    title: title.trim(),
    description: description?.trim() ?? null,
    plan,
    storage_path: storagePath,
  })

  if (dbError) {
    console.error('DB error:', dbError)
    // Clean up the uploaded file so we don't leave orphans in storage
    await supabase.storage.from('prototypes').remove([storagePath])
    return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 })
  }

  return NextResponse.json({ id: prototypeId, plan })
}
