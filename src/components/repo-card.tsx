"use client";

import { useState } from "react";
import type { Repo } from "@/lib/github";
import type { Note } from "@/lib/notes/types";
import { formatCount, formatDate } from "@/lib/format";
import { LanguageDot } from "./language-dot";
import { NotesThread } from "./notes/notes-thread";

interface RepoCardProps {
  repo: Repo;
  login: string;
  notes: Note[];
}

export function RepoCard({ repo, login, notes }: RepoCardProps) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <article className="flex h-full flex-col window p-4">
      <div className="flex items-start justify-between gap-2">
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate font-game text-lg text-blue-600 hover:underline"
        >
          {repo.name}
        </a>
        <div className="flex shrink-0 gap-1">
          {repo.isFork && <Badge>Fork</Badge>}
          {repo.isArchived && <Badge>Archived</Badge>}
        </div>
      </div>

      <p className="mt-2 line-clamp-2 flex-1 text-sm text-zinc-600">
        {repo.description ?? "No description provided."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
        {repo.language && <LanguageDot language={repo.language} />}
        <span title={`${repo.stars} stars`}>★ {formatCount(repo.stars)}</span>
        <span title={`${repo.forks} forks`}>⑂ {formatCount(repo.forks)}</span>
        <span>Updated {formatDate(repo.pushedAt ?? repo.updatedAt)}</span>
        <button
          type="button"
          onClick={() => setShowNotes((open) => !open)}
          aria-expanded={showNotes}
          className={`ml-auto rounded-md px-2 py-0.5 transition hover:bg-zinc-100 hover:text-zinc-900 ${
            notes.length ? "font-medium text-zinc-900" : ""
          }`}
        >
          📝 {notes.length ? `Notes (${notes.length})` : "Add note"}
        </button>
      </div>

      {showNotes && (
        <div className="mt-3 border-t border-zinc-100 pt-3">
          <NotesThread
            login={login}
            repo={repo.name}
            notes={notes}
            placeholder={`Note about ${repo.name}…`}
            autoFocus={notes.length === 0}
          />
        </div>
      )}
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-zinc-100 px-1.5 py-0.5 font-game text-xs text-zinc-600">
      {children}
    </span>
  );
}
