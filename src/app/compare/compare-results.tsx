import {
  buildUserStats,
  getAllRepos,
  getContributions,
  getUser,
  isValidUsername,
  settle,
  type UserStats,
} from "@/lib/github";
import { CompareTable } from "@/components/compare/compare-table";
import { CompareUserHeader } from "@/components/compare/user-header";
import { VersusBadge } from "@/components/compare/versus-badge";
import { ContributionChart } from "@/components/compare/contribution-chart";
import { RateLimitNotice, UnreachableNotice } from "@/components/rate-limit-notice";

const COLORS = { left: "var(--series-1)", right: "var(--series-2)" };

/** Profile, all repos and a year of contributions for one user: 3 requests, all in parallel. */
function loadStats(username: string) {
  return settle(async () => {
    const [user, repos, contributions] = await Promise.all([
      getUser(username),
      getAllRepos(username),
      getContributions(username),
    ]);
    return { stats: buildUserStats(user, repos, contributions) };
  });
}

export async function CompareResults({ a, b }: { a: string; b: string }) {
  const invalid = [a, b].filter((name) => !isValidUsername(name));
  if (invalid.length) {
    return <Message>{invalid.map((n) => `"${n}"`).join(" and ")} is not a valid GitHub username.</Message>;
  }

  // Both users are loaded at the same time (6 requests in parallel).
  const [left, right] = await Promise.all([loadStats(a), loadStats(b)]);

  for (const result of [left, right]) {
    if (result.status === "rate-limited") {
      return <RateLimitNotice retryInMinutes={result.retryInMinutes} />;
    }
    if (result.status === "unreachable") {
      return <UnreachableNotice />;
    }
  }
  const missing = [
    left.status === "not-found" && a,
    right.status === "not-found" && b,
  ].filter(Boolean);
  if (missing.length || left.status !== "ok" || right.status !== "ok") {
    return <Message>No GitHub user found for {missing.map((n) => `"${n}"`).join(" or ")}.</Message>;
  }

  return <Results left={left.stats} right={right.stats} />;
}

function Results({ left, right }: { left: UserStats; right: UserStats }) {
  const hasContributions = left.weeklyContributions.length > 0 || right.weeklyContributions.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid items-center gap-8 sm:grid-cols-[1fr_auto_1fr]">
        <CompareUserHeader stats={left} color={COLORS.left} />
        <VersusBadge />
        <CompareUserHeader stats={right} color={COLORS.right} />
      </div>

      <CompareTable left={left} right={right} />

      {hasContributions && (
        <section className="window p-4 sm:p-6">
          <ContributionChart
            series={[
              { label: left.login, color: COLORS.left, weeks: left.weeklyContributions },
              { label: right.login, color: COLORS.right, weeks: right.weeklyContributions },
            ]}
          />
        </section>
      )}
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="window p-6 text-center">{children}</p>;
}

export function CompareResultsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-busy="true" aria-label="Loading comparison">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="h-24 rounded-xl bg-zinc-200" />
        <div className="h-24 rounded-xl bg-zinc-200" />
      </div>
      <div className="h-96 rounded-xl bg-zinc-200" />
      <div className="h-72 rounded-xl bg-zinc-200" />
    </div>
  );
}
