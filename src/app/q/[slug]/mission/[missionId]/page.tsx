import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ScoreDial } from '@/components/ScoreDial'
import { VoteScale } from '@/components/VoteScale'
import { ProofModal } from '@/components/ProofModal'

interface PageProps {
  params: Promise<{ slug: string; missionId: string }>
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  proposed:        { label: 'Proposed',         color: '#8A94B0' },
  building:        { label: 'Building',          color: '#4D9FFF' },
  landing_claimed: { label: 'Landing Claimed',   color: '#F5C542' },
  landed:          { label: 'Landed',            color: '#3DDC97' },
}

export default async function MissionPage({ params }: PageProps) {
  const { slug, missionId } = await params
  const supabase = await createClient()

  const [{ data: mission }, { data: { user } }] = await Promise.all([
    supabase
      .from('missions')
      .select(`
        id, title, body, rigor, vote_count, score, status, proof_url, proof_note, landed_at, created_at,
        author:profiles!author_id(id, handle, display_name),
        question:questions!question_id(id, slug, title, absurdity, orbit)
      `)
      .eq('id', missionId)
      .neq('status', 'removed')
      .single(),
    supabase.auth.getUser(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = mission as any
  if (!m) notFound()

  const author = m.author as { id: string; handle: string; display_name: string } | null
  const question = m.question as { id: string; slug: string; title: string; absurdity: number | null; orbit: string }
  if (!question || question.slug !== slug) notFound()

  const statusMeta = STATUS_META[m.status] ?? STATUS_META.proposed
  const isLanded = m.status === 'landed'
  const isOwner = !!user && author?.id === user.id
  const canClaim = isOwner && (m.status === 'proposed' || m.status === 'building')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#8A94B0] mb-6">
        <Link href="/" className="hover:text-[#E8ECF8]">Feed</Link>
        <span>/</span>
        <Link href={`/q/${question.slug}`} className="hover:text-[#E8ECF8] truncate max-w-xs">
          {question.title}
        </Link>
        <span>/</span>
        <span className="text-[#E8ECF8] truncate max-w-xs">{m.title}</span>
      </div>

      {/* Status + Score */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="text-xs font-mono font-bold border rounded-full px-2 py-0.5"
              style={{ color: statusMeta.color, borderColor: `${statusMeta.color}40` }}
            >
              {statusMeta.label.toUpperCase()}
            </span>
            {isLanded && (
              <span className="text-xs text-[#3DDC97]">
                Landed {m.landed_at ? new Date(m.landed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </span>
            )}
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#E8ECF8] leading-snug">
            {m.title}
          </h1>
          {author && (
            <p className="mt-1 text-sm text-[#8A94B0]">
              by{' '}
              <Link href={`/u/${author.handle}`} className="text-[#4D9FFF] hover:text-[#E8ECF8]">
                @{author.handle}
              </Link>
            </p>
          )}
        </div>
        <div className="relative shrink-0">
          {isLanded && (
            <div
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{ boxShadow: '0 0 0 2px #F5C542, 0 0 12px #F5C54240' }}
            />
          )}
          <ScoreDial
            score={m.vote_count >= 5 ? m.score : null}
            voteCount={m.vote_count}
            size="lg"
          />
          {isLanded && (
            <span
              className="absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: '#F5C542', color: '#0A0E1A' }}
            >
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-6 mb-6 prose-custom">
        <div className="text-[#E8ECF8] text-sm leading-relaxed whitespace-pre-wrap">
          {m.body}
        </div>
      </div>

      {/* Claim Landing (author-only, eligible status) */}
      {canClaim && (
        <div className="flex items-center justify-between gap-4 bg-[#111729] border border-[#3DDC9740] rounded-xl p-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-[#E8ECF8]">Ready to claim landing?</p>
            <p className="text-xs text-[#8A94B0] mt-0.5">
              Built and verified this in the real world? Submit proof — mods review and your score goes ×3.
            </p>
          </div>
          <ProofModal missionId={m.id} />
        </div>
      )}

      {/* Landing proof */}
      {isLanded && m.proof_url && (
        <div className="bg-[#3DDC9710] border border-[#3DDC9740] rounded-xl p-4 mb-6">
          <p className="text-xs text-[#3DDC97] font-mono mb-1">LANDING PROOF</p>
          {m.proof_note && (
            <p className="text-sm text-[#E8ECF8] mb-2">{m.proof_note}</p>
          )}
          <a
            href={m.proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#4D9FFF] hover:underline break-all"
          >
            {m.proof_url}
          </a>
        </div>
      )}

      {/* Vote rigor */}
      <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-[#E8ECF8] mb-3">
          How rigorous is this solution?
        </p>
        <VoteScale
          targetType="mission"
          targetId={m.id}
          dimension="rigor"
          voteCount={m.vote_count}
        />
      </div>

      {/* Back link */}
      <Link
        href={`/q/${question.slug}`}
        className="text-sm text-[#8A94B0] hover:text-[#E8ECF8] transition-colors"
      >
        ← Back to question
      </Link>
    </div>
  )
}
