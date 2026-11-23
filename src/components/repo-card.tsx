import type { Repo } from "@/lib/github";
import { formatCount, formatDate } from "@/lib/format";
import { LanguageDot } from "./language-dot";

export function RepoCard({ repo }: { repo: Repo }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600">
      <div className="flex items-start justify-between gap-2">
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          {repo.name}
        </a>
        <div className="flex shrink-0 gap-1">
          {repo.isFork && <Badge>Fork</Badge>}
          {repo.isArchived && <Badge>Archived</Badge>}
        </div>
      </div>

      <p className="mt-2 line-clamp-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
        {repo.description ?? "No description provided."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
        {repo.language && <LanguageDot language={repo.language} />}
        <span title={`${repo.stars} stars`}>★ {formatCount(repo.stars)}</span>
        <span title={`${repo.forks} forks`}>⑂ {formatCount(repo.forks)}</span>
        <span>Updated {formatDate(repo.pushedAt ?? repo.updatedAt)}</span>
      </div>
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
      {children}
    </span>
  );
}
