import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch prototype to get storage_path — RLS ensures ownership
  const { data: prototype, error: fetchError } = await supabase
    .from('prototypes')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (fetchError || !prototype) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Delete from storage
  await supabase.storage.from('prototypes').remove([prototype.storage_path])

  // Delete from DB
  await supabase.from('prototypes').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
