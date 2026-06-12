export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Badge + title */}
      <div className="mb-6">
        <div className="skeleton h-5 w-20 rounded-full mb-3" />
        <div className="skeleton h-8 w-full mb-2" />
        <div className="skeleton h-8 w-4/5 mb-4" />
        <div className="flex gap-3">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-3 w-24" />
        </div>
      </div>

      {/* Vote card */}
      <div className="bg-[#0E141B] border border-[#1B2531] rounded-xl p-4 mb-6">
        <div className="flex justify-between mb-3">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-8 w-8 rounded-full" />
        </div>
        <div className="skeleton h-6 w-full" />
      </div>

      {/* Market */}
      <div className="bg-[#0E141B] border border-[#1B2531] rounded-xl p-4 mb-6">
        <div className="flex justify-between mb-2">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-3 w-12" />
        </div>
        <div className="skeleton h-4 w-full mb-3" />
        <div className="skeleton h-3 rounded-full mb-1" />
        <div className="flex justify-between">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3 w-24" />
        </div>
      </div>

      {/* Missions header */}
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>

      {/* Mission cards */}
      {[1, 2].map(i => (
        <div key={i} className="bg-[#0E141B] border border-[#1B2531] rounded-xl p-4 mb-3">
          <div className="skeleton h-4 w-3/4 mb-2" />
          <div className="skeleton h-3 w-1/2 mb-3" />
          <div className="skeleton h-6 w-full" />
        </div>
      ))}
    </div>
  )
}
