import type { ContributionSummary, WeeklyContributions } from "./contributions";
import type { GitHubUser, Repo } from "./types";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const WEEKS_PER_YEAR = 52;

export interface LanguageCount {
  name: string;
  count: number;
}

/** Everything the compare screen shows for one user, computed once on the server. */
export interface UserStats {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  publicRepos: number;
  originalRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
  accountAgeYears: number;
  topLanguages: LanguageCount[];
  mostStarredRepo: { name: string; url: string; stars: number } | null;
  lastPushAt: string | null;
  /** The contribution fields are null when GitHub has no contribution graph for the account. */
  commitsLastYear: number | null;
  avgCommitsPerWeek: number | null;
  contributionsLastYear: number | null;
  activeWeeks: number | null;
  weeklyContributions: WeeklyContributions[];
}

export function buildUserStats(
  user: GitHubUser,
  repos: Repo[],
  contributions: ContributionSummary | null,
  now: number = Date.now(),
): UserStats {
  const originals = repos.filter((repo) => !repo.isFork);

  let mostStarred: Repo | null = null;
  let lastPushAt: string | null = null;
  for (const repo of repos) {
    if (!mostStarred || repo.stars > mostStarred.stars) mostStarred = repo;
    if (repo.pushedAt && (!lastPushAt || repo.pushedAt > lastPushAt)) lastPushAt = repo.pushedAt;
  }

  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    publicRepos: user.public_repos,
    originalRepos: originals.length,
    followers: user.followers,
    following: user.following,
    totalStars: sum(repos, (repo) => repo.stars),
    totalForks: sum(repos, (repo) => repo.forks),
    accountAgeYears: (now - new Date(user.created_at).getTime()) / MS_PER_YEAR,
    // Forks mostly contain other people's code, so languages count original repos only.
    topLanguages: countLanguages(originals).slice(0, 3),
    mostStarredRepo:
      mostStarred && mostStarred.stars > 0
        ? { name: mostStarred.name, url: mostStarred.url, stars: mostStarred.stars }
        : null,
    lastPushAt,
    commitsLastYear: contributions?.totalCommits ?? null,
    avgCommitsPerWeek: contributions ? contributions.totalCommits / WEEKS_PER_YEAR : null,
    contributionsLastYear: contributions?.totalContributions ?? null,
    activeWeeks: contributions ? contributions.weeks.filter((week) => week.count > 0).length : null,
    weeklyContributions: contributions?.weeks ?? [],
  };
}

function sum<T>(items: T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

function countLanguages(repos: Repo[]): LanguageCount[] {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
