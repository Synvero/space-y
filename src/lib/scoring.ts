export type Orbit = 'leo' | 'geo' | 'moon' | 'mars' | 'deep_space'

export const ORBIT_META: Record<Orbit, { label: string; color: string; bg: string; border: string; minAbsurdity: number }> = {
  leo:        { label: 'Everyday strange',    color: '#8A94B0', bg: '#8A94B0', border: '#8A94B040', minAbsurdity: 0   },
  geo:        { label: 'Properly weird',      color: '#5AC8FF', bg: '#5AC8FF', border: '#5AC8FF40', minAbsurdity: 3   },
  moon:       { label: 'Absurd',              color: '#E8EDF4', bg: '#E8EDF4', border: '#E8EDF440', minAbsurdity: 5   },
  mars:       { label: 'Gloriously absurd',   color: '#2BE36C', bg: '#2BE36C', border: '#2BE36C40', minAbsurdity: 7   },
  deep_space: { label: 'Civilizational',      color: '#F5C542', bg: '#F5C542', border: '#F5C54240', minAbsurdity: 8.5 },
}

export function orbitFromAbsurdity(absurdity: number): Orbit {
  if (absurdity >= 8.5) return 'deep_space'
  if (absurdity >= 7.0) return 'mars'
  if (absurdity >= 5.0) return 'moon'
  if (absurdity >= 3.0) return 'geo'
  return 'leo'
}

export function calcScore(absurdity: number | null, rigor: number | null, landed: boolean): number {
  if (!absurdity || !rigor) return 0
  return Math.round(absurdity * rigor * (landed ? 3 : 1))
}

export function rankLabel(reputation: number): string {
  if (reputation >= 500) return 'Flight Director'
  if (reputation >= 200) return 'Commander'
  if (reputation >= 50)  return 'Pilot'
  return 'Cadet'
}
