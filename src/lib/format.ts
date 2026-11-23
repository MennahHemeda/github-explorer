const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// A fixed locale and time zone give the same output on the server and in the browser,
// which avoids hydration mismatches.
const mediumDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

/** 1234 -> "1.2K" */
export function formatCount(value: number): string {
  return compactNumber.format(value);
}

/** ISO string -> "Mar 3, 2025" */
export function formatDate(iso: string): string {
  return mediumDate.format(new Date(iso));
}
