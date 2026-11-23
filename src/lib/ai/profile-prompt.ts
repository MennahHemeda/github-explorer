import type { GitHubUser, Repo, UserStats } from "@/lib/github";

/** How many repositories we describe to the model. Keeps the prompt small and the cost low. */
const MAX_REPOS_IN_PROMPT = 10;
const RECENT_WEEKS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

export const PROFILE_ANALYST_SYSTEM_PROMPT = `You are an experienced engineering manager reviewing a GitHub profile for a hiring team.
Write a sharp, specific analysis using ONLY the data provided. Never invent projects, employers, skills or numbers.

Rules:
- Every bullet must contain at least one concrete fact from the data: a repository name, a language, or a number (stars, commits per week, years, dates).
- Prefer insight over description: what the numbers suggest about focus, depth, consistency and impact.
- No generic filler ("passionate", "dedicated", "showcases skills", "the data shows"). No hedging.
- If the account is special (e.g. an official, demo or organization account) or the data is too thin to judge, say so in one bullet and keep the rest short.
- Plain, direct English. Complete every bullet; never stop mid-sentence.

Format: exactly these four sections, each heading on its own line starting with "## ", in this order:
## Summary
(2 bullets: who this developer is and what they mainly build)
## Strengths
(2-3 bullets: skills and technologies, each backed by evidence)
## Notable projects
(2-3 bullets: "repo-name: what it is and why it stands out")
## Activity
(2 bullets: how active and how consistent, recent vs. earlier, last activity date)
Each bullet starts with "- " and is one sentence. No other formatting (no bold, tables or code). Under 200 words in total.`;

/**
 * Turns a profile into a compact plain-text brief for the model.
 * We send a summary instead of raw GitHub JSON: it is far smaller, cheaper and faster,
 * and it gives the model pre-computed facts (totals, trends) it would otherwise guess at.
 */
export function buildProfilePrompt(stats: UserStats, repos: Repo[], user: GitHubUser, now = Date.now()): string {
  const originals = repos.filter((repo) => !repo.isFork);
  const topRepos = [...originals]
    .sort((a, b) => b.stars - a.stars || (b.pushedAt ?? "").localeCompare(a.pushedAt ?? ""))
    .slice(0, MAX_REPOS_IN_PROMPT);
  const pushedLastYear = repos.filter((repo) => repo.pushedAt && now - Date.parse(repo.pushedAt) < 365 * DAY_MS).length;

  const lines = [
    `Today's date: ${new Date(now).toISOString().slice(0, 10)}`,
    `GitHub user: ${stats.login}${stats.name ? ` (${stats.name})` : ""}`,
    `Bio: ${user.bio ?? "none"}`,
    user.company && `Company: ${user.company}`,
    user.location && `Location: ${user.location}`,
    `Account created: ${user.created_at.slice(0, 10)} (${stats.accountAgeYears.toFixed(1)} years ago)`,
    `Public repositories: ${stats.publicRepos} (${stats.originalRepos} original, ${repos.length - stats.originalRepos} forks)`,
    `Repositories pushed to in the last 12 months: ${pushedLastYear}`,
    `Last push to any repository: ${stats.lastPushAt?.slice(0, 10) ?? "never"}`,
    `Followers: ${stats.followers}, following: ${stats.following}`,
    `Stars received in total: ${stats.totalStars}, forks of their repos: ${stats.totalForks}`,
    `Languages (original repos): ${stats.topLanguages.map((l) => `${l.name} ${l.count}`).join(", ") || "unknown"}`,
    describeActivity(stats),
    "",
    `Top original repositories by stars (max ${MAX_REPOS_IN_PROMPT}):`,
    ...(topRepos.length ? topRepos.map(describeRepo) : ["(none)"]),
  ];

  // Optional lines (company, location) are null when missing; "" keeps the blank separator line.
  return lines.filter((line): line is string => typeof line === "string").join("\n");
}

function describeActivity(stats: UserStats): string {
  if (stats.commitsLastYear === null) return "Contribution activity: not available for this account.";

  const weeks = stats.weeklyContributions;
  const recent = weeks.slice(-RECENT_WEEKS).reduce((sum, w) => sum + w.count, 0);
  const earlier = weeks.slice(0, -RECENT_WEEKS).reduce((sum, w) => sum + w.count, 0);
  const earlierWeeks = Math.max(1, weeks.length - RECENT_WEEKS);

  return [
    `Commits in the last 12 months: ${stats.commitsLastYear} (${stats.avgCommitsPerWeek?.toFixed(1)} per week)`,
    `All contributions in the last 12 months: ${stats.contributionsLastYear} (commits, PRs, issues, reviews)`,
    `Weeks with any contribution: ${stats.activeWeeks} of ${weeks.length}`,
    `Contributions per week, last ${RECENT_WEEKS} weeks: ${(recent / RECENT_WEEKS).toFixed(1)}; the ${earlierWeeks} weeks before: ${(earlier / earlierWeeks).toFixed(1)}`,
  ].join("\n");
}

function describeRepo(repo: Repo): string {
  const facts = [
    repo.language ?? "no language",
    `${repo.stars} stars`,
    `${repo.forks} forks`,
    `created ${repo.createdAt.slice(0, 10)}`,
    `last push ${repo.pushedAt?.slice(0, 10) ?? "never"}`,
    repo.isArchived && "archived",
    repo.topics.length > 0 && `topics: ${repo.topics.slice(0, 5).join(", ")}`,
  ].filter(Boolean);
  const description = repo.description ? ` - ${repo.description.slice(0, 160)}` : "";
  return `* ${repo.name} [${facts.join(", ")}]${description}`;
}
