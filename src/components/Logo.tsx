export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const h = { sm: 19, md: 28, lg: 50 }[size]
  const id = `spy-${size}`
  return (
    <span
      className="inline-flex items-baseline select-none"
      style={{ gap: h * 0.34 }}
      role="img"
      aria-label="SPACE Y?"
    >
      <span
        className="font-heading font-bold uppercase"
        style={{
          fontFamily: 'var(--font-space-grotesk, sans-serif)',
          fontSize: h,
          letterSpacing: h * 0.07,
          lineHeight: 1,
          backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #C2CCDA 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        SPACE
      </span>
      <svg
        height={h * 1.2}
        viewBox="0 0 56 58"
        fill="none"
        aria-hidden="true"
        style={{ filter: 'drop-shadow(0 0 9px rgba(255,140,60,0.5))', transform: 'translateY(8%)' }}
      >
        <defs>
          <linearGradient id={id} x1="8" y1="6" x2="48" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF7A2C" />
            <stop offset="0.55" stopColor="#FF8F30" />
            <stop offset="1" stopColor="#FFB544" />
          </linearGradient>
        </defs>
        <g
          stroke={`url(#${id})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* question-mark hook flowing into the shared stem */}
          <path d="M21 17 C21 6 41 4.5 45 15 C48 23 39.5 27 34 30.5 L34 41" />
          {/* left arm of the Y crossing into the stem */}
          <path d="M11 15 L34 34" />
        </g>
        {/* the dot */}
        <rect x="29.5" y="47.5" width="9" height="8.5" rx="2.6" fill={`url(#${id})`} />
      </svg>
    </span>
  )
}
