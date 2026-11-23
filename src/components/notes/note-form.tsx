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
        className="field w-full resize-y px-3 py-2 text-sm"
      />

      <div className="flex items-center justify-between gap-2">
        <p role="alert" className="text-xs text-red-600">
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
  "btn px-3 py-1.5 text-sm";
const secondaryButton =
  "btn btn-quiet px-3 py-1.5 text-sm";
