import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OrbitBadge } from '@/components/OrbitBadge'
import { ScoreDial } from '@/components/ScoreDial'
import { VoteScale } from '@/components/VoteScale'
import { MissionCard } from '@/components/MissionCard'
import { MarketWidget } from '@/components/MarketWidget'
import { PledgeBoard } from '@/components/PledgeBoard'
import { ReportButton } from '@/components/ReportButton'
import { CommentForm } from '@/components/CommentForm'
import type { Orbit } from '@/lib/scoring'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: q } = await supabase
    .from('questions')
    .select('title, orbit, absurdity, vote_count')
    .eq('slug', slug)
    .single()

  const title = q?.title ?? slug.replace(/-/g, ' ')
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const ogParams = new URLSearchParams({ title, orbit: q?.orbit ?? 'leo' })
  if (q?.absurdity != null && q?.vote_count >= 5) {
    ogParams.set('score', String(Math.round(q.absurdity * 10)))
  }
  const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`

  return {
    title,
    openGraph: {
      title,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      images: [ogImageUrl],
    },
  }
}

export default async function QuestionPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: question } = await supabase
    .from('questions')
    .select(`
      id, slug, title, body, orbit, absurdity, vote_count, status, tags, created_at,
      author:profiles!author_id(id, handle, display_name)
    `)
    .eq('slug', slug)
    .neq('status', 'removed')
    .single()

  if (!question) notFound()

  const [{ data: missions }, { data: market }, { data: comments }, { data: pledges }, { data: { user } }] = await Promise.all([
    supabase
      .from('missions')
      .select(`
        id, title, rigor, vote_count, score, status, created_at,
        author:profiles!author_id(id, handle, display_name)
      `)
      .eq('question_id', question.id)
      .neq('status', 'removed')
      .order('score', { ascending: false }),
    supabase
      .from('markets')
      .select('id, question_text, status, resolves_at, outcome, question_id')
      .eq('question_id', question.id)
      .single(),
    supabase
      .from('comments')
      .select(`
        id, body, created_at,
        author:profiles!author_id(handle, display_name)
      `)
      .eq('target_type', 'question')
      .eq('target_id', question.id)
      .eq('status', 'visible')
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('pledges')
      .select(`
        id, amount_eur, message, created_at, user_id,
        user:profiles!user_id(handle, display_name)
      `)
      .eq('target_type', 'question')
      .eq('target_id', question.id)
      .eq('status', 'pledged')
      .order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  const author = question.author as unknown as { id: string; handle: string; display_name: string } | null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <OrbitBadge orbit={question.orbit as Orbit} />
          {question.status === 'landed' && (
            <span className="text-xs font-mono font-bold text-[#F5C542] border border-[#F5C54240] rounded-full px-2 py-0.5">
              LANDED
            </span>
          )}
        </div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#E8ECF8] leading-snug mb-2">
          {question.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-[#8A94B0]">
          {author && (
            <Link href={`/u/${author.handle}`} className="hover:text-[#E8ECF8] transition-colors">
              @{author.handle}
            </Link>
          )}
          <span>{new Date(question.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <ReportButton targetType="question" targetId={question.id} />
        </div>

        {question.body && (
          <p className="mt-4 text-[#8A94B0] leading-relaxed whitespace-pre-wrap">{question.body}</p>
        )}

        {question.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(question.tags as string[]).map((tag: string) => (
              <span key={tag} className="text-xs text-[#8A94B0] bg-[#1E2740] rounded px-2 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Vote absurdity */}
      <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#E8ECF8]">How absurd is this question?</span>
          <ScoreDial
            score={question.absurdity != null ? Math.round(question.absurdity * 10) : null}
            voteCount={question.vote_count}
            size="sm"
            label="absurdity"
          />
        </div>
        <VoteScale
          targetType="question"
          targetId={question.id}
          dimension="absurdity"
          voteCount={question.vote_count}
        />
      </div>

      {/* Market */}
      {market && (
        <div className="mb-6">
          <MarketWidget
            marketId={market.id}
            questionText={market.question_text}
            status={market.status}
            resolvesAt={market.resolves_at}
            outcome={market.outcome ?? null}
          />
        </div>
      )}

      {/* Pledge Board */}
      <div className="mb-6">
        <PledgeBoard
          targetType="question"
          targetId={question.id}
          initialPledges={(pledges ?? []) as any}
          currentUserId={user?.id ?? null}
        />
      </div>

      {/* Missions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-lg text-[#E8ECF8]">
            Missions ({missions?.length ?? 0})
          </h2>
          <Link
            href={`/q/${slug}/solve`}
            className="bg-[#FF6B2C] hover:bg-[#FF8A52] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Propose Solution
          </Link>
        </div>

        {(!missions || missions.length === 0) ? (
          <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-8 text-center">
            <p className="text-[#8A94B0]">No missions yet. Be the first to engineer an answer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map(m => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <MissionCard key={m.id} mission={m as any} questionSlug={slug} />
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div>
        <h3 className="text-sm font-medium text-[#8A94B0] mb-2">Comments</h3>
        {comments && comments.length > 0 && (
          <div className="space-y-2 mb-2">
            {comments.map(c => {
              const cAuthor = c.author as unknown as { handle: string; display_name: string } | null
              return (
                <div key={c.id} className="bg-[#111729] border border-[#1E2740] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Link href={`/u/${cAuthor?.handle}`} className="text-xs text-[#4D9FFF] hover:text-[#E8ECF8]">
                      @{cAuthor?.handle}
                    </Link>
                    <span className="text-xs text-[#8A94B0]">
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <ReportButton targetType="comment" targetId={c.id} />
                  </div>
                  <p className="text-sm text-[#E8ECF8]">{c.body}</p>
                </div>
              )
            })}
          </div>
        )}
        <CommentForm targetType="question" targetId={question.id} />
      </div>
    </div>
  )
}
