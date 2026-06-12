import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/Logo'

export const metadata = {
  title: 'SPACE Y? — Absurd Questions, Rigorous Answers',
}

export default async function HomePage() {
  let questions: Array<{
    id: string
    slug: string
    title: string
    orbit: string
    absurdity: number | null
    vote_count: number
    status: string
    created_at: string
  }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('questions')
      .select('id, slug, title, orbit, absurdity, vote_count, status, created_at')
      .neq('status', 'removed')
      .order('created_at', { ascending: false })
      .limit(20)
    questions = data ?? []
  } catch {
    // DB not connected yet — show hero
  }

  const orbitColors: Record<string, string> = {
    leo: '#8A94B0',
    geo: '#4D9FFF',
    moon: '#E8ECF8',
    mars: '#FF6B2C',
    deep_space: '#F5C542',
  }

  const orbitLabels: Record<string, string> = {
    leo: 'Everyday strange',
    geo: 'Properly weird',
    moon: 'Absurd',
    mars: 'Gloriously absurd',
    deep_space: 'Civilizational',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {questions.length === 0 ? (
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
        <div className="space-y-3">
          {questions.map(q => (
            <Link
              key={q.id}
              href={`/q/${q.slug}`}
              className="block bg-[#111729] border border-[#1E2740] rounded-xl p-4 hover:border-[#FF6B2C]/40 hover:shadow-lg hover:shadow-[#FF6B2C]/5 transition-all"
            >
              <div className="flex items-start gap-3">
                <span
                  className="shrink-0 text-xs px-2 py-0.5 rounded-full border font-mono mt-0.5"
                  style={{
                    color: orbitColors[q.orbit] ?? '#8A94B0',
                    borderColor: `${orbitColors[q.orbit] ?? '#8A94B0'}40`,
                    backgroundColor: `${orbitColors[q.orbit] ?? '#8A94B0'}10`,
                  }}
                >
                  {q.orbit.replace('_', ' ').toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[#E8ECF8] font-medium leading-snug">{q.title}</h2>
                  <p className="text-xs text-[#8A94B0] mt-1">
                    {orbitLabels[q.orbit]}
                    {q.absurdity != null && (
                      <span className="ml-2 font-mono text-[#F5C542]">
                        {q.absurdity.toFixed(1)} absurdity
                      </span>
                    )}
                    {q.absurdity == null && q.vote_count < 5 && (
                      <span className="ml-2 text-[#8A94B0]">calibrating…</span>
                    )}
                  </p>
                </div>
                {q.status === 'landed' && (
                  <span className="shrink-0 text-[#F5C542] text-xs font-semibold border border-[#F5C542]/40 rounded-full px-2 py-0.5">
                    LANDED
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
