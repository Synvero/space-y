'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProofModalProps {
  missionId: string
}

export function ProofModal({ missionId }: ProofModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [proofNote, setProofNote] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proofUrl.trim()) { setError('Proof URL is required'); return }
    setPending(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: rpcErr } = await supabase.rpc('claim_landing', {
        p_mission: missionId,
        p_proof_url: proofUrl.trim(),
        p_note: proofNote.trim(),
      })
      if (rpcErr) throw new Error(rpcErr.message)
      setOpen(false)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit claim')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#3DDC97] hover:bg-[#5EEAAC] text-[#0A0E1A] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        Claim Landing
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-[#111729] border border-[#1E2740] rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-heading font-bold text-xl text-[#E8ECF8] mb-1">
              Claim Landing
            </h2>
            <p className="text-sm text-[#8A94B0] mb-5">
              Submit proof you built and verified this solution in the real world.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#8A94B0] mb-1.5">Proof URL *</label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or github.com/..."
                  className="w-full bg-[#0A0E1A] border border-[#1E2740] rounded-lg px-3 py-2 text-sm text-[#E8ECF8] placeholder-[#8A94B0]/50 focus:outline-none focus:border-[#3DDC97]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8A94B0] mb-1.5">Notes (optional)</label>
                <textarea
                  value={proofNote}
                  onChange={e => setProofNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Describe what you built and how you verified it..."
                  className="w-full bg-[#0A0E1A] border border-[#1E2740] rounded-lg px-3 py-2 text-sm text-[#E8ECF8] placeholder-[#8A94B0]/50 focus:outline-none focus:border-[#3DDC97]/50 resize-none"
                />
              </div>

              {error && <p className="text-xs text-[#FF5470]">{error}</p>}

              <div className="flex gap-3 pt-1">
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
                  className="flex-1 py-2 rounded-lg text-sm font-semibold bg-[#3DDC97] hover:bg-[#5EEAAC] text-[#0A0E1A] transition-colors disabled:opacity-50"
                >
                  {pending ? 'Submitting…' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
