"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveNote, type NoteActionState } from "@/app/actions/notes";
import { NOTE_MAX_LENGTH } from "@/lib/notes/types";

interface NoteFormProps {
  login: string;
  repo?: string | null;
  /** Pass a note to edit it; omit to create a new one. */
  noteId?: string;
  initialBody?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSaved?: () => void;
  onCancel?: () => void;
}

const INITIAL_STATE: NoteActionState = { error: null, savedAt: null };

/** Create or edit a note. Submits to a Server Action, so it also works before JavaScript loads. */
export function NoteForm({
  login,
  repo = null,
  noteId,
  initialBody = "",
  placeholder = "Write a note…",
  autoFocus = false,
  onSaved,
  onCancel,
}: NoteFormProps) {
  const [state, formAction, isPending] = useActionState(saveNote, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  // After a successful save: clear the "new note" box, or close the editor.
  useEffect(() => {
    if (state.savedAt === null) return;
    if (!noteId) formRef.current?.reset();
    onSaved?.();
  }, [state.savedAt, noteId, onSaved]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="login" value={login} />
      {repo && <input type="hidden" name="repo" value={repo} />}
      {noteId && <input type="hidden" name="noteId" value={noteId} />}

      <label className="sr-only" htmlFor={`note-${noteId ?? repo ?? "profile"}`}>
        Note
      </label>
      <textarea
        id={`note-${noteId ?? repo ?? "profile"}`}
        name="body"
        defaultValue={initialBody}
        placeholder={placeholder}
        required
        maxLength={NOTE_MAX_LENGTH}
        rows={noteId ? 3 : 2}
        autoFocus={autoFocus}
        onKeyDown={(event) => {
          // Ctrl/Cmd + Enter saves.
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) event.currentTarget.form?.requestSubmit();
        }}
        className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-800"
      />

      <div className="flex items-center justify-between gap-2">
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {state.error}
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className={secondaryButton}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={isPending} className={primaryButton}>
            {isPending ? "Saving…" : noteId ? "Save" : "Add note"}
          </button>
        </div>
      </div>
    </form>
  );
}

const primaryButton =
  "rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
const secondaryButton =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";
