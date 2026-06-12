import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OrbitBadge } from '@/components/OrbitBadge'
import { rankLabel } from '@/lib/scoring'
import type { Orbit } from '@/lib/scoring'

interface PageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params
  return { title: `@${handle} | SPACE Y?` }
}

export default async function ProfilePage({ params }: PageProps) {
  const { handle } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name, bio, fuel, reputation, role, created_at')
    .eq('handle', handle)
    .single()

  if (!profile) notFound()

  const [{ data: questions }, { data: missions }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, slug, title, orbit, absurdity, vote_count, status')
      .eq('author_id', profile.id)
      .neq('status', 'removed')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('missions')
      .select(`
        id, title, score, status, vote_count,
        question:questions!question_id(slug, title)
      `)
      .eq('author_id', profile.id)
      .neq('status', 'removed')
      .order('score', { ascending: false })
      .limit(10),
  ])

  const rank = rankLabel(profile.reputation)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1E2740] border-2 border-[#FF6B2C]/40 flex items-center justify-center text-2xl font-bold text-[#E8ECF8] shrink-0">
            {handle[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-xl text-[#E8ECF8]">
              {profile.display_name}
            </h1>
            <p className="text-[#8A94B0] text-sm">@{profile.handle}</p>
            {profile.bio && (
              <p className="mt-2 text-sm text-[#8A94B0]">{profile.bio}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-[#F5C542] text-lg font-bold">{profile.fuel.toLocaleString()}</div>
            <div className="text-xs text-[#8A94B0]">⛽ Fuel</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#1E2740]">
          <div className="text-center">
            <div className="font-mono text-[#E8ECF8] font-bold text-lg">{profile.reputation}</div>
            <div className="text-xs text-[#8A94B0]">Reputation</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[#4D9FFF] font-bold text-lg">{rank}</div>
            <div className="text-xs text-[#8A94B0]">Rank</div>
          </div>
          <div className="text-center sm:block hidden">
            <div className="text-xs text-[#8A94B0] pt-1">
              Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Launches */}
      {questions && questions.length > 0 && (
        <section className="mb-6">
          <h2 className="font-heading font-semibold text-[#E8ECF8] mb-3">Launches ({questions.length})</h2>
          <div className="space-y-2">
            {questions.map(q => (
              <Link
                key={q.id}
                href={`/q/${q.slug}`}
                className="flex items-center gap-3 bg-[#111729] border border-[#1E2740] rounded-xl p-3 hover:border-[#FF6B2C]/40 transition-all"
              >
                <OrbitBadge orbit={q.orbit as Orbit} size="sm" />
                <span className="flex-1 text-sm text-[#E8ECF8] truncate">{q.title}</span>
                {q.status === 'landed' && (
                  <span className="text-[10px] text-[#F5C542] font-mono border border-[#F5C54240] rounded-full px-2 py-0.5">LANDED</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Missions */}
      {missions && missions.length > 0 && (
        <section>
          <h2 className="font-heading font-semibold text-[#E8ECF8] mb-3">Missions ({missions.length})</h2>
          <div className="space-y-2">
            {missions.map(m => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const q = (m as any).question as { slug: string; title: string } | null
              return (
                <Link
                  key={m.id}
                  href={q ? `/q/${q.slug}/mission/${m.id}` : '#'}
                  className="flex items-center gap-3 bg-[#111729] border border-[#1E2740] rounded-xl p-3 hover:border-[#FF6B2C]/40 transition-all"
                >
                  <div
                    className="shrink-0 font-mono text-sm font-bold w-10 text-center"
                    style={{ color: m.status === 'landed' ? '#3DDC97' : '#F5C542' }}
                  >
                    {m.vote_count >= 5 ? m.score : '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#E8ECF8] truncate">{m.title}</p>
                    {q && <p className="text-xs text-[#8A94B0] truncate">{q.title}</p>}
                  </div>
                  {m.status === 'landed' && (
                    <span className="text-[10px] text-[#3DDC97] font-mono border border-[#3DDC9740] rounded-full px-2 py-0.5">LANDED</span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {(!questions || questions.length === 0) && (!missions || missions.length === 0) && (
        <div className="text-center py-12">
          <p className="text-[#8A94B0]">No launches or missions yet.</p>
        </div>
      )}
    </div>
  )
}
