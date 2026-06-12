export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminActions } from '@/components/AdminActions'

export const metadata = { title: 'Admin | SPACE Y?' }

interface AdminPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { tab = 'landings' } = await searchParams

  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect('/auth/login')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['mod', 'admin'].includes(profile.role)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-[#FF5470] font-mono text-lg">ACCESS DENIED</p>
        <p className="text-[#8A94B0] text-sm mt-2">You need mod or admin role.</p>
      </div>
    )
  }

  const [{ data: openMarkets }, { data: claimedMissions }, { data: openReports }] = await Promise.all([
    supabase
      .from('markets')
      .select(`
        id, question_text, status, resolves_at,
        question:questions!question_id(id, slug, title, status)
      `)
      .eq('status', 'open')
      .order('resolves_at', { ascending: true })
      .limit(50),
    supabase
      .from('missions')
      .select(`
        id, title, proof_url, proof_note, score, rigor, vote_count,
        author:profiles!author_id(handle),
        question:questions!question_id(slug, title)
      `)
      .eq('status', 'landing_claimed')
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('reports')
      .select(`
        id, target_type, target_id, reason, created_at,
        reporter:profiles!reporter_id(handle)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: true })
      .limit(100),
  ])

  const tabs = [
    { key: 'landings', label: 'Landings', count: claimedMissions?.length ?? 0 },
    { key: 'markets', label: 'Markets', count: openMarkets?.length ?? 0 },
    { key: 'reports', label: 'Reports', count: openReports?.length ?? 0 },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-heading font-bold text-2xl text-[#E8EDF4]">Admin</h1>
        <span className="text-xs font-mono text-[#2BE36C] border border-[#2BE36C]/40 rounded-full px-2 py-0.5">
          {profile.role.toUpperCase()}
        </span>
      </div>

      {/* Tab nav */}
      <div className="flex gap-0 mb-6 border-b border-[#1B2531] overflow-x-auto">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t.key
                ? 'text-[#E8EDF4] border-[#2BE36C]'
                : 'text-[#8A94B0] border-transparent hover:text-[#E8EDF4]'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs bg-[#1B2531] text-[#8A94B0] rounded-full px-1.5 py-0.5">
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Landings tab */}
      {tab === 'landings' && (
        <section>
          <h2 className="font-heading font-semibold text-[#E8EDF4] mb-3">
            Landing Queue ({claimedMissions?.length ?? 0})
          </h2>
          {!claimedMissions || claimedMissions.length === 0 ? (
            <div className="bg-[#0E141B] border border-[#1B2531] rounded-xl p-6 text-center">
              <p className="text-[#8A94B0] text-sm">No landing claims pending.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claimedMissions.map(m => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mission = m as any
                return (
                  <div key={m.id} className="bg-[#0E141B] border border-[#F5C542]/30 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#E8EDF4] truncate">{m.title}</p>
                        <p className="text-xs text-[#8A94B0]">
                          by @{mission.author?.handle ?? '?'} · {mission.question?.title ?? '?'}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-[#F5C542] shrink-0">
                        {m.vote_count >= 5 ? `${m.score} pts` : 'calibrating'}
                      </span>
                    </div>
                    {m.proof_note && (
                      <p className="text-xs text-[#8A94B0] mb-2 italic">{m.proof_note}</p>
                    )}
                    {m.proof_url && (
                      <a
                        href={m.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#5AC8FF] hover:underline break-all block mb-3"
                      >
                        {m.proof_url}
                      </a>
                    )}
                    <AdminActions missionId={m.id} type="landing" />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Markets tab */}
      {tab === 'markets' && (
        <section>
          <h2 className="font-heading font-semibold text-[#E8EDF4] mb-3">
            Open Markets ({openMarkets?.length ?? 0})
          </h2>
          {!openMarkets || openMarkets.length === 0 ? (
            <div className="bg-[#0E141B] border border-[#1B2531] rounded-xl p-6 text-center">
              <p className="text-[#8A94B0] text-sm">No open markets.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {openMarkets.map(market => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const m = market as any
                const hasLandedMission = m.question?.status === 'landed'
                return (
                  <div key={market.id} className="bg-[#0E141B] border border-[#1B2531] rounded-xl p-4">
                    <p className="text-sm text-[#E8EDF4] mb-1">{market.question_text}</p>
                    <p className="text-xs text-[#8A94B0] mb-3">
                      Expires {new Date(market.resolves_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {hasLandedMission && (
                        <span className="ml-2 text-[#2BE36C]">· Mission landed</span>
                      )}
                    </p>
                    <AdminActions marketId={market.id} type="market" />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <section>
          <h2 className="font-heading font-semibold text-[#E8EDF4] mb-3">
            Open Reports ({openReports?.length ?? 0})
          </h2>
          {!openReports || openReports.length === 0 ? (
            <div className="bg-[#0E141B] border border-[#1B2531] rounded-xl p-6 text-center">
              <p className="text-[#8A94B0] text-sm">No open reports.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openReports.map(r => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const report = r as any
                return (
                  <div key={r.id} className="bg-[#0E141B] border border-[#FF5470]/30 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-xs font-mono font-bold text-[#FF5470] border border-[#FF5470]/40 rounded-full px-2 py-0.5 shrink-0 mt-0.5">
                        {(r.target_type as string).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#E8EDF4] leading-relaxed">{r.reason}</p>
                        <p className="text-xs text-[#8A94B0] mt-1">
                          by @{report.reporter?.handle ?? '?'} · {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-[#8A94B0]/60 font-mono mt-0.5 truncate">
                          id: {r.target_id}
                        </p>
                      </div>
                    </div>
                    <AdminActions
                      type="report"
                      reportId={r.id}
                      targetType={r.target_type}
                      targetId={r.target_id}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
