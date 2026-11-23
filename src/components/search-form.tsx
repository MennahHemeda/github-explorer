"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { isValidUsername, normalizeUsername } from "@/lib/github/validation";

interface SearchFormProps {
  defaultValue?: string;
  autoFocus?: boolean;
}

export function SearchForm({ defaultValue = "", autoFocus = false }: SearchFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = normalizeUsername(value);

    if (!username) {
      setError("Please enter a GitHub username.");
      return;
    }
    if (!isValidUsername(username)) {
      setError("That doesn't look like a valid GitHub username.");
      return;
    }

    setError(null);
    // The URL is the state: /users/octocat can be shared, bookmarked and reached with Back.
    startTransition(() => router.push(`/users/${username}`));
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="username" className="sr-only">
          GitHub username
        </label>
        <input
          id="username"
          name="username"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Enter a GitHub username, e.g. octocat"
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "username-error" : undefined}
          className="field h-12 flex-1 px-4 text-base"
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn h-12 px-6 text-base"
        >
          {isPending ? "Searching…" : "Search"}
        </button>
      </div>
      {error && (
        <p id="username-error" role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
