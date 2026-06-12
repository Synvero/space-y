import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckinButtonClient } from '@/components/CheckinButton'

export const metadata = { title: 'Hangar | SPACE Y?' }

const REASON_LABELS: Record<string, string> = {
  signup:        'Joined SPACE Y?',
  daily_checkin: 'Daily check-in',
  stake:         'Staked on market',
  payout:        'Market payout',
  refund:        'Market refund',
  score_bonus:   'Vote score bonus',
  landing_bonus: 'Landing bonus',
  admin_adjust:  'Admin adjustment',
}

export default async function HangarPage() {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect('/auth/login')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: ledger }, { data: activeStakes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('handle, display_name, fuel, reputation, last_checkin_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('fuel_ledger')
      .select('id, delta, reason, ref_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('stakes')
      .select(`
        id, side, amount, payout, created_at,
        market:markets!market_id(id, question_text, status, outcome,
          question:questions!question_id(slug))
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!profile) redirect('/auth/login')

  const checkedInToday = profile.last_checkin_at
    ? new Date(profile.last_checkin_at).toDateString() === new Date().toDateString()
    : false

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-heading font-bold text-2xl text-[#E8ECF8] mb-6">Hangar</h1>

      {/* Balance card */}
      <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8A94B0] mb-1">Fuel Balance</p>
            <p className="font-mono text-4xl font-bold text-[#F5C542]">
              {profile.fuel.toLocaleString()} ⛽
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#8A94B0] mb-1">Reputation</p>
            <p className="font-mono text-2xl font-bold text-[#E8ECF8]">
              {profile.reputation}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#1E2740]">
          {checkedInToday ? (
            <p className="text-xs text-[#3DDC97]">Checked in today. +25 ⛽ earned.</p>
          ) : (
            <CheckinButtonClient />
          )}
        </div>
      </div>

      {/* Active stakes */}
      {activeStakes && activeStakes.length > 0 && (
        <section className="mb-6">
          <h2 className="font-heading font-semibold text-[#E8ECF8] mb-3">Stakes</h2>
          <div className="space-y-2">
            {activeStakes.map(s => {
              const market = (s as unknown as {
                market: {
                  question_text: string
                  status: string
                  outcome: boolean | null
                  question: { slug: string } | null
                } | null
              }).market
              const isResolved = market?.status === 'resolved'
              const won = isResolved && market?.outcome === s.side
              return (
                <div
                  key={s.id}
                  className="bg-[#111729] border border-[#1E2740] rounded-xl p-3 flex items-center gap-3"
                >
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded border shrink-0 ${
                      s.side
                        ? 'text-[#3DDC97] border-[#3DDC97]/40'
                        : 'text-[#FF5470] border-[#FF5470]/40'
                    }`}
                  >
                    {s.side ? 'YES' : 'NO'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#E8ECF8] truncate">
                      {market?.question_text ?? 'Unknown market'}
                    </p>
                    {market?.question?.slug && (
                      <Link
                        href={`/q/${market.question.slug}`}
                        className="text-xs text-[#4D9FFF] hover:underline"
                      >
                        View question
                      </Link>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm text-[#F5C542]">{s.amount} ⛽</p>
                    {isResolved && (
                      <p className={`text-xs font-mono ${won ? 'text-[#3DDC97]' : 'text-[#FF5470]'}`}>
                        {won ? `+${(s.payout ?? 0) - s.amount}` : `−${s.amount}`}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Ledger history */}
      <section>
        <h2 className="font-heading font-semibold text-[#E8ECF8] mb-3">Fuel History</h2>
        {!ledger || ledger.length === 0 ? (
          <p className="text-sm text-[#8A94B0]">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-[#1E2740]">
            {ledger.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm text-[#E8ECF8]">{REASON_LABELS[entry.reason] ?? entry.reason}</p>
                  <p className="text-xs text-[#8A94B0]">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm font-bold ${
                    entry.delta > 0 ? 'text-[#3DDC97]' : 'text-[#FF5470]'
                  }`}
                >
                  {entry.delta > 0 ? '+' : ''}{entry.delta} ⛽
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
