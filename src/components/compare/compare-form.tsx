"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { isValidUsername, normalizeUsername } from "@/lib/github/validation";

interface CompareFormProps {
  defaultA?: string;
  defaultB?: string;
}

export function CompareForm({ defaultA = "", defaultB = "" }: CompareFormProps) {
  const router = useRouter();
  const [a, setA] = useState(defaultA);
  const [b, setB] = useState(defaultB);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = normalizeUsername(a);
    const second = normalizeUsername(b);

    if (!first || !second) {
      setError("Enter two GitHub usernames to compare.");
      return;
    }
    const invalid = [first, second].find((name) => !isValidUsername(name));
    if (invalid) {
      setError(`"${invalid}" doesn't look like a valid GitHub username.`);
      return;
    }
    if (first.toLowerCase() === second.toLowerCase()) {
      setError("Pick two different users.");
      return;
    }

    setError(null);
    // The comparison lives in the URL, so /compare?a=x&b=y can be shared.
    const query = new URLSearchParams({ a: first, b: second });
    startTransition(() => router.push(`/compare?${query}`));
  }

  function swap() {
    setA(b);
    setB(a);
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-800";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">First username</span>
          <input
            value={a}
            onChange={(event) => setA(event.target.value)}
            placeholder="First user, e.g. torvalds"
            autoComplete="off"
            spellCheck={false}
            className={inputClass}
          />
        </label>
        <button
          type="button"
          onClick={swap}
          aria-label="Swap users"
          title="Swap users"
          className="h-11 self-center rounded-lg px-3 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          ⇄
        </button>
        <label className="flex-1">
          <span className="sr-only">Second username</span>
          <input
            value={b}
            onChange={(event) => setB(event.target.value)}
            placeholder="Second user, e.g. gaearon"
            autoComplete="off"
            spellCheck={false}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending ? "Comparing…" : "Compare"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
