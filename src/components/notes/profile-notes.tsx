import type { Note } from "@/lib/notes/types";
import { NotesThread } from "./notes-thread";

export function ProfileNotes({ login, notes }: { login: string; notes: Note[] }) {
  return (
    <section
      aria-labelledby="notes-heading"
      className="window p-6"
      data-tone="peach"
    >
      <h2 id="notes-heading" className="text-2xl">
        Your notes on {login}
      </h2>
      <p className="mb-4 text-sm text-zinc-500">
        Private to this browser. Use the 📝 button on a repository to note something about a specific repo.
      </p>
      <NotesThread login={login} notes={notes} placeholder={`e.g. "Strong TypeScript, good candidate to follow"`} />
    </section>
  );
}
