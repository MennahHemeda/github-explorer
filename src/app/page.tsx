import Link from "next/link";
import { FeatureBoard } from "@/components/feature-board";
import { NotesOverview } from "@/components/notes/notes-overview";
import { SearchForm } from "@/components/search-form";
import { getRecentNotes } from "@/lib/notes/queries";

const RECENT_NOTES_ON_HOME = 6;

export default async function HomePage() {
  // Returning visitors see their saved notes right away.
  const recentNotes = await getRecentNotes(RECENT_NOTES_ON_HOME);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid items-center gap-8 pt-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:pt-8">
        <section>
          <h1 className="text-5xl leading-tight sm:text-6xl lg:text-7xl">GitHub Explorer</h1>
          <p className="mt-4 max-w-lg text-lg text-zinc-600">
            Look up any developer, browse every repository, compare two profiles and keep notes along the way.
          </p>

          {/* The search is an RPG dialog box. */}
          <div className="window mt-8 p-6 pb-9 sm:p-8 sm:pb-10" data-tone="sky">
            <p className="mb-4 font-game text-xl">Who do you want to look up?</p>
            <SearchForm autoFocus />
            <span aria-hidden className="dialog-caret absolute bottom-2 right-4 font-game text-lg">
              ▼
            </span>
          </div>
        </section>

        <FeatureBoard />
      </div>

      {recentNotes.length > 0 && (
        <section aria-labelledby="recent-notes-heading">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="recent-notes-heading" className="text-2xl">
              Your recent notes
            </h2>
            <Link href="/notes" className="font-game text-base hover:underline">
              See all notes
            </Link>
          </div>
          <NotesOverview notes={recentNotes} />
        </section>
      )}
    </div>
  );
}
