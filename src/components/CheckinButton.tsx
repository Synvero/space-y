'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function CheckinButtonClient() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const handleCheckin = async () => {
    setPending(true)
    const supabase = createClient()
    try {
      const { data, error } = await supabase.rpc('daily_checkin')
      if (error) {
        setMsg(error.message.includes('already') ? 'Already checked in today' : error.message)
      } else {
        setMsg(`+25 ⛽ collected — new balance: ${data}`)
        router.refresh()
      }
    } finally {
      setPending(false)
    }
  }

  if (msg) return <p className="text-xs text-[#3DDC97]">{msg}</p>

  return (
    <button
      onClick={handleCheckin}
      disabled={pending}
      className="bg-[#F5C542] hover:bg-[#FFDC6B] text-[#0A0E1A] text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      {pending ? 'Checking in…' : 'Daily Check-in (+25 ⛽)'}
    </button>
  )
}
