import Image from "next/image";
import Link from "next/link";
import type { Note } from "@/lib/notes/types";
import { formatDate } from "@/lib/format";

/** Notes grouped by GitHub user, each group linking back to that profile. Used on the home and notes pages. */
export function NotesOverview({ notes }: { notes: Note[] }) {
  const byUser = new Map<string, Note[]>();
  for (const note of notes) {
    byUser.set(note.login, [...(byUser.get(note.login) ?? []), note]);
  }

  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {[...byUser.entries()].map(([login, userNotes]) => (
        <li key={login} className="window flex flex-col p-5">
          <div className="flex items-center gap-3">
            <Image
              // Notes only store the username; github.com/<user>.png redirects to their avatar.
              src={`https://github.com/${login}.png?size=80`}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="pixel-frame h-9 w-9 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate font-game text-lg leading-tight">Notes on {login}</p>
              <Link href={`/users/${login}`} className="text-sm text-zinc-600 underline decoration-1 underline-offset-2 hover:text-zinc-900">
                View profile
              </Link>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-3">
            {userNotes.map((note) => (
              <li key={note.id} className="border-l-4 border-peach bg-zinc-50 px-3 py-2">
                <p className="whitespace-pre-wrap break-words">{note.body}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {note.repo ? (
                    <>
                      About the <span className="font-semibold text-zinc-700">{note.repo}</span> repository
                    </>
                  ) : (
                    "About their profile"
                  )}{" "}
                  · {formatDate(note.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
