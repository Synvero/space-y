'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LandingProps {
  type: 'landing'
  missionId: string
  marketId?: never
  reportId?: never
  targetType?: never
  targetId?: never
}

interface MarketProps {
  type: 'market'
  marketId: string
  missionId?: never
  reportId?: never
  targetType?: never
  targetId?: never
}

interface ReportProps {
  type: 'report'
  reportId: string
  targetType: string
  targetId: string
  missionId?: never
  marketId?: never
}

type AdminActionsProps = LandingProps | MarketProps | ReportProps

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

  if (done) return <p className="text-xs text-[#2BE36C]">Done.</p>

  if (props.type === 'report') {
    const tableMap: Record<string, string> = { question: 'questions', mission: 'missions', comment: 'comments' }
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => act('remove', async () => {
            const supabase = createClient()
            const table = tableMap[props.targetType] ?? props.targetType
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: rmErr } = await (supabase as any).from(table).update({ status: 'removed' }).eq('id', props.targetId)
            if (rmErr) throw new Error(rmErr.message)
            const { error: rptErr } = await supabase.from('reports').update({ status: 'actioned' }).eq('id', props.reportId)
            if (rptErr) throw new Error(rptErr.message)
          })}
          disabled={pending !== null}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FF5470]/15 text-[#FF5470] border border-[#FF5470]/40 hover:bg-[#FF5470]/25 disabled:opacity-50 transition-colors"
        >
          {pending === 'remove' ? 'Removing…' : 'Remove content'}
        </button>
        <button
          onClick={() => act('dismiss', async () => {
            const supabase = createClient()
            const { error } = await supabase.from('reports').update({ status: 'dismissed' }).eq('id', props.reportId)
            if (error) throw new Error(error.message)
          })}
          disabled={pending !== null}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#1B2531] text-[#8A94B0] border border-[#1B2531] hover:text-[#E8EDF4] disabled:opacity-50 transition-colors"
        >
          {pending === 'dismiss' ? 'Dismissing…' : 'Dismiss'}
        </button>
        {error && <p className="text-xs text-[#FF5470] w-full">{error}</p>}
      </div>
    )
  }

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
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#2BE36C]/15 text-[#2BE36C] border border-[#2BE36C]/40 hover:bg-[#2BE36C]/25 disabled:opacity-50 transition-colors"
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
        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#2BE36C]/15 text-[#2BE36C] border border-[#2BE36C]/40 hover:bg-[#2BE36C]/25 disabled:opacity-50 transition-colors"
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
