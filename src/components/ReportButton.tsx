'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ReportButtonProps {
  targetType: 'question' | 'mission' | 'comment'
  targetId: string
}

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) { setError('Reason required'); return }
    setPending(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in to report')

      const { error: insertErr } = await supabase.from('reports').insert({
        target_type: targetType,
        target_id: targetId,
        reporter_id: user.id,
        reason: reason.trim(),
      })
      if (insertErr) throw new Error(insertErr.message)
      setDone(true)
      setOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setPending(false)
    }
  }

  if (done) return <span className="text-xs text-[#8A94B0]">Reported</span>

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[#8A94B0] hover:text-[#FF5470] transition-colors"
      >
        Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-[#111729] border border-[#1E2740] rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-heading font-semibold text-[#E8ECF8] mb-1">Report</h2>
            <p className="text-xs text-[#8A94B0] mb-4">
              Tell us what rule this breaks. Mods review every report.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describe the issue..."
                className="w-full bg-[#0A0E1A] border border-[#1E2740] rounded-lg px-3 py-2 text-sm text-[#E8ECF8] placeholder-[#8A94B0]/50 focus:outline-none focus:border-[#FF5470]/50 resize-none"
              />
              {error && <p className="text-xs text-[#FF5470]">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-lg text-sm border border-[#1E2740] text-[#8A94B0] hover:text-[#E8ECF8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold bg-[#FF5470]/15 text-[#FF5470] border border-[#FF5470]/40 hover:bg-[#FF5470]/25 transition-colors disabled:opacity-50"
                >
                  {pending ? 'Sending…' : 'Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
