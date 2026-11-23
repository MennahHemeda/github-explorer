import { githubFetchAllPages } from "./client";
import type { GitHubRepoResponse, Repo } from "./types";

/** Keeps only the fields the UI needs, so less data is cached and sent to the client. */
function toRepo(repo: GitHubRepoResponse): Repo {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description,
    isFork: repo.fork,
    isArchived: repo.archived,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    topics: repo.topics ?? [],
    homepage: repo.homepage || null,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
  };
}

/**
 * Fetches ALL public repositories of a user (follows pagination),
 * most recently updated first.
 */
export async function getAllRepos(username: string): Promise<Repo[]> {
  const repos = await githubFetchAllPages<GitHubRepoResponse>(
    `/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated`,
  );
  return repos.map(toRepo);
}
