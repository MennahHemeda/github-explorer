import Link from "next/link";
import { NotesOverview } from "@/components/notes/notes-overview";
import { SearchForm } from "@/components/search-form";
import { getRecentNotes } from "@/lib/notes/queries";

const EXAMPLE_USERS = ["octocat", "torvalds", "gaearon", "sindresorhus"];
const RECENT_NOTES_ON_HOME = 6;

export default async function HomePage() {
  // Returning visitors see their saved notes right away.
  const recentNotes = await getRecentNotes(RECENT_NOTES_ON_HOME);

  return (
    <div className="flex flex-col gap-16">
    <div className="mx-auto flex max-w-2xl flex-col items-center pt-16 text-center sm:pt-24">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">GitHub Profile Explorer</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Search any GitHub user to see their profile and every public repository.
      </p>

      <div className="mt-8 w-full">
        <SearchForm autoFocus />
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        Try:{" "}
        {EXAMPLE_USERS.map((username, index) => (
          <span key={username}>
            {index > 0 && ", "}
            <Link href={`/users/${username}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
              {username}
            </Link>
          </span>
        ))}
      </p>
    </div>

      {recentNotes.length > 0 && (
        <section aria-labelledby="recent-notes-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="recent-notes-heading" className="text-lg font-semibold">
              Your recent notes
            </h2>
            <Link href="/notes" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
              See all notes →
            </Link>
          </div>
          <NotesOverview notes={recentNotes} />
        </section>
      )}
    </div>
  );
}
