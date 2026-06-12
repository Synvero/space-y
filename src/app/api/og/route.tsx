import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const ORBIT_META: Record<string, { label: string; color: string }> = {
  leo:        { label: 'LEO',       color: '#8A94B0' },
  geo:        { label: 'GEO',       color: '#4D9FFF' },
  moon:       { label: 'MOON',      color: '#E8ECF8' },
  mars:       { label: 'MARS',      color: '#FF6B2C' },
  deep_space: { label: 'DEEP',      color: '#F5C542' },
}

const STARS = [
  { x: 12, y: 8,  r: 1.5 }, { x: 25, y: 45, r: 1 }, { x: 43, y: 12, r: 1 },
  { x: 67, y: 28, r: 2   }, { x: 82, y: 60, r: 1 }, { x: 95, y: 15, r: 1 },
  { x: 55, y: 78, r: 1.5 }, { x: 35, y: 65, r: 1 }, { x: 78, y: 42, r: 1 },
  { x: 18, y: 85, r: 1   }, { x: 48, y: 92, r: 1 }, { x: 88, y: 82, r: 1.5 },
  { x: 5,  y: 55, r: 1   }, { x: 72, y: 72, r: 1 }, { x: 30, y: 30, r: 2 },
  { x: 60, y: 50, r: 1   }, { x: 90, y: 30, r: 1 }, { x: 15, y: 70, r: 1 },
  { x: 45, y: 38, r: 1   }, { x: 85, y: 5,  r: 2 }, { x: 3,  y: 20, r: 1 },
  { x: 52, y: 58, r: 1   }, { x: 70, y: 88, r: 1 }, { x: 22, y: 15, r: 1 },
]

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'SPACE Y?'
  const orbit = searchParams.get('orbit') ?? 'leo'
  const scoreStr = searchParams.get('score')
  const score = scoreStr ? parseInt(scoreStr, 10) : null

  const orbitMeta = ORBIT_META[orbit] ?? ORBIT_META.leo
  const fontSize = title.length > 80 ? 44 : title.length > 50 ? 52 : 60

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          background: '#0A0E1A',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, Helvetica, Arial, sans-serif',
        }}
      >
        {/* Starfield */}
        {STARS.map((star, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.r * 2,
              height: star.r * 2,
              borderRadius: '50%',
              background: i % 5 === 0
                ? 'rgba(77, 159, 255, 0.5)'
                : 'rgba(232, 236, 248, 0.55)',
            }}
          />
        ))}

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: '#E8ECF8',
              letterSpacing: '-0.5px',
            }}
          >
            {'SPACE '}
          </span>
          <span
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: '#FF6B2C',
              fontStyle: 'italic',
            }}
          >
            Y?
          </span>
        </div>

        {/* Question title */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            paddingTop: 20,
            paddingBottom: 20,
          }}
        >
          <p
            style={{
              fontSize,
              fontWeight: 700,
              color: '#E8ECF8',
              lineHeight: 1.25,
              margin: 0,
              maxWidth: 980,
            }}
          >
            {title}
          </p>
        </div>

        {/* Bottom row: orbit badge + score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${orbitMeta.color}22`,
              border: `1.5px solid ${orbitMeta.color}80`,
              borderRadius: 100,
              padding: '10px 28px',
            }}
          >
            <span
              style={{
                color: orbitMeta.color,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '0.12em',
              }}
            >
              {orbitMeta.label}
            </span>
          </div>

          {score !== null && !isNaN(score) && (
            <span
              style={{
                color: '#F5C542',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              Score {score}
            </span>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
