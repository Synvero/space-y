export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="skeleton h-7 w-20 mb-6" />

      {/* Balance card */}
      <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-10 w-36" />
          </div>
          <div className="space-y-2 text-right">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-8 w-16" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#1E2740]">
          <div className="skeleton h-4 w-48" />
        </div>
      </div>

      {/* Ledger */}
      <div className="skeleton h-5 w-28 mb-3" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-[#1E2740]">
          <div className="space-y-1.5">
            <div className="skeleton h-4 w-36" />
            <div className="skeleton h-3 w-24" />
          </div>
          <div className="skeleton h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
