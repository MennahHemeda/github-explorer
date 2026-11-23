import { GitHubNotFoundError } from "./errors";
import { githubGraphQL } from "./graphql";

export interface WeeklyContributions {
  /** First day of the week, "YYYY-MM-DD". */
  weekStart: string;
  count: number;
}

export interface DailyContributions {
  /** "YYYY-MM-DD" */
  date: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  count: number;
  /** GitHub's own intensity bucket for this day, 0 (none) to 4 (most). */
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionSummary {
  /** Commits made in the last 12 months (public repos, plus private if the user allows it). */
  totalCommits: number;
  /** All contributions in the last 12 months: commits, PRs, issues, reviews. */
  totalContributions: number;
  /**
   * Contributions to private repositories. GitHub only reports how many (never which days),
   * and only if the user chose to show private contributions on their profile.
   */
  privateContributions: number;
  /** Contributions per week, oldest first (about 53 weeks). */
  weeks: WeeklyContributions[];
  /** Every day of the last year, oldest first. */
  days: DailyContributions[];
}

const CONTRIBUTIONS_QUERY = /* GraphQL */ `
  query UserContributions($login: String!) {
    user(login: $login) {
      contributionsCollection {
        totalCommitContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            firstDay
            contributionDays {
              date
              weekday
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

interface ContributionDayResult {
  date: string;
  weekday: number;
  contributionCount: number;
  contributionLevel: keyof typeof LEVELS;
}

/** GitHub's quartile buckets, mapped to 0-4. */
const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
} as const;

interface ContributionsQueryResult {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      restrictedContributionsCount: number;
      contributionCalendar: {
        totalContributions: number;
        weeks: { firstDay: string; contributionDays: ContributionDayResult[] }[];
      };
    };
  } | null;
}

/**
 * Last 12 months of activity for a user.
 * Returns null for accounts that have no contribution graph (e.g. organizations).
 */
export async function getContributions(username: string): Promise<ContributionSummary | null> {
  try {
    const { user } = await githubGraphQL<ContributionsQueryResult>(CONTRIBUTIONS_QUERY, { login: username });
    if (!user) return null;

    const { totalCommitContributions, restrictedContributionsCount, contributionCalendar } =
      user.contributionsCollection;
    return {
      totalCommits: totalCommitContributions,
      totalContributions: contributionCalendar.totalContributions,
      privateContributions: restrictedContributionsCount,
      weeks: contributionCalendar.weeks.map((week) => ({
        weekStart: week.firstDay,
        count: week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
      })),
      days: contributionCalendar.weeks.flatMap((week) =>
        week.contributionDays.map((day) => ({
          date: day.date,
          weekday: day.weekday,
          count: day.contributionCount,
          level: LEVELS[day.contributionLevel] ?? 0,
        })),
      ),
    };
  } catch (error) {
    if (error instanceof GitHubNotFoundError) return null;
    throw error;
  }
}
