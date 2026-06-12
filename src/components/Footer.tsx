import Link from 'next/link'
import { Logo } from '@/components/Logo'

export function Footer() {
  return (
    <footer className="border-t border-[#1B2531] bg-[#070A0F] py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <nav className="flex items-center gap-6 text-sm text-[#8A94B0]">
          <Link href="/about" className="hover:text-[#E8EDF4] transition-colors">About</Link>
          <Link href="/rules" className="hover:text-[#E8EDF4] transition-colors">Rules</Link>
          <Link href="/leaderboard" className="hover:text-[#E8EDF4] transition-colors">Leaderboard</Link>
        </nav>
        <p className="text-xs text-[#8A94B0]">
          Indie-built in the EU. Data lives in Frankfurt.
        </p>
      </div>
    </footer>
  )
}
