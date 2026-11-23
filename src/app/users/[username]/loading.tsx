// Shown instantly while the profile and repositories are being fetched.
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-busy="true" aria-label="Loading profile">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex gap-6">
          <div className="h-28 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-32 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}
