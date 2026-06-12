import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Logo size="lg" />
      <p className="mt-4 text-6xl font-mono text-[#FF6B2C] font-bold">404</p>
      <p className="mt-3 text-[#8A94B0] text-lg">
        This page drifted out of orbit.
      </p>
      <Link
        href="/"
        className="mt-6 bg-[#FF6B2C] hover:bg-[#FF8A52] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        Return to Mission Control
      </Link>
    </div>
  )
}
