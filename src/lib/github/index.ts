// Public entry point: import from "@/lib/github" instead of individual files.
export { getUser } from "./users";
export { getAllRepos } from "./repos";
export { getContributions } from "./contributions";
export { buildUserStats } from "./stats";
export { isValidUsername, normalizeUsername } from "./validation";
export { GitHubError, GitHubNetworkError, GitHubNotFoundError, GitHubRateLimitError } from "./errors";
export type { GitHubUser, Repo } from "./types";
export type { ContributionSummary, DailyContributions, WeeklyContributions } from "./contributions";
export { summarizeActivity, type ActivitySummary } from "./activity";
export type { UserStats, LanguageCount } from "./stats";
export { settle, loadProfile, type LoadResult } from "./load";
