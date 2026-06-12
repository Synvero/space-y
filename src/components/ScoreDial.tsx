'use client'

interface ScoreDialProps {
  score: number | null
  voteCount: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function ScoreDial({ score, voteCount, size = 'md', label }: ScoreDialProps) {
  const calibrating = voteCount < 5 || score == null

  const sizes = {
    sm: { container: 'w-10 h-10', text: 'text-xs', sub: 'text-[9px]' },
    md: { container: 'w-14 h-14', text: 'text-sm', sub: 'text-[10px]' },
    lg: { container: 'w-20 h-20', text: 'text-xl', sub: 'text-xs' },
  }
  const s = sizes[size]

  return (
    <div
      className={`${s.container} rounded-full border-2 flex flex-col items-center justify-center shrink-0`}
      style={{
        borderColor: calibrating ? '#1B2531' : '#F5C542',
        backgroundColor: calibrating ? '#0E141B' : '#F5C54210',
      }}
    >
      {calibrating ? (
        <span className={`${s.sub} text-[#8A94B0] text-center leading-tight px-1`}>
          calibrating…
        </span>
      ) : (
        <>
          <span
            className={`${s.text} font-mono font-bold`}
            style={{ color: '#F5C542' }}
          >
            {score}
          </span>
          {label && (
            <span className={`${s.sub} text-[#8A94B0]`}>{label}</span>
          )}
        </>
      )}
    </div>
  )
}
