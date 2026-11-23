import { GitHubNotFoundError } from "./errors";
import { githubGraphQL } from "./graphql";

export interface WeeklyContributions {
  /** First day of the week, "YYYY-MM-DD". */
  weekStart: string;
  count: number;
}

export interface ContributionSummary {
  /** Commits made in the last 12 months (public repos, plus private if the user allows it). */
  totalCommits: number;
  /** All contributions in the last 12 months: commits, PRs, issues, reviews. */
  totalContributions: number;
  /** Contributions per week, oldest first (about 53 weeks). */
  weeks: WeeklyContributions[];
}

const CONTRIBUTIONS_QUERY = /* GraphQL */ `
  query UserContributions($login: String!) {
    user(login: $login) {
      contributionsCollection {
        totalCommitContributions
        contributionCalendar {
          totalContributions
          weeks {
            firstDay
            contributionDays {
              contributionCount
            }
          }
        }
      }
    }
  }
`;

interface ContributionsQueryResult {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      contributionCalendar: {
        totalContributions: number;
        weeks: { firstDay: string; contributionDays: { contributionCount: number }[] }[];
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

    const { totalCommitContributions, contributionCalendar } = user.contributionsCollection;
    return {
      totalCommits: totalCommitContributions,
      totalContributions: contributionCalendar.totalContributions,
      weeks: contributionCalendar.weeks.map((week) => ({
        weekStart: week.firstDay,
        count: week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
      })),
    };
  } catch (error) {
    if (error instanceof GitHubNotFoundError) return null;
    throw error;
  }
}
