import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Editor from '@/components/Editor'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // RLS ensures the user owns this prototype
  const { data: prototype, error } = await supabase
    .from('prototypes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !prototype) notFound()

  const { data, error: storageError } = await supabase.storage
    .from('prototypes')
    .download(prototype.storage_path)

  if (storageError || !data) notFound()

  const html = await data.text()

  return <Editor prototype={prototype} initialHtml={html} />
}
