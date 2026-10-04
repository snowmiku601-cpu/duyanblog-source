import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The nón lá mark. The rib lines are cut out of the silhouette via
 * fill-rule="evenodd", so the mark renders correctly on any background and
 * in any single colour via currentColor.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Duyan Blog"
      className={cn("h-8 w-8", className)}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 8 L59 49 Q32 57.5 5 49 Z M16.85 31 Q32 34.5 47.15 31 L47.15 34.5 Q32 38 16.85 34.5 Z M9.6 42 Q32 45.5 54.4 42 L54.4 45.5 Q32 49 9.6 45.5 Z M29.4 21.5 a2.6 2.6 0 1 0 5.2 0 a2.6 2.6 0 1 0 -5.2 0 Z"
      />
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-semibold tracking-tight leading-none", className)}>
      duyanblog<span className="text-vermilion">.</span>
    </span>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <Link
      href="/"
      aria-label="Duyan Blog — home"
      className={cn("inline-flex items-center gap-2.5 text-foreground hover:opacity-80 transition-opacity", className)}
    >
      <LogoMark className={markClassName ?? "h-8 w-8 text-foreground"} />
      <LogoWordmark className="text-[1.35rem]" />
    </Link>
  );
}
