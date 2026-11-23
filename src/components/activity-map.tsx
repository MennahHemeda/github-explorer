import { getContributions, summarizeActivity, type ContributionSummary, type DailyContributions } from "@/lib/github";
import { formatCount } from "@/lib/format";

const CELL = 13;
const GAP = 4;
const STEP = CELL + GAP;
const LABEL_WIDTH = 34;
const LABEL_HEIGHT = 20;
const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

/**
 * Loads a year of contributions and draws them as a pixel grid.
 * Rendered inside <Suspense>, so the rest of the profile doesn't wait for it.
 */
export async function ActivityMap({ username }: { username: string }) {
  let contributions: ContributionSummary | null;
  try {
    contributions = await getContributions(username);
  } catch (error) {
    console.error("Could not load activity:", error);
    return <ActivityShell>Activity isn&apos;t available right now. Try reloading the page in a minute.</ActivityShell>;
  }

  if (!contributions || contributions.days.length === 0) {
    return <ActivityShell>GitHub has no contribution history for this account.</ActivityShell>;
  }
  return <ActivityMapView days={contributions.days} privateContributions={contributions.privateContributions} />;
}

interface ActivityMapViewProps {
  days: DailyContributions[];
  privateContributions?: number;
}

export function ActivityMapView({ days, privateContributions = 0 }: ActivityMapViewProps) {
  const summary = summarizeActivity(days);

  // One column per week (Sunday to Saturday). The first week may start mid-week.
  const cells = days.map((day, index) => ({ day, column: 0, row: day.weekday, index }));
  let column = 0;
  for (let i = 1; i < cells.length; i++) {
    if (cells[i].row === 0) column += 1;
    cells[i].column = column;
  }
  const columns = column + 1;

  // A month label where the month changes, if there is room since the last one.
  const monthLabels: { column: number; label: string }[] = [];
  for (const cell of cells) {
    if (cell.row !== 0 && cell.index !== 0) continue;
    const month = cell.day.date.slice(0, 7);
    const previous = monthLabels.at(-1);
    if (previous?.label.startsWith(month)) continue;
    if (previous && cell.column - previous.column < 3) continue;
    monthLabels.push({ column: cell.column, label: month });
  }

  const width = LABEL_WIDTH + columns * STEP;
  const height = LABEL_HEIGHT + 7 * STEP;
  const stats = [
    { label: "Public contributions", value: formatCount(summary.total) },
    { label: "Longest streak", value: `${summary.longestStreak} ${summary.longestStreak === 1 ? "day" : "days"}` },
    { label: "Current streak", value: `${summary.currentStreak} ${summary.currentStreak === 1 ? "day" : "days"}` },
    { label: "Busiest day", value: summary.busiestWeekday ?? "None" },
  ];

  return (
    <ActivityShell>
      <p className="-mt-3 mb-4 text-sm text-zinc-600">
        Public activity on {summary.activeDays} of the last {days.length} days.
        {privateContributions > 0 &&
          ` Plus ${formatCount(privateContributions)} private ${
            privateContributions === 1 ? "contribution" : "contributions"
          }, which GitHub counts but doesn't show by day.`}
      </p>

      <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse bg-zinc-50 p-3 text-center">
            <dt className="text-xs text-zinc-500">{stat.label}</dt>
            <dd className="font-game text-xl">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {/* On phones the map scrolls sideways and starts at the most recent weeks. */}
      <div className="flex flex-row-reverse overflow-x-auto pb-2">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          // Phones: fixed size, scrolls sideways. Wider screens: stretches to fill the panel.
          className="shrink-0 sm:h-auto sm:w-full"
          shapeRendering="crispEdges"
          role="img"
          aria-label={`Contribution map: ${summary.total} public contributions in the last year${
            summary.busiestWeekday ? `, most on ${summary.busiestWeekday}s` : ""
          }.`}
        >
          {monthLabels.map(({ column: col, label }) => (
            <text key={label} x={LABEL_WIDTH + col * STEP} y={11} className="fill-zinc-500 text-[12px]">
              {monthFormat.format(new Date(`${label}-01T00:00:00Z`))}
            </text>
          ))}
          {Object.entries(WEEKDAY_LABELS).map(([row, label]) => (
            <text key={label} x={0} y={LABEL_HEIGHT + Number(row) * STEP + CELL - 1} className="fill-zinc-500 text-[11px]">
              {label}
            </text>
          ))}
          {cells.map(({ day, column: col, row }) => (
            <rect
              key={day.date}
              x={LABEL_WIDTH + col * STEP}
              y={LABEL_HEIGHT + row * STEP}
              width={CELL}
              height={CELL}
              fill={`var(--heat-${day.level})`}
            >
              <title>{`${day.count} ${day.count === 1 ? "contribution" : "contributions"} on ${dayFormat.format(new Date(`${day.date}T00:00:00Z`))}`}</title>
            </rect>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-zinc-500" aria-hidden>
        Less
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className="h-[13px] w-[13px]" style={{ backgroundColor: `var(--heat-${level})` }} />
        ))}
        More
      </div>
    </ActivityShell>
  );
}

function ActivityShell({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="activity-heading" className="window p-6" data-tone="mint">
      <h2 id="activity-heading" className="mb-4 text-2xl">
        Activity
      </h2>
      {children}
    </section>
  );
}

export function ActivityMapSkeleton() {
  return (
    <section className="window animate-pulse p-6" data-tone="mint" aria-busy="true" aria-label="Loading activity">
      <div className="h-7 w-28 bg-zinc-200" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-16 bg-zinc-100" />
        ))}
      </div>
      <div className="mt-5 h-28 bg-zinc-100" />
    </section>
  );
}
