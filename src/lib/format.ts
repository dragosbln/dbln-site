const monthYear = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

/** "2026-06-09" -> "Jun 2026" (evaluated at build time — static export). */
export function formatMonthYear(isoDate: string): string {
  return monthYear.format(new Date(isoDate));
}
