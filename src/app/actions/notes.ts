"use server";

import { revalidatePath } from "next/cache";
import { DatabaseNotConfiguredError } from "@/lib/db/client";
import { isValidUsername } from "@/lib/github/validation";
import { deleteNote, insertNote, updateNote } from "@/lib/notes/queries";
import { NOTE_MAX_LENGTH } from "@/lib/notes/types";
import { getOrCreateVisitorId, getVisitorId } from "@/lib/notes/visitor";

export interface NoteActionState {
  error: string | null;
  /** Changes on every successful save, so the form knows to reset. */
  savedAt: number | null;
}

const REPO_NAME_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;
const NOTE_ID_PATTERN = /^\d{1,18}$/;

/** Creates a note, or updates one when the form includes a note id. */
export async function saveNote(_previous: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const login = String(formData.get("login") ?? "");
  const repo = String(formData.get("repo") ?? "") || null;
  const noteId = String(formData.get("noteId") ?? "") || null;
  const body = String(formData.get("body") ?? "").trim();

  // Never trust form data: it can be edited in the browser.
  if (!isValidUsername(login)) return failure("Invalid GitHub username.");
  if (repo && !REPO_NAME_PATTERN.test(repo)) return failure("Invalid repository name.");
  if (noteId && !NOTE_ID_PATTERN.test(noteId)) return failure("Invalid note.");
  if (!body) return failure("The note is empty.");
  if (body.length > NOTE_MAX_LENGTH) return failure(`Notes can be at most ${NOTE_MAX_LENGTH} characters.`);

  try {
    const visitorId = await getOrCreateVisitorId();
    if (noteId) {
      const updated = await updateNote(visitorId, noteId, body);
      if (!updated) return failure("This note no longer exists.");
    } else {
      await insertNote(visitorId, login, repo, body);
    }
  } catch (error) {
    return failure(describeDatabaseError(error));
  }

  refreshNotePages(login);
  return { error: null, savedAt: Date.now() };
}

export async function removeNote(_previous: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const login = String(formData.get("login") ?? "");
  const noteId = String(formData.get("noteId") ?? "");
  if (!isValidUsername(login) || !NOTE_ID_PATTERN.test(noteId)) return failure("Invalid note.");

  try {
    const visitorId = await getVisitorId();
    if (visitorId) await deleteNote(visitorId, noteId);
  } catch (error) {
    return failure(describeDatabaseError(error));
  }

  refreshNotePages(login);
  return { error: null, savedAt: Date.now() };
}

/** Pages that show notes re-render with the new data. */
function refreshNotePages(login: string) {
  revalidatePath(`/users/${login}`);
  revalidatePath("/notes");
  revalidatePath("/");
}

function failure(error: string): NoteActionState {
  return { error, savedAt: null };
}

function describeDatabaseError(error: unknown): string {
  console.error("Notes database error:", error);
  if (error instanceof DatabaseNotConfiguredError) {
    return "Notes are not available: the database is not configured.";
  }
  return "Couldn't save to the database. Please try again.";
}
