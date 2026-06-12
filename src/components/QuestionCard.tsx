import Link from 'next/link'
import { OrbitBadge } from '@/components/OrbitBadge'
import { ScoreDial } from '@/components/ScoreDial'
import type { Orbit } from '@/lib/scoring'

interface QuestionCardProps {
  slug: string
  title: string
  orbit: Orbit | string
  absurdity: number | null
  voteCount: number
  status: string
  missionCount?: number
  pledgeSumEur?: number
  yesPool?: number
  noPool?: number
}

export function QuestionCard({
  slug,
  title,
  orbit,
  absurdity,
  voteCount,
  status,
  missionCount = 0,
  pledgeSumEur = 0,
  yesPool = 0,
  noPool = 0,
}: QuestionCardProps) {
  const totalPool = yesPool + noPool
  const yesPercent = totalPool > 0 ? Math.round((yesPool / totalPool) * 100) : 50
  const isLanded = status === 'landed'

  return (
    <Link
      href={`/q/${slug}`}
      className="block bg-[#0E141B] rounded-xl p-4 transition-all hover:shadow-lg group"
      style={{
        border: isLanded ? '1px solid #F5C54240' : '1px solid #1B2531',
        boxShadow: isLanded ? '0 0 12px #F5C54210' : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Score */}
        <ScoreDial
          score={absurdity != null && voteCount >= 5 ? Math.round(absurdity * 10) : null}
          voteCount={voteCount}
          size="sm"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <OrbitBadge orbit={orbit} size="sm" />
            {isLanded && (
              <span className="text-[10px] font-mono font-bold text-[#F5C542] border border-[#F5C54240] rounded-full px-2 py-0.5">
                LANDED
              </span>
            )}
          </div>
          <h2 className="text-[#E8EDF4] font-medium text-sm leading-snug group-hover:text-white transition-colors">
            {title}
          </h2>
          <div className="flex items-center gap-3 mt-2 text-xs text-[#8A94B0]">
            {missionCount > 0 && (
              <span>{missionCount} mission{missionCount !== 1 ? 's' : ''}</span>
            )}
            {pledgeSumEur > 0 && (
              <span className="text-[#2BE36C]">€{pledgeSumEur} pledged</span>
            )}
          </div>
        </div>
      </div>

      {/* Market mini-bar */}
      {totalPool > 0 && (
        <div className="mt-3 space-y-1">
          <div className="h-1.5 rounded-full overflow-hidden bg-[#FF5470]/20 flex">
            <div
              className="h-full rounded-l-full transition-all"
              style={{ width: `${yesPercent}%`, backgroundColor: '#5AC8FF' }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span style={{ color: '#5AC8FF' }}>{yesPercent}% YES</span>
            <span style={{ color: '#FF5470' }}>{100 - yesPercent}% NO</span>
          </div>
        </div>
      )}
    </Link>
  )
}
