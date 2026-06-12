export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { text: 'text-lg', q: 'text-xl' },
    md: { text: 'text-2xl', q: 'text-3xl' },
    lg: { text: 'text-4xl', q: 'text-5xl' },
  }
  const s = sizes[size]
  return (
    <span
      className={`font-heading font-bold tracking-tight ${s.text} select-none`}
      style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}
    >
      SPACE Y
      <span
        className={`${s.q} inline-block`}
        style={{ color: '#FF6B2C', fontStyle: 'italic', transform: 'skewX(-8deg) translateX(1px)' }}
      >
        ?
      </span>
    </span>
  )
}
