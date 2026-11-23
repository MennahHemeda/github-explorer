import { db, isDatabaseConfigured } from "@/lib/db/client";
import type { Note } from "./types";
import { getVisitorId } from "./visitor";

interface NoteRow {
  id: string | number;
  github_login: string;
  repo_name: string | null;
  body: string;
  created_at: string | Date;
  updated_at: string | Date;
}

function toNote(row: NoteRow): Note {
  return {
    id: String(row.id),
    login: row.github_login,
    repo: row.repo_name,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/** All of the current visitor's notes about one GitHub user (profile + repos), newest first. */
export async function getNotesForProfile(login: string): Promise<Note[]> {
  const visitorId = await getVisitorId();
  if (!visitorId || !isDatabaseConfigured()) return [];

  const rows = (await db()`
    SELECT id, github_login, repo_name, body, created_at, updated_at
    FROM notes
    WHERE visitor_id = ${visitorId} AND github_login = ${login.toLowerCase()}
    ORDER BY created_at DESC
  `) as NoteRow[];
  return rows.map(toNote);
}

/** The current visitor's most recently edited notes, across all users. */
export async function getRecentNotes(limit = 100): Promise<Note[]> {
  const visitorId = await getVisitorId();
  if (!visitorId || !isDatabaseConfigured()) return [];

  const rows = (await db()`
    SELECT id, github_login, repo_name, body, created_at, updated_at
    FROM notes
    WHERE visitor_id = ${visitorId}
    ORDER BY updated_at DESC
    LIMIT ${limit}
  `) as NoteRow[];
  return rows.map(toNote);
}

export async function insertNote(visitorId: string, login: string, repo: string | null, body: string): Promise<void> {
  await db()`
    INSERT INTO notes (visitor_id, github_login, repo_name, body)
    VALUES (${visitorId}, ${login.toLowerCase()}, ${repo}, ${body})
  `;
}

/** Returns false if the note doesn't exist or belongs to another visitor. */
export async function updateNote(visitorId: string, id: string, body: string): Promise<boolean> {
  const rows = await db()`
    UPDATE notes SET body = ${body}, updated_at = now()
    WHERE id = ${id} AND visitor_id = ${visitorId}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function deleteNote(visitorId: string, id: string): Promise<boolean> {
  const rows = await db()`
    DELETE FROM notes WHERE id = ${id} AND visitor_id = ${visitorId}
    RETURNING id
  `;
  return rows.length > 0;
}

/** Groups notes by repository name; the profile's own notes are under "". */
export function groupByRepo(notes: Note[]): Record<string, Note[]> {
  const groups: Record<string, Note[]> = {};
  for (const note of notes) {
    (groups[note.repo ?? ""] ??= []).push(note);
  }
  return groups;
}
