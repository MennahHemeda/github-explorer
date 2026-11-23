import { githubFetch } from "./client";
import type { GitHubUser } from "./types";

/** Fetches a user's public profile. Throws GitHubNotFoundError if the user doesn't exist. */
export function getUser(username: string): Promise<GitHubUser> {
  return githubFetch<GitHubUser>(`/users/${encodeURIComponent(username)}`);
}
