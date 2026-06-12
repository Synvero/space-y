import { ORBIT_META, type Orbit } from '@/lib/scoring'

interface OrbitBadgeProps {
  orbit: Orbit | string
  size?: 'sm' | 'md'
}

export function OrbitBadge({ orbit, size = 'md' }: OrbitBadgeProps) {
  const meta = ORBIT_META[orbit as Orbit] ?? ORBIT_META.leo
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono font-semibold ${textSize}`}
      style={{
        color: meta.color,
        borderColor: meta.border,
        backgroundColor: `${meta.color}10`,
      }}
      title={meta.label}
    >
      {orbit.replace('_', ' ').toUpperCase()}
    </span>
  )
}
