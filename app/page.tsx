import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginButton from '@/components/LoginButton'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          Prototype Agent
        </h1>
        <p className="text-gray-500 mb-10 text-base leading-relaxed">
          Describe a UI and get a live, interactive prototype in ~30 seconds.
          Your prototypes are private — only you can see them.
        </p>
        <LoginButton />
        <p className="mt-6 text-xs text-gray-400">
          Powered by Gemini · Free to use
        </p>
      </div>
    </main>
  )
}
