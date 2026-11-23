"use client";

import { useActionState, useState } from "react";
import { removeNote, type NoteActionState } from "@/app/actions/notes";
import { formatDate } from "@/lib/format";
import type { Note } from "@/lib/notes/types";
import { NoteForm } from "./note-form";

const INITIAL_STATE: NoteActionState = { error: null, savedAt: null };

export function NoteItem({ note }: { note: Note }) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteState, deleteAction, isDeleting] = useActionState(removeNote, INITIAL_STATE);

  if (isEditing) {
    return (
      <li>
        <NoteForm
          login={note.login}
          repo={note.repo}
          noteId={note.id}
          initialBody={note.body}
          autoFocus
          onSaved={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }

  const edited = note.updatedAt !== note.createdAt;

  return (
    <li className={`rounded-lg bg-zinc-50 px-3 py-2 ${isDeleting ? "opacity-50" : ""}`}>
      <p className="whitespace-pre-wrap break-words text-sm">{note.body}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-zinc-500">
        <span>
          {formatDate(note.updatedAt)}
          {edited && " (edited)"}
        </span>
        <form action={deleteAction} className="flex gap-3">
          <input type="hidden" name="login" value={note.login} />
          <input type="hidden" name="noteId" value={note.id} />
          {confirmDelete ? (
            <>
              <button type="submit" disabled={isDeleting} className="font-medium text-red-600 hover:underline">
                Confirm delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="hover:underline">
                Keep
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setIsEditing(true)} className="hover:text-zinc-900 hover:underline">
                Edit
              </button>
              <button type="button" onClick={() => setConfirmDelete(true)} className="hover:text-red-600 hover:underline">
                Delete
              </button>
            </>
          )}
        </form>
      </div>
      {deleteState.error && <p className="mt-1 text-xs text-red-600">{deleteState.error}</p>}
    </li>
  );
}
