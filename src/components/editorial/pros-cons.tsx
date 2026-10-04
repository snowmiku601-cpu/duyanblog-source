import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pros / cons pair used in reviews and roundups. */
export function ProsCons({
  pros,
  cons,
  prosLabel = "What we like",
  consLabel = "What we'd change",
  className,
}: {
  pros: string[];
  cons: string[];
  prosLabel?: string;
  consLabel?: string;
  className?: string;
}) {
  if (pros.length === 0 && cons.length === 0) return null;
  return (
    <div className={cn("grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2", className)}>
      <div className="bg-card p-5">
        <p className="eyebrow text-primary">{prosLabel}</p>
        <ul className="mt-3 space-y-2.5">
          {pros.map((p, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <Plus className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-card p-5">
        <p className="eyebrow text-vermilion">{consLabel}</p>
        <ul className="mt-3 space-y-2.5">
          {cons.map((c, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-vermilion" aria-hidden="true" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
