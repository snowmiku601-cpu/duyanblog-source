/** Score → tailwind tone class for review scores (0–10). */
export function scoreToneClass(score: number): string {
  if (score >= 8) return "text-primary";
  if (score >= 6) return "text-ochre dark:text-sun";
  return "text-vermilion";
}

/** Score → bar fill class. */
export function scoreBarClass(score: number): string {
  if (score >= 8) return "bg-primary";
  if (score >= 6) return "bg-ochre dark:bg-sun";
  return "bg-vermilion";
}

/** Consistent editorial date format: "Mar 4, 2026". */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}
