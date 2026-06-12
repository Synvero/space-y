'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface VoteScaleProps {
  targetType: 'question' | 'mission'
  targetId: string
  dimension: 'absurdity' | 'rigor'
  currentVote?: number | null
  voteCount: number
  onVoted?: (value: number) => void
}

const LABELS = {
  absurdity: { low: 'mundane', high: 'cosmic' },
  rigor: { low: 'hand-wavy', high: 'airtight' },
}

export function VoteScale({ targetType, targetId, dimension, currentVote, voteCount, onVoted }: VoteScaleProps) {
  const supabase = createClient()
  const [selected, setSelected] = useState<number | null>(currentVote ?? null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const labels = LABELS[dimension]

  const handleVote = async (value: number) => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Sign in to vote')
        return
      }

      const { error } = await supabase.from('votes').upsert({
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        dimension,
        value,
      }, { onConflict: 'user_id,target_type,target_id,dimension' })

      if (error) {
        setError(error.message)
      } else {
        setSelected(value)
        onVoted?.(value)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
          <button
            key={v}
            onClick={() => handleVote(v)}
            disabled={pending}
            className={`
              flex-1 h-6 rounded text-xs font-mono transition-all
              ${selected === v
                ? 'text-[#0A0E1A] font-bold'
                : 'text-[#8A94B0] hover:text-[#E8ECF8]'
              }
            `}
            style={{
              backgroundColor: selected === v
                ? dimension === 'absurdity' ? '#F5C542' : '#3DDC97'
                : `${dimension === 'absurdity' ? '#F5C542' : '#3DDC97'}${Math.round((v / 10) * 40).toString(16).padStart(2, '0')}`,
            }}
            title={`${v}/10`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-[#8A94B0]">
        <span>{labels.low}</span>
        <span className="text-[#8A94B0]">{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
        <span>{labels.high}</span>
      </div>
      {error && <p className="text-[#FF5470] text-xs">{error}</p>}
    </div>
  )
}
