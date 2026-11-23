import Image from "next/image";
import Link from "next/link";
import type { UserStats } from "@/lib/github";

/** Avatar + name for one side of the comparison. `color` matches the user's line in the chart. */
export function CompareUserHeader({ stats, color }: { stats: UserStats; color: string }) {
  return (
    <Link
      href={`/users/${stats.login}`}
      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <Image
        src={stats.avatarUrl}
        alt={`${stats.login}'s avatar`}
        width={56}
        height={56}
        className="h-14 w-14 rounded-full"
      />
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate font-semibold">
          <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          {stats.name ?? stats.login}
        </p>
        <p className="truncate text-sm text-zinc-500">@{stats.login}</p>
      </div>
    </Link>
  );
}
