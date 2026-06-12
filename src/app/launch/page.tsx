import type { Metadata } from 'next'
import { LaunchWizard } from '@/components/LaunchWizard'

export const metadata: Metadata = {
  title: 'Launch a Why',
}

export default function LaunchPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-[#E8EDF4]">Launch a Why</h1>
        <p className="mt-1 text-[#8A94B0] text-sm">
          Every question must start with "Why". The stranger, the better.
        </p>
      </div>
      <LaunchWizard />
    </div>
  )
}
