// Shown instantly while the profile and repositories are being fetched. Mirrors the page layout.
export default function Loading() {
  return (
    <div
      className="grid animate-pulse gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="window p-6">
        <div className="h-28 w-28 bg-zinc-200" />
        <div className="mt-6 space-y-3">
          <div className="h-7 w-48 bg-zinc-200" />
          <div className="h-4 w-32 bg-zinc-200" />
          <div className="h-4 w-3/4 bg-zinc-200" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 bg-zinc-100" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="window h-28" />
        <div className="grid gap-8 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="window h-32" />
          ))}
        </div>
      </div>
    </div>
  );
}
