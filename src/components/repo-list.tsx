"use client";

import { useMemo, useState } from "react";
import type { Repo } from "@/lib/github";
import type { Note } from "@/lib/notes/types";
import { RepoCard } from "./repo-card";

const PAGE_SIZE = 30;

type SortKey = "updated" | "stars" | "name";

const SORTERS: Record<SortKey, (a: Repo, b: Repo) => number> = {
  updated: (a, b) => (b.pushedAt ?? b.updatedAt).localeCompare(a.pushedAt ?? a.updatedAt),
  stars: (a, b) => b.stars - a.stars,
  name: (a, b) => a.name.localeCompare(b.name),
};

/**
 * Filtering and sorting happen in the browser: all repos are already loaded,
 * so changing a filter is instant and costs no extra GitHub API calls.
 * Only PAGE_SIZE cards are rendered at a time, so users with 1,000+ repos stay fast.
 */
interface RepoListProps {
  repos: Repo[];
  login: string;
  /** The visitor's notes, keyed by repository name. */
  notesByRepo: Record<string, Note[]>;
}

export function RepoList({ repos, login, notesByRepo }: RepoListProps) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);
  const notedCount = repos.filter((repo) => notesByRepo[repo.name]?.length).length;

  // Languages ordered by how many repos use them.
  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    for (const repo of repos) {
      if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [repos]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return repos
      .filter((repo) => !onlyWithNotes || notesByRepo[repo.name]?.length)
      .filter((repo) => language === "all" || repo.language === language)
      .filter(
        (repo) =>
          !term ||
          repo.name.toLowerCase().includes(term) ||
          repo.description?.toLowerCase().includes(term),
      )
      .sort(SORTERS[sort]);
  }, [repos, query, language, sort, onlyWithNotes, notesByRepo]);

  // Any filter change starts again from the first page.
  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setVisibleCount(PAGE_SIZE);
    };
  }

  const visible = filtered.slice(0, visibleCount);
  const controlClass =
    "h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <section aria-labelledby="repos-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="repos-heading" className="text-lg font-semibold">
          Repositories <span className="text-zinc-500">({repos.length})</span>
        </h2>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(event) => updateFilter(setQuery)(event.target.value)}
            placeholder="Find a repository…"
            aria-label="Filter repositories by name or description"
            className={controlClass}
          />
          <select
            value={language}
            onChange={(event) => updateFilter(setLanguage)(event.target.value)}
            aria-label="Filter by language"
            className={controlClass}
          >
            <option value="all">All languages</option>
            {languages.map(([name, count]) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => updateFilter(setSort)(event.target.value as SortKey)}
            aria-label="Sort repositories"
            className={controlClass}
          >
            <option value="updated">Recently updated</option>
            <option value="stars">Most stars</option>
            <option value="name">Name</option>
          </select>
          {notedCount > 0 && (
            <label className="flex h-10 items-center gap-2 whitespace-nowrap px-1 text-sm">
              <input
                type="checkbox"
                checked={onlyWithNotes}
                onChange={(event) => updateFilter(setOnlyWithNotes)(event.target.checked)}
              />
              With notes ({notedCount})
            </label>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-zinc-500">
          {repos.length === 0 ? "This user has no public repositories." : "No repositories match your filters."}
        </p>
      ) : (
        <>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {visible.map((repo) => (
              <li key={repo.id}>
                <RepoCard repo={repo} login={login} notes={notesByRepo[repo.name] ?? []} />
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-zinc-500">
            <p>
              Showing {visible.length} of {filtered.length}
            </p>
            {visible.length < filtered.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Show more
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
