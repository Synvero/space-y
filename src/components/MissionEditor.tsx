'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MissionEditorProps {
  questionId: string
  questionSlug: string
}

export function MissionEditor({ questionId, questionSlug }: MissionEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.length < 5 || body.length < 20) return

    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sign in to propose a mission')
      setSubmitting(false)
      return
    }

    const { data, error } = await supabase
      .from('missions')
      .insert({
        question_id: questionId,
        author_id: user.id,
        title: title.trim(),
        body: body.trim(),
      })
      .select('id')
      .single()

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    router.push(`/q/${questionSlug}/mission/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-4 text-xs text-[#8A94B0]">
        <p className="font-medium text-[#E8ECF8] mb-1">What makes a good mission?</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Be rigorous within the logic of the question</li>
          <li>Include steps, materials, or a mechanism</li>
          <li>Absurd questions deserve serious engineering</li>
        </ul>
      </div>

      <div className="space-y-2">
        <Label className="text-[#E8ECF8] text-sm">Mission title</Label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. The Screaming Pot"
          required
          minLength={5}
          maxLength={140}
          className="bg-[#0A0E1A] border-[#1E2740] text-[#E8ECF8] placeholder:text-[#8A94B0]"
        />
        <p className="text-xs text-[#8A94B0] text-right">{title.length}/140</p>
      </div>

      <div className="space-y-2">
        <Label className="text-[#E8ECF8] text-sm">
          Mission body (Markdown supported)
        </Label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={`## How it works\n\nDescribe your solution step by step. Include:\n- Materials/ingredients/components\n- How it actually solves the Why\n- Any evidence or precedents\n\nThe more rigorous, the higher your score.`}
          rows={14}
          required
          minLength={20}
          maxLength={16000}
          className="w-full bg-[#0A0E1A] border border-[#1E2740] rounded-lg px-3 py-2 text-sm text-[#E8ECF8] placeholder:text-[#8A94B0] resize-y focus:outline-none focus:border-[#FF6B2C] font-mono"
        />
        <p className="text-xs text-[#8A94B0] text-right">{body.length}/16000</p>
      </div>

      {error && <p className="text-[#FF5470] text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-[#1E2740] text-[#8A94B0] hover:text-[#E8ECF8] rounded-lg py-2.5 text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || title.length < 5 || body.length < 20}
          className="flex-1 bg-[#FF6B2C] hover:bg-[#FF8A52] text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
        >
          {submitting ? 'Proposing…' : 'Propose Mission'}
        </button>
      </div>
    </form>
  )
}
