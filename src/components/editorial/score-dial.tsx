import { cn } from "@/lib/utils";
import { scoreBarClass, scoreToneClass } from "@/lib/format";

/** Donut dial showing an overall 0–10 review score. */
export function ScoreDial({ score, size = 112, className }: { score: number; size?: number; className?: string }) {
  const clamped = Math.max(0, Math.min(10, score));
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 10) * c;
  return (
    <div
      className={cn("relative shrink-0", className)}
      role="img"
      aria-label={`Overall score ${clamped.toFixed(1)} out of 10`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <p className={cn("font-display font-semibold leading-none", scoreToneClass(clamped))} style={{ fontSize: size * 0.28 }}>
          {clamped.toFixed(1)}
        </p>
        <p className="absolute bottom-[18%] eyebrow text-muted-foreground" style={{ fontSize: size * 0.07 }}>
          / 10
        </p>
      </div>
    </div>
  );
}

/** Weighted criteria breakdown bars (ReviewScore rows). */
export function ScoreBreakdown({
  scores,
  className,
}: {
  scores: { label: string; score: number; weight: number; note: string | null }[];
  className?: string;
}) {
  if (scores.length === 0) return null;
  return (
    <dl className={cn("space-y-3", className)}>
      {scores.map((s) => (
        <div key={s.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <dt className="font-medium">
              {s.label}
              {s.weight !== 1 && <span className="ml-1.5 text-xs font-normal text-muted-foreground">×{s.weight}</span>}
            </dt>
            <dd className={cn("font-display font-semibold tabular-nums", scoreToneClass(s.score))}>
              {s.score.toFixed(1)}
            </dd>
          </div>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${s.label}: ${s.score.toFixed(1)} out of 10`}
          >
            <div className={cn("h-full rounded-full", scoreBarClass(s.score))} style={{ width: `${(Math.max(0, Math.min(10, s.score)) / 10) * 100}%` }} />
          </div>
          {s.note && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.note}</p>}
        </div>
      ))}
    </dl>
  );
}
