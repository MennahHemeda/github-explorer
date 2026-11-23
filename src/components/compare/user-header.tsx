import Image from "next/image";
import Link from "next/link";
import type { UserStats } from "@/lib/github";

/** Avatar + name for one side of the comparison. `color` matches the user's line in the chart. */
export function CompareUserHeader({ stats, color }: { stats: UserStats; color: string }) {
  return (
    <Link
      href={`/users/${stats.login}`}
      className="window flex items-center gap-4 p-4 hover:bg-zinc-50"
    >
      <Image
        src={stats.avatarUrl}
        alt={`${stats.login}'s avatar`}
        width={56}
        height={56}
        className="pixel-frame h-14 w-14"
      />
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate font-game text-lg">
          <span aria-hidden className="h-3 w-3 shrink-0" style={{ backgroundColor: color }} />
          {stats.name ?? stats.login}
        </p>
        <p className="truncate text-sm text-zinc-500">@{stats.login}</p>
      </div>
    </Link>
  );
}
