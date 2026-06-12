import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | SPACE Y?',
  description: 'Every great thing started as a ridiculous question. SPACE Y? is where ridiculous questions get rigorous answers.',
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Launch a Why',
    body: 'Post any question that starts with "Why". The more absurd, the better. Your question gets an orbit based on its absurdity score.',
  },
  {
    step: '02',
    title: 'Engineer a Mission',
    body: 'Crew members propose rigorous solutions. Each mission gets a Rigor score from votes. The formula: Absurdity × Rigor = Score.',
  },
  {
    step: '03',
    title: 'Stake Fuel',
    body: 'Bet play-money Fuel on whether a mission will actually land. Parimutuel market, 2% burn. Winners split the losers\' pool.',
  },
  {
    step: '04',
    title: 'Land it for real',
    body: 'Build the solution in the real world. Submit proof. Moderators verify. Approved landings triple the score and pay out the market.',
  },
]

const FAQ = [
  {
    q: 'What counts as a valid question?',
    a: 'It must start with "Why" and be answerable in principle. "Why is water wet?" works. "Best pizza in town?" doesn\'t.',
  },
  {
    q: 'What is Fuel? Can I cash out?',
    a: 'Play money. No purchase, no payout, no real-money value. It exists for bragging rights and leaderboards.',
  },
  {
    q: 'Are pledges binding?',
    a: "No. They're public statements of intent. We never hold or move money. Settle directly with the builder.",
  },
  {
    q: 'Who decides if a landing is real?',
    a: 'Moderators verify proof (video, photos, repo, press). Fake proofs get removed and cost reputation.',
  },
  {
    q: 'Can I post dangerous solutions?',
    a: "No. No real-world harm, nothing illegal, no instructions that hurt people. See /rules.",
  },
  {
    q: 'Why English only?',
    a: 'The pun only works in English. More languages later.',
  },
  {
    q: 'Is this affiliated with SpaceX?',
    a: 'No. They solve How. We solve Why.',
  },
  {
    q: 'Who builds this?',
    a: 'Indie-built in the EU. Data lives in Frankfurt.',
  },
]

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Manifesto */}
      <section className="mb-16 text-center">
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-[#E8EDF4] mb-6 leading-tight">
          Every great thing started<br /> as a ridiculous question.
        </h1>
        <p className="text-lg text-[#8A94B0] leading-relaxed max-w-xl mx-auto mb-8">
          SPACE Y? is where ridiculous questions get rigorous answers.
          Ask Why. Engineer the answer. Make it real.
          The more absurd the question and the more airtight the solution,
          the higher you fly.
        </p>
        <Link
          href="/launch"
          className="inline-flex bg-[#2BE36C] hover:bg-[#5AF093] text-[#04110A] font-semibold px-8 py-3 rounded-xl text-lg transition-colors"
        >
          Launch a Why
        </Link>
      </section>

      {/* How it works */}
      <section className="mb-16">
        <h2 className="font-heading font-bold text-2xl text-[#E8EDF4] mb-8">How it works</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {HOW_IT_WORKS.map(item => (
            <div key={item.step} className="bg-[#0E141B] border border-[#1B2531] rounded-xl p-5">
              <p className="font-mono text-[#2BE36C] text-sm font-bold mb-2">{item.step}</p>
              <h3 className="font-heading font-semibold text-[#E8EDF4] text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-[#8A94B0] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Orbit system */}
      <section className="mb-16">
        <h2 className="font-heading font-bold text-2xl text-[#E8EDF4] mb-4">The Orbit System</h2>
        <p className="text-[#8A94B0] mb-4">
          Questions orbit based on their Absurdity score, set by crew votes after 5 votes.
          The higher the orbit, the more ridiculous the question.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'LEO', color: '#5AC8FF', desc: 'Barely weird' },
            { label: 'GEO', color: '#2BE36C', desc: 'Getting strange' },
            { label: 'MOON', color: '#F5C542', desc: 'Properly odd' },
            { label: 'MARS', color: '#2BE36C', desc: 'Gloriously unhinged' },
            { label: 'DEEP', color: '#FF5470', desc: 'Cosmic absurdity' },
          ].map(orbit => (
            <div key={orbit.label} className="text-center">
              <div
                className="text-xs font-mono font-bold px-2 py-1 rounded-full border mb-1 mx-auto w-fit"
                style={{ color: orbit.color, borderColor: `${orbit.color}40` }}
              >
                {orbit.label}
              </div>
              <p className="text-xs text-[#8A94B0]">{orbit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="font-heading font-bold text-2xl text-[#E8EDF4] mb-6">FAQ</h2>
        <div className="space-y-4">
          {FAQ.map(item => (
            <div key={item.q} className="bg-[#0E141B] border border-[#1B2531] rounded-xl p-5">
              <p className="font-semibold text-[#E8EDF4] mb-2">{item.q}</p>
              <p className="text-sm text-[#8A94B0] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/rules" className="text-sm text-[#5AC8FF] hover:underline">
            Read the full rules
          </Link>
        </div>
      </section>
    </div>
  )
}
