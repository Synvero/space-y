'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MarketWidgetProps {
  marketId: string
  questionText: string
  status: string
  resolvesAt: string
  outcome: boolean | null
}

interface PoolData {
  yesPool: number
  noPool: number
  userYes: number
  userNo: number
  loaded: boolean
}

function useCountdown(resolvesAt: string) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(resolvesAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Expired'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      if (d > 0) setRemaining(`${d}d ${h}h`)
      else if (h > 0) setRemaining(`${h}h ${m}m`)
      else setRemaining(`${m}m`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [resolvesAt])

  return remaining
}

function previewPayout(amount: number, side: boolean, yesPool: number, noPool: number): number {
  if (amount <= 0) return 0
  const winnerPool = (side ? yesPool : noPool) + amount
  const loserPool = side ? noPool : yesPool
  const distributable = Math.floor(loserPool * 0.98)
  return amount + Math.floor((amount / winnerPool) * distributable)
}

export function MarketWidget({ marketId, questionText, status, resolvesAt, outcome }: MarketWidgetProps) {
  const supabase = createClient()
  const countdown = useCountdown(resolvesAt)
  const [pool, setPool] = useState<PoolData>({ yesPool: 0, noPool: 0, userYes: 0, userNo: 0, loaded: false })
  const [amount, setAmount] = useState(50)
  const [side, setSide] = useState<boolean>(true) // true=YES
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadPools = useCallback(async () => {
    const [{ data: stakes }, { data: { user } }] = await Promise.all([
      supabase.from('stakes').select('side, amount, user_id').eq('market_id', marketId),
      supabase.auth.getUser(),
    ])
    if (!stakes) return

    let yesPool = 0, noPool = 0, userYes = 0, userNo = 0
    for (const s of stakes) {
      if (s.side) { yesPool += s.amount; if (s.user_id === user?.id) userYes += s.amount }
      else { noPool += s.amount; if (s.user_id === user?.id) userNo += s.amount }
    }
    setPool({ yesPool, noPool, userYes, userNo, loaded: true })
  }, [marketId])

  useEffect(() => { loadPools() }, [loadPools])

  const totalPool = pool.yesPool + pool.noPool
  const yesPercent = totalPool > 0 ? Math.round((pool.yesPool / totalPool) * 100) : 50
  const noPercent = 100 - yesPercent

  const payout = previewPayout(amount, side, pool.yesPool, pool.noPool)

  const handleStake = async () => {
    if (amount < 10) { setError('Minimum stake is 10 Fuel'); return }
    setLoading(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('place_stake', {
        p_market: marketId,
        p_side: side,
        p_amount: amount,
      })
      if (rpcErr) throw new Error(rpcErr.message)
      setSuccess(`Staked ${amount} ⛽ on ${side ? 'YES' : 'NO'}`)
      await loadPools()
      setTimeout(() => setSuccess(null), 4000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to place stake')
    } finally {
      setLoading(false)
    }
  }

  const isResolved = status === 'resolved'
  const isOpen = status === 'open'

  return (
    <div className="bg-[#111729] border border-[#4D9FFF]/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1E2740]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#4D9FFF] font-mono font-bold">PREDICTION MARKET</span>
          <span className="text-xs text-[#8A94B0] font-mono">{isResolved ? 'CLOSED' : countdown}</span>
        </div>
        <p className="text-sm text-[#E8ECF8]">{questionText}</p>
      </div>

      {/* Pool bars */}
      <div className="px-4 py-3">
        <div className="flex h-3 rounded-full overflow-hidden mb-2">
          <div
            className="bg-[#3DDC97] transition-all duration-500"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="bg-[#FF5470] transition-all duration-500"
            style={{ width: `${noPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-[#3DDC97]">YES {yesPercent}% · {pool.yesPool.toLocaleString()} ⛽</span>
          <span className="text-[#FF5470]">NO {noPercent}% · {pool.noPool.toLocaleString()} ⛽</span>
        </div>
      </div>

      {/* Resolved state */}
      {isResolved && (
        <div className="px-4 pb-4">
          <div
            className={`text-center py-2 rounded-lg font-mono font-bold text-sm ${
              outcome ? 'bg-[#3DDC97]/10 text-[#3DDC97] border border-[#3DDC97]/30' : 'bg-[#FF5470]/10 text-[#FF5470] border border-[#FF5470]/30'
            }`}
          >
            RESOLVED {outcome ? 'YES' : 'NO'}
          </div>
        </div>
      )}

      {/* Own position */}
      {pool.loaded && (pool.userYes > 0 || pool.userNo > 0) && (
        <div className="px-4 pb-3">
          <p className="text-xs text-[#8A94B0] mb-1">Your position</p>
          <div className="flex gap-3 text-xs font-mono">
            {pool.userYes > 0 && <span className="text-[#3DDC97]">{pool.userYes} ⛽ YES</span>}
            {pool.userNo > 0 && <span className="text-[#FF5470]">{pool.userNo} ⛽ NO</span>}
          </div>
        </div>
      )}

      {/* Stake form */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          <div className="border-t border-[#1E2740] pt-3">
            {/* Side picker */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setSide(true)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                  side ? 'bg-[#3DDC97]/15 text-[#3DDC97] border-[#3DDC97]/50' : 'text-[#8A94B0] border-[#1E2740] hover:border-[#3DDC97]/30'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => setSide(false)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                  !side ? 'bg-[#FF5470]/15 text-[#FF5470] border-[#FF5470]/50' : 'text-[#8A94B0] border-[#1E2740] hover:border-[#FF5470]/30'
                }`}
              >
                NO
              </button>
            </div>

            {/* Amount input */}
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                min={10}
                max={500}
                value={amount}
                onChange={e => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 bg-[#0A0E1A] border border-[#1E2740] rounded-lg px-3 py-1.5 text-sm font-mono text-[#E8ECF8] focus:outline-none focus:border-[#4D9FFF]/50"
              />
              <span className="flex items-center text-sm text-[#8A94B0]">⛽</span>
            </div>

            {/* Quick chips */}
            <div className="flex gap-1.5 mb-3">
              {[10, 50, 100, 250, 500].map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`flex-1 py-1 rounded text-xs font-mono transition-all border ${
                    amount === v ? 'bg-[#4D9FFF]/15 text-[#4D9FFF] border-[#4D9FFF]/40' : 'text-[#8A94B0] border-[#1E2740] hover:border-[#4D9FFF]/30'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Payout preview */}
            <div className="flex justify-between text-xs text-[#8A94B0] mb-3">
              <span>Potential payout</span>
              <span className="font-mono text-[#F5C542]">{amount > 0 ? payout.toLocaleString() : '—'} ⛽</span>
            </div>

            {error && <p className="text-xs text-[#FF5470] mb-2">{error}</p>}
            {success && <p className="text-xs text-[#3DDC97] mb-2">{success}</p>}

            <button
              onClick={handleStake}
              disabled={loading || amount < 10}
              className="w-full py-2 rounded-lg text-sm font-semibold bg-[#4D9FFF] hover:bg-[#6DB5FF] text-[#0A0E1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Launching…' : `Stake ${amount} ⛽ on ${side ? 'YES' : 'NO'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
