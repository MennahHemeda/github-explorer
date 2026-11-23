import type { Note } from "@/lib/notes/types";
import { NoteForm } from "./note-form";
import { NoteItem } from "./note-item";

interface NotesThreadProps {
  login: string;
  repo?: string | null;
  notes: Note[];
  placeholder?: string;
  autoFocus?: boolean;
}

/** A list of notes for one target (a user or a repo) plus a box to add another. */
export function NotesThread({ login, repo = null, notes, placeholder, autoFocus }: NotesThreadProps) {
  return (
    <div className="flex flex-col gap-3">
      {notes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </ul>
      )}
      <NoteForm login={login} repo={repo} placeholder={placeholder} autoFocus={autoFocus} />
    </div>
  );
}
