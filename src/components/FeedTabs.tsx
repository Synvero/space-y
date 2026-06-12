'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ORBIT_META, type Orbit } from '@/lib/scoring'

const TABS = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
  { key: 'landed', label: 'Landed' },
]

const ORBIT_KEYS = Object.keys(ORBIT_META) as Orbit[]

interface FeedTabsProps {
  activeTab: string
  activeOrbit?: string
}

export function FeedTabs({ activeTab, activeOrbit }: FeedTabsProps) {
  const pathname = usePathname()

  const buildHref = (tab: string, orbit?: string) => {
    const params = new URLSearchParams()
    if (tab !== 'hot') params.set('tab', tab)
    if (orbit) params.set('orbit', orbit)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[#1B2531]">
        {TABS.map(t => (
          <Link
            key={t.key}
            href={buildHref(t.key, activeOrbit)}
            className={`
              px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
              ${activeTab === t.key
                ? 'text-[#E8EDF4] border-[#2BE36C]'
                : 'text-[#8A94B0] border-transparent hover:text-[#E8EDF4]'
              }
            `}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Orbit filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={buildHref(activeTab)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors font-mono ${
            !activeOrbit
              ? 'border-[#2BE36C] text-[#2BE36C] bg-[#2BE36C]/10'
              : 'border-[#1B2531] text-[#8A94B0] hover:border-[#8A94B0]'
          }`}
        >
          ALL
        </Link>
        {ORBIT_KEYS.map(orbit => {
          const meta = ORBIT_META[orbit]
          const active = activeOrbit === orbit
          return (
            <Link
              key={orbit}
              href={buildHref(activeTab, active ? undefined : orbit)}
              className="text-xs px-3 py-1 rounded-full border transition-colors font-mono"
              style={{
                borderColor: active ? meta.color : `${meta.color}30`,
                color: active ? meta.color : '#8A94B0',
                backgroundColor: active ? `${meta.color}15` : 'transparent',
              }}
            >
              {orbit.replace('_', ' ').toUpperCase()}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
