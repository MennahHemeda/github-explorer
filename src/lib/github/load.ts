import { getAllRepos } from "./repos";
import { getUser } from "./users";
import { GitHubNetworkError, GitHubNotFoundError, GitHubRateLimitError } from "./errors";
import type { GitHubUser, Repo } from "./types";

export type LoadResult<T> =
  | ({ status: "ok" } & T)
  | { status: "not-found" }
  | { status: "rate-limited"; retryInMinutes: number | null }
  | { status: "unreachable" };

/**
 * Runs a GitHub loader and turns the *expected* failures (unknown user,
 * rate limit, GitHub unreachable) into values the page can render. Anything else is re-thrown
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
    if (error instanceof GitHubNetworkError) {
      return { status: "unreachable" };
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
