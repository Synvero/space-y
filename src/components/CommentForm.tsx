'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface CommentFormProps {
  targetType: 'question' | 'mission'
  targetId: string
}

export function CommentForm({ targetType, targetId }: CommentFormProps) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    if (body.length > 2000) { setError('Max 2000 characters'); return }
    setPending(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in to comment')
      const { error: insertErr } = await supabase.from('comments').insert({
        target_type: targetType,
        target_id: targetId,
        author_id: user.id,
        body: body.trim(),
      })
      if (insertErr) throw new Error(insertErr.message)
      setBody('')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to post')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="Add a comment..."
        className="w-full bg-[#0E141B] border border-[#1B2531] rounded-xl px-3 py-2 text-sm text-[#E8EDF4] placeholder-[#8A94B0]/50 focus:outline-none focus:border-[#2BE36C]/40 resize-none"
      />
      {error && <p className="text-xs text-[#FF5470] mt-1">{error}</p>}
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#1B2531] text-[#E8EDF4] hover:bg-[#2A3744] transition-colors disabled:opacity-50"
        >
          {pending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  )
}
