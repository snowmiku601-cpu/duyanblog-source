import { cn } from "@/lib/utils";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Server-safe query-term highlighting: wraps case-insensitive matches of
 * `needle` in <mark>. No client JS — the split happens at render time.
 */
export function Highlight({
  text,
  needle,
  className,
}: {
  text: string;
  needle: string;
  className?: string;
}) {
  const trimmed = needle.trim();
  if (!trimmed) return <>{text}</>;
  let parts: string[];
  try {
    parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, "ig"));
  } catch {
    return <>{text}</>;
  }
  const lower = trimmed.toLowerCase();
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === lower ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>,
      )}
    </span>
  );
}
