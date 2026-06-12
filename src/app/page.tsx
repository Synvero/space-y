import { createClient } from '@/lib/supabase/server'
import { QuestionCard } from '@/components/QuestionCard'
import { FeedTabs } from '@/components/FeedTabs'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import type { Orbit } from '@/lib/scoring'

export const metadata = {
  title: 'SPACE Y? — Absurd Questions, Rigorous Answers',
}

const ORBITS = ['leo', 'geo', 'moon', 'mars', 'deep_space']

interface PageProps {
  searchParams: Promise<{ tab?: string; orbit?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const { tab = 'hot', orbit } = await searchParams

  let questions: Array<{
    id: string
    slug: string
    title: string
    orbit: Orbit | string
    absurdity: number | null
    vote_count: number
    status: string
    created_at: string
  }> = []

  try {
    const supabase = await createClient()
    let query = supabase
      .from('questions')
      .select('id, slug, title, orbit, absurdity, vote_count, status, created_at')
      .neq('status', 'removed')

    if (orbit && ORBITS.includes(orbit)) {
      query = query.eq('orbit', orbit)
    }
    if (tab === 'landed') {
      query = query.eq('status', 'landed')
    }
    if (tab === 'top') {
      query = query.order('vote_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data } = await query.limit(40)
    questions = data ?? []
  } catch {
    // no env set yet
  }

  const isEmpty = questions.length === 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {isEmpty && !process.env.NEXT_PUBLIC_SUPABASE_URL ? (
        // Hero when no DB is connected
        <div className="text-center py-20">
          <Logo size="lg" />
          <p className="mt-6 text-[#8A94B0] text-lg max-w-xl mx-auto leading-relaxed">
            Every great thing started as a ridiculous question.
            Ask Why. Engineer the answer. Make it real.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/launch"
              className="cta-glow bg-[#2BE36C] hover:bg-[#5AF093] text-[#04110A] font-semibold px-8 py-3 text-base rounded-lg transition-colors"
            >
              Launch a Why
            </Link>
            <Link
              href="/about"
              className="border border-[#1B2531] text-[#E8EDF4] hover:bg-[#1B2531] px-8 py-3 text-base rounded-lg transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Hero strip */}
          <div className="text-center pt-2 pb-9">
            <h1 className="font-heading text-[1.9rem] sm:text-[2.6rem] font-bold leading-[1.05] tracking-tight">
              <span
                style={{
                  backgroundImage: 'linear-gradient(180deg,#FFFFFF,#AEB9C9)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Ask the absurd.
              </span>{' '}
              <span className="text-[#2BE36C] text-glow-green">Engineer the answer.</span>
            </h1>
            <p className="mt-3 text-[#8A94B0] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              SpaceX solves How. <span className="text-[#E8EDF4] font-medium">SPACE&nbsp;Y?</span> solves Why.
              The more absurd the question and the more airtight the solution, the higher you fly.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link
                href="/launch"
                className="cta-glow inline-flex items-center bg-[#2BE36C] hover:bg-[#5AF093] text-[#04110A] font-semibold rounded-lg px-5 py-2.5 text-sm"
              >
                Launch a Why
              </Link>
              <Link
                href="/about"
                className="border border-[#1B2531] text-[#8A94B0] hover:text-[#E8EDF4] rounded-lg px-5 py-2.5 text-sm transition-colors"
              >
                How it works
              </Link>
            </div>
            <div className="hairline mt-8 max-w-xs mx-auto" />
          </div>
          <FeedTabs activeTab={tab} activeOrbit={orbit} />
          {questions.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-mono text-[#1B2531] text-5xl font-bold mb-4" aria-hidden="true">
                ✦
              </p>
              <p className="text-[#E8EDF4] font-medium mb-1">No launches yet</p>
              <p className="text-[#8A94B0] text-sm mb-6">Be the first to ask Why.</p>
              <Link
                href="/launch"
                className="inline-block cta-glow bg-[#2BE36C] hover:bg-[#5AF093] text-[#04110A] font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Launch a Why
              </Link>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {questions.map(q => (
                <QuestionCard
                  key={q.id}
                  slug={q.slug}
                  title={q.title}
                  orbit={q.orbit}
                  absurdity={q.absurdity}
                  voteCount={q.vote_count}
                  status={q.status}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
