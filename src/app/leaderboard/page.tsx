import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { rankLabel } from '@/lib/scoring'

export const metadata = { title: 'Leaderboard | SPACE Y?' }

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { key: 'score', label: 'Score' },
  { key: 'fuel',  label: 'Fuel' },
  { key: 'landings', label: 'Landings' },
]

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const { tab = 'score' } = await searchParams

  let supabase
  try {
    supabase = await createClient()
  } catch {
    supabase = null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[] = []

  if (supabase) {
    if (tab === 'score') {
      const { data } = await supabase
        .from('profiles')
        .select('id, handle, display_name, reputation, fuel')
        .order('reputation', { ascending: false })
        .limit(25)
      rows = data ?? []
    } else if (tab === 'fuel') {
      const { data } = await supabase
        .from('profiles')
        .select('id, handle, display_name, reputation, fuel')
        .order('fuel', { ascending: false })
        .limit(25)
      rows = data ?? []
    } else if (tab === 'landings') {
      // aggregate landed missions per user
      const { data: missions } = await supabase
        .from('missions')
        .select('author_id, score')
        .eq('status', 'landed')
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, handle, display_name, reputation, fuel')

      if (missions && profiles) {
        const counts: Record<string, { count: number; scoreSum: number }> = {}
        for (const m of missions) {
          if (!counts[m.author_id]) counts[m.author_id] = { count: 0, scoreSum: 0 }
          counts[m.author_id].count++
          counts[m.author_id].scoreSum += m.score ?? 0
        }
        rows = profiles
          .map(p => ({ ...p, landingCount: counts[p.id]?.count ?? 0, scoreSum: counts[p.id]?.scoreSum ?? 0 }))
          .filter(p => p.landingCount > 0)
          .sort((a, b) => b.landingCount - a.landingCount || b.scoreSum - a.scoreSum)
          .slice(0, 25)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading font-bold text-2xl text-[#E8ECF8] mb-6">Leaderboard</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#111729] border border-[#1E2740] rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <Link
            key={t.key}
            href={`/leaderboard?tab=${t.key}`}
            className={`flex-1 text-center py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-[#1E2740] text-[#E8ECF8]'
                : 'text-[#8A94B0] hover:text-[#E8ECF8]'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#8A94B0]">No data yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <Link
              key={row.id}
              href={`/u/${row.handle}`}
              className="flex items-center gap-4 bg-[#111729] border border-[#1E2740] rounded-xl px-4 py-3 hover:border-[#FF6B2C]/40 transition-all"
            >
              {/* Rank number */}
              <span
                className={`font-mono text-sm font-bold w-6 text-center shrink-0 ${
                  i === 0 ? 'text-[#F5C542]' : i === 1 ? 'text-[#C0C8D0]' : i === 2 ? 'text-[#CD7F32]' : 'text-[#8A94B0]'
                }`}
              >
                {i + 1}
              </span>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#1E2740] border border-[#FF6B2C]/20 flex items-center justify-center text-xs font-bold text-[#E8ECF8] shrink-0">
                {row.handle[0].toUpperCase()}
              </div>

              {/* Name + rank */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#E8ECF8] truncate">{row.display_name}</p>
                <p className="text-xs text-[#8A94B0]">@{row.handle} · {rankLabel(row.reputation)}</p>
              </div>

              {/* Metric */}
              <div className="text-right shrink-0">
                {tab === 'score' && (
                  <p className="font-mono font-bold text-[#F5C542]">{row.reputation} rep</p>
                )}
                {tab === 'fuel' && (
                  <p className="font-mono font-bold text-[#F5C542]">{row.fuel.toLocaleString()} ⛽</p>
                )}
                {tab === 'landings' && (
                  <>
                    <p className="font-mono font-bold text-[#3DDC97]">{row.landingCount} landed</p>
                    <p className="text-xs font-mono text-[#8A94B0]">{row.scoreSum} pts</p>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
