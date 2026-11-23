import type { UserStats } from "@/lib/github";
import { formatCount, formatDate } from "@/lib/format";

type Winner = "left" | "right" | null;

interface Row {
  label: string;
  hint?: string;
  render: (stats: UserStats) => React.ReactNode;
  /** Numeric value used to pick the winner. Omit for rows where "more" isn't "better". */
  score?: (stats: UserStats) => number | null;
}

const ROWS: Row[] = [
  { label: "Public repositories", render: (s) => formatCount(s.publicRepos), score: (s) => s.publicRepos },
  { label: "Original repositories", hint: "Not forks", render: (s) => formatCount(s.originalRepos), score: (s) => s.originalRepos },
  { label: "Total stars", render: (s) => formatCount(s.totalStars), score: (s) => s.totalStars },
  { label: "Total forks", render: (s) => formatCount(s.totalForks), score: (s) => s.totalForks },
  { label: "Followers", render: (s) => formatCount(s.followers), score: (s) => s.followers },
  { label: "Following", render: (s) => formatCount(s.following) },
  {
    label: "Commits",
    hint: "Last 12 months",
    render: (s) => (s.commitsLastYear === null ? "—" : formatCount(s.commitsLastYear)),
    score: (s) => s.commitsLastYear,
  },
  {
    label: "Commit frequency",
    hint: "Average per week",
    render: (s) => (s.avgCommitsPerWeek === null ? "—" : `${s.avgCommitsPerWeek.toFixed(1)} / week`),
    score: (s) => s.avgCommitsPerWeek,
  },
  {
    label: "Total contributions",
    hint: "Commits, PRs, issues, reviews",
    render: (s) => (s.contributionsLastYear === null ? "—" : formatCount(s.contributionsLastYear)),
    score: (s) => s.contributionsLastYear,
  },
  {
    label: "Active weeks",
    hint: "Weeks with any contribution",
    render: (s) => (s.activeWeeks === null ? "—" : `${s.activeWeeks} of ${s.weeklyContributions.length}`),
    score: (s) => s.activeWeeks,
  },
  { label: "Account age", render: (s) => `${s.accountAgeYears.toFixed(1)} years`, score: (s) => s.accountAgeYears },
  { label: "Last push", render: (s) => (s.lastPushAt ? formatDate(s.lastPushAt) : "—") },
  {
    label: "Top languages",
    render: (s) => (s.topLanguages.length ? s.topLanguages.map((l) => l.name).join(", ") : "—"),
  },
  {
    label: "Most starred repo",
    render: (s) =>
      s.mostStarredRepo ? (
        <a href={s.mostStarredRepo.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {s.mostStarredRepo.name} <span className="text-zinc-500">(★ {formatCount(s.mostStarredRepo.stars)})</span>
        </a>
      ) : (
        "—"
      ),
  },
];

function pickWinner(row: Row, left: UserStats, right: UserStats): Winner {
  if (!row.score) return null;
  const a = row.score(left);
  const b = row.score(right);
  if (a === null || b === null || a === b) return null;
  return a > b ? "left" : "right";
}

export function CompareTable({ left, right }: { left: UserStats; right: UserStats }) {
  const wins = { left: 0, right: 0 };
  const rows = ROWS.map((row) => {
    const winner = pickWinner(row, left, right);
    if (winner) wins[winner] += 1;
    return { row, winner };
  });

  return (
    <div className="overflow-x-auto window">
      <table className="w-full text-sm">
        <caption className="sr-only">
          Comparison of {left.login} and {right.login}. A check mark shows the higher value.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-left">
            <th scope="col" className="w-1/3 px-4 py-3 font-medium text-zinc-500">
              Metric
            </th>
            <th scope="col" className="w-1/3 px-4 py-3 font-semibold">
              {left.login} <span className="font-normal text-zinc-500">({wins.left} wins)</span>
            </th>
            <th scope="col" className="w-1/3 px-4 py-3 font-semibold">
              {right.login} <span className="font-normal text-zinc-500">({wins.right} wins)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, winner }) => (
            <tr key={row.label} className="border-b border-zinc-100 last:border-0">
              <th scope="row" className="px-4 py-3 text-left font-normal">
                {row.label}
                {row.hint && <span className="block text-xs text-zinc-500">{row.hint}</span>}
              </th>
              <Cell isWinner={winner === "left"}>{row.render(left)}</Cell>
              <Cell isWinner={winner === "right"}>{row.render(right)}</Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ isWinner, children }: { isWinner: boolean; children: React.ReactNode }) {
  return (
    <td className={`px-4 py-3 ${isWinner ? "bg-emerald-50 font-semibold" : ""}`}>
      {children}
      {isWinner && (
        <span className="ml-1.5 text-emerald-700" aria-label="higher">
          ✓
        </span>
      )}
    </td>
  );
}
