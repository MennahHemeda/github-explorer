import type { DailyContributions } from "./contributions";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface ActivitySummary {
  total: number;
  activeDays: number;
  /** Most consecutive days with at least one contribution. */
  longestStreak: number;
  /** Consecutive active days up to today (or yesterday, since today may not be over). */
  currentStreak: number;
  /** Weekday with the most contributions, or null if there were none. */
  busiestWeekday: string | null;
}

/** Facts derived from a year of daily contributions. Days must be in date order. */
export function summarizeActivity(days: DailyContributions[]): ActivitySummary {
  let total = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let run = 0;
  const perWeekday = new Array<number>(7).fill(0);

  for (const day of days) {
    total += day.count;
    perWeekday[day.weekday] += day.count;
    if (day.count > 0) {
      activeDays += 1;
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
  }

  // The current streak may continue from yesterday: today isn't over yet.
  let currentStreak = 0;
  let index = days.length - 1;
  if (index >= 0 && days[index].count === 0) index -= 1;
  for (; index >= 0 && days[index].count > 0; index--) currentStreak += 1;

  const busiest = perWeekday.indexOf(Math.max(...perWeekday));
  return {
    total,
    activeDays,
    longestStreak,
    currentStreak,
    busiestWeekday: total > 0 ? WEEKDAY_NAMES[busiest] : null,
  };
}
