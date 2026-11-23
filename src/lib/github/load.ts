import { getAllRepos } from "./repos";
import { getUser } from "./users";
import { GitHubNotFoundError, GitHubRateLimitError } from "./errors";
import type { GitHubUser, Repo } from "./types";

export type LoadResult<T> =
  | ({ status: "ok" } & T)
  | { status: "not-found" }
  | { status: "rate-limited"; retryInMinutes: number | null };

/**
 * Runs a GitHub loader and turns the two *expected* failures (unknown user,
 * rate limit) into values the page can render. Anything else is re-thrown
 * and handled by the nearest error.tsx.
 */
export async function settle<T extends object>(load: () => Promise<T>): Promise<LoadResult<T>> {
  try {
    return { status: "ok", ...(await load()) };
  } catch (error) {
    if (error instanceof GitHubNotFoundError) {
      return { status: "not-found" };
    }
    if (error instanceof GitHubRateLimitError) {
      const retryInMinutes = error.resetAt
        ? Math.max(1, Math.ceil((error.resetAt.getTime() - Date.now()) / 60_000))
        : null;
      return { status: "rate-limited", retryInMinutes };
    }
    throw error;
  }
}

/** Profile + all repositories, fetched in parallel. */
export function loadProfile(username: string): Promise<LoadResult<{ user: GitHubUser; repos: Repo[] }>> {
  return settle(async () => {
    const [user, repos] = await Promise.all([getUser(username), getAllRepos(username)]);
    return { user, repos };
  });
}
