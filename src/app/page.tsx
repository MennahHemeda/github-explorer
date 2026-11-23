import Link from "next/link";
import { SearchForm } from "@/components/search-form";

const EXAMPLE_USERS = ["octocat", "torvalds", "gaearon", "sindresorhus"];

export default function HomePage() {
  return (
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
  );
}
