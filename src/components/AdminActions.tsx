'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LandingProps {
  type: 'landing'
  missionId: string
  marketId?: never
}

interface MarketProps {
  type: 'market'
  marketId: string
  missionId?: never
}

type AdminActionsProps = LandingProps | MarketProps

export function AdminActions(props: AdminActionsProps) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const act = async (action: string, fn: () => Promise<void>) => {
    setPending(action)
    setError(null)
    try {
      await fn()
      setDone(true)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setPending(null)
    }
  }

  if (done) return <p className="text-xs text-[#3DDC97]">Done.</p>

  if (props.type === 'landing') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => act('approve', async () => {
            const supabase = createClient()
            const { error } = await supabase.rpc('verify_landing', {
              p_mission: props.missionId,
              p_approve: true,
              p_mod_note: '',
            })
            if (error) throw new Error(error.message)
          })}
          disabled={pending !== null}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#3DDC97]/15 text-[#3DDC97] border border-[#3DDC97]/40 hover:bg-[#3DDC97]/25 disabled:opacity-50 transition-colors"
        >
          {pending === 'approve' ? 'Approving…' : 'Approve Landing'}
        </button>
        <button
          onClick={() => act('reject', async () => {
            const supabase = createClient()
            const { error } = await supabase.rpc('verify_landing', {
              p_mission: props.missionId,
              p_approve: false,
              p_mod_note: 'Rejected by moderator',
            })
            if (error) throw new Error(error.message)
          })}
          disabled={pending !== null}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FF5470]/15 text-[#FF5470] border border-[#FF5470]/40 hover:bg-[#FF5470]/25 disabled:opacity-50 transition-colors"
        >
          {pending === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
        {error && <p className="text-xs text-[#FF5470] w-full">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => act('yes', async () => {
          const supabase = createClient()
          const { error } = await supabase.rpc('resolve_market', {
            p_market: props.marketId,
            p_outcome: true,
          })
          if (error) throw new Error(error.message)
        })}
        disabled={pending !== null}
        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#3DDC97]/15 text-[#3DDC97] border border-[#3DDC97]/40 hover:bg-[#3DDC97]/25 disabled:opacity-50 transition-colors"
      >
        {pending === 'yes' ? 'Resolving…' : 'Resolve YES'}
      </button>
      <button
        onClick={() => act('no', async () => {
          const supabase = createClient()
          const { error } = await supabase.rpc('resolve_market', {
            p_market: props.marketId,
            p_outcome: false,
          })
          if (error) throw new Error(error.message)
        })}
        disabled={pending !== null}
        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FF5470]/15 text-[#FF5470] border border-[#FF5470]/40 hover:bg-[#FF5470]/25 disabled:opacity-50 transition-colors"
      >
        {pending === 'no' ? 'Resolving…' : 'Resolve NO'}
      </button>
      {error && <p className="text-xs text-[#FF5470] w-full">{error}</p>}
    </div>
  )
}
