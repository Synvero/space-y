'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [checkinPending, setCheckinPending] = useState(false)
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
    }
    loadProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile()
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleCheckin = async () => {
    setCheckinPending(true)
    try {
      const { data, error } = await supabase.rpc('daily_checkin')
      if (error) {
        setCheckinMsg(error.message.includes('already') ? 'Already checked in today' : error.message)
      } else {
        setCheckinMsg(`+25 ⛽ — Balance: ${data}`)
        setProfile(prev => prev ? { ...prev, fuel: data } : prev)
      }
    } finally {
      setCheckinPending(false)
      setTimeout(() => setCheckinMsg(null), 3000)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#1B2531] bg-[#070A0F]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Logo size="sm" />
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Launch CTA */}
        <Link
          href="/launch"
          className="hidden sm:flex items-center cta-glow bg-[#2BE36C] hover:bg-[#5AF093] text-[#04110A] font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
        >
          Launch a Why
        </Link>

        {/* Auth area */}
        {profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 text-sm text-[#E8EDF4] hover:text-white transition-colors"
              aria-label="User menu"
            >
              <span className="font-mono text-[#F5C542] text-xs">
                {profile.fuel.toLocaleString()} ⛽
              </span>
              <span className="w-8 h-8 rounded-full bg-[#1B2531] border border-[#2BE36C]/40 flex items-center justify-center text-xs font-semibold">
                {profile.handle[0].toUpperCase()}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#0E141B] border-[#1B2531] text-[#E8EDF4] w-52"
            >
              <div className="px-2 py-1.5 text-xs text-[#8A94B0]">
                @{profile.handle}
              </div>
              <DropdownMenuSeparator className="bg-[#1B2531]" />
              <DropdownMenuItem
                className="cursor-pointer hover:bg-[#1B2531] focus:bg-[#1B2531]"
                onClick={handleCheckin}
                disabled={checkinPending}
              >
                {checkinMsg ?? 'Daily Check-in (+25 ⛽)'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1B2531]" />
              <DropdownMenuItem className="cursor-pointer hover:bg-[#1B2531] focus:bg-[#1B2531] p-0">
                <Link href={`/u/${profile.handle}`} className="flex w-full px-1.5 py-1">My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-[#1B2531] focus:bg-[#1B2531] p-0">
                <Link href="/hangar" className="flex w-full px-1.5 py-1">Hangar</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-[#1B2531] focus:bg-[#1B2531] p-0">
                <Link href="/leaderboard" className="flex w-full px-1.5 py-1">Leaderboard</Link>
              </DropdownMenuItem>
              {profile.role !== 'crew' && (
                <DropdownMenuItem className="cursor-pointer hover:bg-[#1B2531] focus:bg-[#1B2531] p-0">
                  <Link href="/admin" className="flex w-full px-1.5 py-1">Admin</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-[#1B2531]" />
              <DropdownMenuItem
                className="cursor-pointer text-[#FF5470] hover:bg-[#1B2531] focus:bg-[#1B2531]"
                onClick={handleSignOut}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/auth/login"
            className="border border-[#1B2531] text-[#E8EDF4] hover:bg-[#1B2531] text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  )
}
