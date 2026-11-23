import type { Metadata } from "next";
import Link from "next/link";
import { NotesOverview } from "@/components/notes/notes-overview";
import { getRecentNotes } from "@/lib/notes/queries";

export const metadata: Metadata = { title: "My notes" };

export default async function NotesPage() {
  const notes = await getRecentNotes();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl">My notes</h1>
        <p className="mt-1 text-zinc-600">
          Everything you&apos;ve noted about GitHub users and their repositories, most recent first.
        </p>
      </div>

      {notes.length === 0 ? (
        <p className="border-2 border-dashed border-zinc-400 p-8 text-center text-zinc-600">
          No notes yet. <Link href="/" className="font-medium text-zinc-900 hover:underline">Search a user</Link>{" "}
          and add a note on their profile or on any repository.
        </p>
      ) : (
        <NotesOverview notes={notes} />
      )}
    </div>
  );
}
