import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rules | SPACE Y?',
}

const RULES = [
  {
    number: '1',
    title: 'Every thread roots in a Why.',
    body: 'Questions must start with "Why" and be answerable in principle. Rants, reviews, and "what\'s the best X?" belong elsewhere. The constraint is the point: it forces you to think before you post.',
  },
  {
    number: '2',
    title: 'No real-world harm.',
    body: 'Nothing illegal. No dangerous instructions. Nothing targeted at specific people. Absurd ≠ destructive. "Why do buildings fall?" is fine. Instructions for making them fall are not. Violations are removed and cost reputation.',
  },
  {
    number: '3',
    title: 'Absurd ≠ cruel.',
    body: 'Ridiculous and rigorous, not mean-spirited. Questions that punch at people, groups, or identities — instead of ideas or phenomena — are removed. Make the universe the butt of the joke, not each other.',
  },
  {
    number: '4',
    title: 'Mark speculation as speculation. Landings need proof.',
    body: 'If your mission is a thought experiment, say so. If you\'re claiming a landing, submit real evidence: video, photos, a repo, a press link. Moderators verify. Fake landings lose rep and are removed. The credibility of every landing depends on this.',
  },
]

export default function RulesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="font-heading font-bold text-3xl text-[#E8ECF8] mb-3">House Rules</h1>
        <p className="text-[#8A94B0]">
          Four rules. Everything else is judgment and context.
        </p>
      </div>

      <div className="space-y-4 mb-10">
        {RULES.map(rule => (
          <div key={rule.number} className="bg-[#111729] border border-[#1E2740] rounded-xl p-6">
            <div className="flex items-start gap-4">
              <span className="font-mono text-[#FF6B2C] text-2xl font-bold shrink-0 leading-none mt-0.5">
                {rule.number}
              </span>
              <div>
                <h2 className="font-heading font-semibold text-[#E8ECF8] text-lg mb-2">
                  {rule.title}
                </h2>
                <p className="text-sm text-[#8A94B0] leading-relaxed">{rule.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#FF5470]/10 border border-[#FF5470]/30 rounded-xl p-5 mb-8">
        <p className="text-sm text-[#E8ECF8] font-medium mb-1">Report a violation</p>
        <p className="text-sm text-[#8A94B0]">
          See something that breaks these rules? Use the Report button on any question, mission, or comment.
          Moderators review every report.
        </p>
      </div>

      <div className="text-center">
        <Link href="/about" className="text-sm text-[#4D9FFF] hover:underline">
          Back to About
        </Link>
      </div>
    </div>
  )
}
