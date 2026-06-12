import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminActions } from '@/components/AdminActions'

export const metadata = { title: 'Admin | SPACE Y?' }

export default async function AdminPage() {
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

  const [{ data: openMarkets }, { data: claimedMissions }] = await Promise.all([
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
  ])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-heading font-bold text-2xl text-[#E8ECF8]">Admin</h1>
        <span className="text-xs font-mono text-[#FF6B2C] border border-[#FF6B2C]/40 rounded-full px-2 py-0.5">
          {profile.role.toUpperCase()}
        </span>
      </div>

      {/* Landing queue */}
      <section className="mb-8">
        <h2 className="font-heading font-semibold text-[#E8ECF8] mb-3">
          Landing Queue ({claimedMissions?.length ?? 0})
        </h2>
        {!claimedMissions || claimedMissions.length === 0 ? (
          <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-6 text-center">
            <p className="text-[#8A94B0] text-sm">No landing claims pending.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claimedMissions.map(m => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mission = m as any
              return (
                <div key={m.id} className="bg-[#111729] border border-[#F5C542]/30 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#E8ECF8] truncate">{m.title}</p>
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
                      className="text-xs text-[#4D9FFF] hover:underline break-all block mb-3"
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

      {/* Open markets */}
      <section>
        <h2 className="font-heading font-semibold text-[#E8ECF8] mb-3">
          Open Markets ({openMarkets?.length ?? 0})
        </h2>
        {!openMarkets || openMarkets.length === 0 ? (
          <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-6 text-center">
            <p className="text-[#8A94B0] text-sm">No open markets.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {openMarkets.map(market => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const m = market as any
              const hasLandedMission = m.question?.status === 'landed'
              return (
                <div key={market.id} className="bg-[#111729] border border-[#1E2740] rounded-xl p-4">
                  <p className="text-sm text-[#E8ECF8] mb-1">{market.question_text}</p>
                  <p className="text-xs text-[#8A94B0] mb-3">
                    Expires {new Date(market.resolves_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {hasLandedMission && (
                      <span className="ml-2 text-[#3DDC97]">· Mission landed</span>
                    )}
                  </p>
                  <AdminActions marketId={market.id} type="market" />
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
