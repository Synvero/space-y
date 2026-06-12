function SkeletonCard() {
  return (
    <div className="bg-[#111729] border border-[#1E2740] rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="skeleton w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="skeleton h-10 w-full rounded-xl mb-3" />
      <div className="skeleton h-8 w-64 rounded-full mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
