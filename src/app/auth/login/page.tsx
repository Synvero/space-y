'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/confirm`,
      },
    })

    setPending(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="md" />
          <p className="mt-3 text-[#8A94B0] text-sm">
            Launch absurd questions. Engineer rigorous answers.
          </p>
        </div>

        {sent ? (
          <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🚀</div>
            <h2 className="font-heading font-semibold text-lg mb-2">Check your inbox</h2>
            <p className="text-[#8A94B0] text-sm">
              We sent a magic link to <strong className="text-[#E8ECF8]">{email}</strong>.
              Click it to join the crew.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-[#111729] border border-[#1E2740] rounded-xl p-6 space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#E8ECF8] text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="crew@example.com"
                required
                className="bg-[#0A0E1A] border-[#1E2740] text-[#E8ECF8] placeholder:text-[#8A94B0]"
              />
            </div>

            {error && (
              <p className="text-[#FF5470] text-sm">{error}</p>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-[#FF6B2C] hover:bg-[#FF8A52] text-white font-semibold"
            >
              {pending ? 'Sending…' : 'Send Magic Link'}
            </Button>

            <p className="text-center text-xs text-[#8A94B0]">
              No password needed. We'll email you a one-click login link.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
