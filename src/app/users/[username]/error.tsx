"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";

export default function UserError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        We couldn&apos;t load this profile from GitHub. Please try again.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700">
          New search
        </Link>
      </div>
    </div>
  );
}
