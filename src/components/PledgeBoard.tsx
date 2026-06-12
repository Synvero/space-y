'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Pledge {
  id: string
  amount_eur: number
  message: string | null
  created_at: string
  user_id: string
  user: { handle: string; display_name: string } | null
}

interface PledgeBoardProps {
  targetType: 'question' | 'mission'
  targetId: string
  initialPledges: Pledge[]
  currentUserId?: string | null
}

export function PledgeBoard({ targetType, targetId, initialPledges, currentUserId }: PledgeBoardProps) {
  const [pledges, setPledges] = useState<Pledge[]>(initialPledges)
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [withdrawing, setWithdrawing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalEur = pledges.reduce((sum, p) => sum + p.amount_eur, 0)
  const crewCount = pledges.length

  const handlePledge = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 1) { setError('Minimum pledge is €1'); return }
    if (amt > 100000) { setError('Maximum pledge is €100,000'); return }
    setPending(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in to pledge')

      const { data, error: insertErr } = await supabase
        .from('pledges')
        .insert({
          target_type: targetType,
          target_id: targetId,
          user_id: user.id,
          amount_eur: amt,
          message: message.trim() || null,
        })
        .select(`
          id, amount_eur, message, created_at, user_id,
          user:profiles!user_id(handle, display_name)
        `)
        .single()

      if (insertErr) throw new Error(insertErr.message)
      if (data) {
        setPledges(prev => [data as unknown as Pledge, ...prev])
      }
      setAmount('')
      setMessage('')
      setShowForm(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit pledge')
    } finally {
      setPending(false)
    }
  }

  const handleWithdraw = async (pledgeId: string) => {
    setWithdrawing(pledgeId)
    try {
      const supabase = createClient()
      const { error: updateErr } = await supabase
        .from('pledges')
        .update({ status: 'withdrawn' })
        .eq('id', pledgeId)
      if (updateErr) throw new Error(updateErr.message)
      setPledges(prev => prev.filter(p => p.id !== pledgeId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to withdraw pledge')
    } finally {
      setWithdrawing(null)
    }
  }

  return (
    <div className="bg-[#0E141B] border border-[#1B2531] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1B2531]">
        <div>
          <p className="text-xs text-[#8A94B0] font-mono mb-0.5">PLEDGE BOARD</p>
          <p className="font-mono text-[#F5C542] font-bold text-lg">
            €{totalEur.toLocaleString('en-US', { minimumFractionDigits: 0 })} pledged by {crewCount} crew
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#F5C542]/40 text-[#F5C542] hover:bg-[#F5C542]/10 transition-colors"
        >
          {showForm ? 'Cancel' : 'Pledge'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handlePledge} className="px-4 py-3 border-b border-[#1B2531] space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A94B0]">€</span>
              <input
                type="number"
                min="1"
                max="100000"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="100"
                className="w-full bg-[#070A0F] border border-[#1B2531] rounded-lg pl-7 pr-3 py-1.5 text-sm font-mono text-[#E8EDF4] placeholder-[#8A94B0]/50 focus:outline-none focus:border-[#F5C542]/50"
              />
            </div>
          </div>
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={280}
            placeholder="Optional note..."
            className="w-full bg-[#070A0F] border border-[#1B2531] rounded-lg px-3 py-1.5 text-sm text-[#E8EDF4] placeholder-[#8A94B0]/50 focus:outline-none focus:border-[#F5C542]/50"
          />
          {error && <p className="text-xs text-[#FF5470]">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-1.5 rounded-lg text-sm font-semibold bg-[#F5C542] hover:bg-[#FFDC6B] text-[#070A0F] transition-colors disabled:opacity-50"
          >
            {pending ? 'Submitting…' : 'Pledge'}
          </button>
        </form>
      )}

      {pledges.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-[#8A94B0]">No pledges yet. Be the first.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#1B2531]">
          {pledges.map(p => (
            <div key={p.id} className="px-4 py-3 flex items-start gap-3">
              <div className="font-mono text-sm font-bold text-[#F5C542] shrink-0 w-20 text-right">
                €{p.amount_eur.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <div className="flex-1 min-w-0">
                {p.message && (
                  <p className="text-sm text-[#E8EDF4] mb-0.5">{p.message}</p>
                )}
                <p className="text-xs text-[#8A94B0]">
                  @{p.user?.handle ?? 'anonymous'}
                </p>
              </div>
              {currentUserId && p.user_id === currentUserId && (
                <button
                  onClick={() => handleWithdraw(p.id)}
                  disabled={withdrawing === p.id}
                  className="text-xs text-[#8A94B0] hover:text-[#FF5470] transition-colors disabled:opacity-50 shrink-0"
                >
                  {withdrawing === p.id ? '…' : 'Withdraw'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-t border-[#1B2531]">
        <p className="text-xs text-[#8A94B0]">
          Pledges are public statements of intent. SPACE Y? does not hold or transfer money. Settlement happens directly between you and the builder.
        </p>
      </div>
    </div>
  )
}
