export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const h = { sm: 22, md: 30, lg: 58 }[size]
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="SPACE Y?"
      width={Math.round(h * 3.684)}
      height={h}
      style={{ height: h, width: 'auto', filter: 'drop-shadow(0 0 10px rgba(255,140,60,0.28))' }}
      className="select-none"
      draggable={false}
    />
  )
}
