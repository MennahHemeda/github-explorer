"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";

export default function UserError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="mt-2 text-zinc-600">
        We couldn&apos;t load this profile from GitHub. Please try again.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="btn px-4 py-2 text-sm"
        >
          Try again
        </button>
        <Link href="/" className="btn btn-quiet px-4 py-2 text-sm">
          New search
        </Link>
      </div>
    </div>
  );
}
