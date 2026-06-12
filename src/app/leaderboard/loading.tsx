export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="skeleton h-7 w-36 mb-6" />
      <div className="skeleton h-10 w-full rounded-xl mb-6" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="bg-[#111729] border border-[#1E2740] rounded-xl px-4 py-3 flex items-center gap-4"
          >
            <div className="skeleton w-6 h-4 shrink-0" />
            <div className="skeleton w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-24" />
            </div>
            <div className="skeleton h-4 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
