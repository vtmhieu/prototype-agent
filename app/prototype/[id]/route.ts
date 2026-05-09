import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // RLS blocks access if the user doesn't own this prototype
  const { data: prototype, error } = await supabase
    .from('prototypes')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (error || !prototype) {
    return new NextResponse('Prototype not found.', { status: 404 })
  }

  const { data, error: storageError } = await supabase.storage
    .from('prototypes')
    .download(prototype.storage_path)

  if (storageError || !data) {
    return new NextResponse('Could not load prototype.', { status: 500 })
  }

  const html = await data.text()

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
