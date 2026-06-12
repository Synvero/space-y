import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p
        className="font-mono font-bold text-[#1E2740] select-none"
        style={{ fontSize: 'clamp(5rem, 20vw, 8rem)', lineHeight: 1 }}
        aria-hidden="true"
      >
        404
      </p>
      <h1 className="font-heading font-bold text-xl text-[#E8ECF8] mt-4 mb-2">
        Lost in deep space
      </h1>
      <p className="text-[#8A94B0] text-sm max-w-xs leading-relaxed">
        This coordinate doesn&apos;t exist in our universe. The mission may have been removed or never launched.
      </p>
      <Link
        href="/"
        className="mt-8 bg-[#FF6B2C] hover:bg-[#FF8A52] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
      >
        Return to Mission Control
      </Link>
    </div>
  )
}
