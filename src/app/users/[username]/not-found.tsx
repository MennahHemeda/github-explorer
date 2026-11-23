import { SearchForm } from "@/components/search-form";

export default function UserNotFound() {
  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <h1 className="text-2xl font-semibold">User not found</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        We couldn&apos;t find a GitHub account with that username. Check the spelling and try again.
      </p>
      <div className="mt-6">
        <SearchForm autoFocus />
      </div>
    </div>
  );
}
