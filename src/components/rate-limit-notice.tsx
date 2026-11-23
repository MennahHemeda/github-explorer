export function RateLimitNotice({ retryInMinutes }: { retryInMinutes: number | null }) {
  return (
    <Notice title="Too many requests">
      The GitHub API rate limit has been reached.
      {retryInMinutes &&
        ` Please try again in about ${retryInMinutes} minute${retryInMinutes === 1 ? "" : "s"}.`}
    </Notice>
  );
}

export function UnreachableNotice() {
  return (
    <Notice title="Couldn't reach GitHub">
      The GitHub API didn&apos;t respond. Check your internet connection and reload the page.
    </Notice>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{children}</p>
    </div>
  );
}
