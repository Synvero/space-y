import Link from 'next/link'
import { ScoreDial } from '@/components/ScoreDial'

interface Mission {
  id: string
  title: string
  rigor: number | null
  vote_count: number
  score: number
  status: string
  created_at: string
  author: { id: string; handle: string; display_name: string } | null
}

interface MissionCardProps {
  mission: Mission
  questionSlug: string
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  proposed:        { label: 'Proposed',         color: '#8A94B0' },
  building:        { label: 'Building',          color: '#4D9FFF' },
  landing_claimed: { label: 'Landing Claimed',   color: '#F5C542' },
  landed:          { label: 'Landed',            color: '#3DDC97' },
  removed:         { label: 'Removed',           color: '#FF5470' },
}

export function MissionCard({ mission, questionSlug }: MissionCardProps) {
  const statusMeta = STATUS_META[mission.status] ?? STATUS_META.proposed
  const author = mission.author as { id: string; handle: string; display_name: string } | null
  const isLanded = mission.status === 'landed'

  return (
    <Link
      href={`/q/${questionSlug}/mission/${mission.id}`}
      className="block bg-[#111729] rounded-xl p-4 transition-all hover:shadow-md group"
      style={{
        border: isLanded ? '1px solid #3DDC9740' : '1px solid #1E2740',
        boxShadow: isLanded ? '0 0 8px #3DDC9710' : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <ScoreDial
          score={mission.vote_count >= 5 ? mission.score : null}
          voteCount={mission.vote_count}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[10px] font-mono font-semibold border rounded-full px-2 py-0.5"
              style={{ color: statusMeta.color, borderColor: `${statusMeta.color}40` }}
            >
              {statusMeta.label.toUpperCase()}
            </span>
          </div>
          <h3 className="text-[#E8ECF8] font-medium text-sm leading-snug group-hover:text-white transition-colors">
            {mission.title}
          </h3>
          {author && (
            <p className="text-xs text-[#8A94B0] mt-1">by @{author.handle}</p>
          )}
        </div>
        {mission.rigor != null && mission.vote_count >= 5 && (
          <div className="text-right shrink-0">
            <div className="text-[10px] text-[#8A94B0]">rigor</div>
            <div className="font-mono text-sm" style={{ color: '#3DDC97' }}>
              {mission.rigor.toFixed(1)}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
