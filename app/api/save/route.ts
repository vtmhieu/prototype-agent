import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, html } = await request.json()

  if (!id || !html) {
    return NextResponse.json({ error: 'id and html are required' }, { status: 400 })
  }

  // Fetch prototype — RLS ensures ownership
  const { data: prototype, error } = await supabase
    .from('prototypes')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (error || !prototype) {
    return NextResponse.json({ error: 'Prototype not found' }, { status: 404 })
  }

  const { error: uploadError } = await supabase.storage
    .from('prototypes')
    .update(prototype.storage_path, new Blob([html], { type: 'text/html' }))

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  await supabase.from('prototypes').update({ updated_at: new Date().toISOString() }).eq('id', id)

  return NextResponse.json({ success: true })
}
