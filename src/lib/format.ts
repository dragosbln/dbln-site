const monthYear = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  // Date-only strings parse as UTC midnight; format in the same zone or a
  // build machine west of UTC renders posts dated the 1st a month early.
  timeZone: "UTC",
});

/** "2026-06-09" -> "Jun 2026" (evaluated at build time — static export). */
export function formatMonthYear(isoDate: string): string {
  return monthYear.format(new Date(isoDate));
}
