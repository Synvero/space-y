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
              className="bg-[#FF6B2C] hover:bg-[#FF8A52] text-white font-semibold px-8 py-3 text-base rounded-lg transition-colors"
            >
              Launch a Why
            </Link>
            <Link
              href="/about"
              className="border border-[#1E2740] text-[#E8ECF8] hover:bg-[#1E2740] px-8 py-3 text-base rounded-lg transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>
      ) : (
        <>
          <FeedTabs activeTab={tab} activeOrbit={orbit} />
          {questions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#8A94B0]">No questions in this orbit yet.</p>
              <Link
                href="/launch"
                className="mt-4 inline-block bg-[#FF6B2C] hover:bg-[#FF8A52] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Launch the first Why
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
