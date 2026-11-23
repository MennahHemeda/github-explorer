import Link from "next/link";
import type { Note } from "@/lib/notes/types";
import { formatDate } from "@/lib/format";

/** Notes grouped by GitHub user, each linking back to that profile. Used on the home and notes pages. */
export function NotesOverview({ notes }: { notes: Note[] }) {
  const byUser = new Map<string, Note[]>();
  for (const note of notes) {
    byUser.set(note.login, [...(byUser.get(note.login) ?? []), note]);
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {[...byUser.entries()].map(([login, userNotes]) => (
        <li key={login} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Link href={`/users/${login}`} className="font-semibold hover:underline">
            {login}
          </Link>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {userNotes.map((note) => (
              <li key={note.id}>
                <span className="mr-1.5 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {note.repo ?? "profile"}
                </span>
                <span className="whitespace-pre-wrap break-words">{note.body}</span>
                <span className="ml-1.5 text-xs text-zinc-500">· {formatDate(note.updatedAt)}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
