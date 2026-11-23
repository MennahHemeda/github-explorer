"use client";

import { useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { WeeklyContributions } from "@/lib/github";

export interface ChartSeries {
  label: string;
  color: string;
  weeks: WeeklyContributions[];
}

// Drawing area in SVG units. The SVG scales to its container width.
const WIDTH = 720;
const HEIGHT = 260;
const PAD = { top: 16, right: 96, bottom: 28, left: 40 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const weekFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Rounds the axis maximum up to a "nice" number so gridlines land on round values. */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude * 4 >= value) ?? 10;
  return step * magnitude * 4;
}

/**
 * Weekly contributions of two users over the last year.
 * Hover (or use the arrow keys) to read both values for any week.
 */
export function ContributionChart({ series }: { series: ChartSeries[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Both users share the same calendar weeks; align on the week start date to be safe.
  const { weeks, values, max } = useMemo(() => {
    const allWeeks = [...new Set(series.flatMap((s) => s.weeks.map((w) => w.weekStart)))].sort();
    const valueRows = series.map((s) => {
      const byWeek = new Map(s.weeks.map((w) => [w.weekStart, w.count]));
      return allWeeks.map((week) => byWeek.get(week) ?? 0);
    });
    return { weeks: allWeeks, values: valueRows, max: niceMax(Math.max(1, ...valueRows.flat())) };
  }, [series]);

  if (weeks.length < 2) {
    return <p className="text-sm text-zinc-500">No contribution data available for these accounts.</p>;
  }

  const x = (i: number) => PAD.left + (i / (weeks.length - 1)) * PLOT_W;
  const y = (v: number) => PAD.top + PLOT_H - (v / max) * PLOT_H;
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * max));

  // A month label wherever the month changes, skipping every other one so they don't crowd.
  const monthTicks = weeks
    .map((week, i) => ({ i, month: week.slice(0, 7) }))
    .filter((t, idx, all) => idx > 0 && t.month !== all[idx - 1].month)
    .filter((_, idx) => idx % 2 === 0);

  // Direct labels at the line ends, nudged apart if they would overlap.
  const endLabels = series.map((s, si) => ({ ...s, y: y(values[si][weeks.length - 1]) }));
  if (endLabels.length === 2 && Math.abs(endLabels[0].y - endLabels[1].y) < 14) {
    const [upper, lower] = endLabels[0].y <= endLabels[1].y ? [0, 1] : [1, 0];
    const mid = (endLabels[0].y + endLabels[1].y) / 2;
    endLabels[upper].y = mid - 7;
    endLabels[lower].y = mid + 7;
  }

  function indexFromPointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (svgX - PAD.left) / PLOT_W;
    return Math.min(weeks.length - 1, Math.max(0, Math.round(ratio * (weeks.length - 1))));
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowLeft" ? -1 : 1;
    setActiveIndex((i) => Math.min(weeks.length - 1, Math.max(0, (i ?? weeks.length - 1) + step)));
  }

  const active = activeIndex !== null ? { i: activeIndex, week: weeks[activeIndex] } : null;
  const tooltipLeftPct = active ? (x(active.i) / WIDTH) * 100 : 0;

  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">Weekly contributions, last 12 months</span>
        <span className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          {series.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-0.5 w-4 rounded" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </span>
      </figcaption>

      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          role="img"
          aria-label={`Line chart of weekly contributions for ${series.map((s) => s.label).join(" and ")}. Use the left and right arrow keys to read values.`}
          tabIndex={0}
          onPointerMove={(event) => setActiveIndex(indexFromPointer(event))}
          onPointerLeave={() => setActiveIndex(null)}
          onKeyDown={handleKeyDown}
          onBlur={() => setActiveIndex(null)}
        >
          {/* Gridlines + y-axis labels */}
          {gridValues.map((value) => (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={PAD.left + PLOT_W}
                y1={y(value)}
                y2={y(value)}
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={y(value)} dy="0.32em" textAnchor="end" className="fill-zinc-500 text-[11px]">
                {value}
              </text>
            </g>
          ))}

          {/* Month labels */}
          {monthTicks.map(({ i }) => (
            <text key={i} x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="fill-zinc-500 text-[11px]">
              {monthFormat.format(new Date(weeks[i]))}
            </text>
          ))}

          {/* Lines */}
          {series.map((s, si) => (
            <polyline
              key={s.label}
              points={values[si].map((v, i) => `${x(i)},${y(v)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Direct labels at the line ends */}
          {endLabels.map((s) => (
            <text
              key={s.label}
              x={PAD.left + PLOT_W + 8}
              y={s.y}
              dy="0.32em"
              className="fill-zinc-700 text-[12px] font-medium dark:fill-zinc-300"
            >
              {s.label}
            </text>
          ))}

          {/* Crosshair + markers for the hovered week */}
          {active && (
            <g>
              <line
                x1={x(active.i)}
                x2={x(active.i)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                className="stroke-zinc-400 dark:stroke-zinc-500"
                strokeWidth={1}
              />
              {series.map((s, si) => (
                <circle
                  key={s.label}
                  cx={x(active.i)}
                  cy={y(values[si][active.i])}
                  r={4.5}
                  fill={s.color}
                  className="stroke-white dark:stroke-zinc-900"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
        </svg>

        {active && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            style={{
              left: `${tooltipLeftPct}%`,
              transform: tooltipLeftPct > 60 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className="mb-1 text-zinc-500">Week of {weekFormat.format(new Date(active.week))}</p>
            {series.map((s, si) => (
              <p key={s.label} className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <strong className="text-zinc-900 dark:text-zinc-100">{values[si][active.i]}</strong>
              </p>
            ))}
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          Show data as a table
        </summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-1 font-medium">Week of</th>
                {series.map((s) => (
                  <th key={s.label} className="py-1 font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, i) => (
                <tr key={week} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-1">{weekFormat.format(new Date(week))}</td>
                  {values.map((row, si) => (
                    <td key={series[si].label} className="py-1">
                      {row[i]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
