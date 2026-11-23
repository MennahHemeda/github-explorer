export function RateLimitNotice({ retryInMinutes }: { retryInMinutes: number | null }) {
  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <h1 className="text-2xl font-semibold">Too many requests</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        The GitHub API rate limit has been reached.
        {retryInMinutes &&
          ` Please try again in about ${retryInMinutes} minute${retryInMinutes === 1 ? "" : "s"}.`}
      </p>
    </div>
  );
}
