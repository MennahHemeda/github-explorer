/**
 * Shapes of the GitHub REST API responses we use.
 * Only the fields the app actually reads are typed, so the types stay small and honest.
 * Docs: https://docs.github.com/en/rest/users/users#get-a-user
 */

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

/** Raw repository object as returned by GET /users/{username}/repos. */
export interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics?: string[];
  homepage: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
}

/** The trimmed repository object the rest of the app works with. */
export interface Repo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  isFork: boolean;
  isArchived: boolean;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  homepage: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
}
