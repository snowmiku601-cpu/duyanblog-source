"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Check, Medal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AffiliateButton } from "@/components/affiliate/affiliate-link";
import {
  attrFor,
  attributeRows,
  sortableAttributes,
  winnerFor,
  type ComparisonItemView,
} from "@/lib/comparison";
import { cn } from "@/lib/utils";

/**
 * The comparison engine's client surface: sortable, accessible desktop table
 * plus stacked mobile cards. All data is prepared server-side and passed in
 * — no comparison content is hardcoded in JSX.
 *
 * Desktop extras:
 * - thead sticks under the site header so product names + scores stay visible
 *   while scrolling long tables (only when the table doesn't scroll
 *   horizontally — a scroll container would trap the sticky element);
 * - hovering a column tints it for scan-across reading;
 * - the highest-scored item wears an "Editors' pick" chip and a score meter.
 */

/** Track whether a container actually overflows horizontally. */
function useHasOverflowX<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [hasOverflowX, setHasOverflowX] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHasOverflowX(el.scrollWidth > el.clientWidth + 1);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Content changes (sort, items) resize children — observe the table too.
    const child = el.firstElementChild;
    if (child instanceof HTMLElement) ro.observe(child);
    return () => ro.disconnect();
  }, []);

  return { ref, hasOverflowX };
}

/* ------------------------------------------------------------------ */
/* URL-backed sort state — deep-linkable (?sort=<attr>&dir=high|low).  */
/* The URL is the single source of truth, read via useSyncExternalStore*/
/* so the server renders the editors' order and the client picks up a  */
/* shared link's sort after hydration without a mismatch.              */
/* ------------------------------------------------------------------ */

type SortDir = "high" | "low";

const SORT_EVENT = "duyanblog:sort";
/** Session-wide last-used sort — applied to any table whose labels match. */
const SORT_PREF_KEY = "duyanblog:sort";

function readSortPref(): { attr: string; dir: SortDir } | null {
  try {
    const raw = window.localStorage.getItem(SORT_PREF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { attr?: unknown; dir?: unknown };
    if (typeof parsed.attr !== "string" || parsed.attr === "") return null;
    return { attr: parsed.attr, dir: parsed.dir === "low" ? "low" : "high" };
  } catch {
    // Private mode / disabled storage — the preference is a nicety, never a dependency.
    return null;
  }
}

function writeSortPref(attr: string, dir: SortDir) {
  try {
    if (attr) {
      window.localStorage.setItem(SORT_PREF_KEY, JSON.stringify({ attr, dir }));
    } else {
      // Clearing the sort (editors' order) forgets the preference — an
      // explicit choice to go back to curated order.
      window.localStorage.removeItem(SORT_PREF_KEY);
    }
  } catch {
    // ignore — see readSortPref
  }
}

function readSortFromUrl(): { attr: string; dir: SortDir } {
  const params = new URLSearchParams(window.location.search);
  const urlAttr = params.get("sort");
  if (urlAttr) {
    return { attr: urlAttr, dir: params.get("dir") === "low" ? "low" : "high" };
  }
  // No deep link — fall back to the reader's last-used sort (any table).
  return readSortPref() ?? { attr: "", dir: "high" };
}

function serializeSort(): string {
  const { attr, dir } = readSortFromUrl();
  return `${attr}\u0000${dir}`;
}

function useUrlSortState() {
  const [subscribe, getSnapshot] = useMemo(() => {
    const listeners = new Set<() => void>();
    const notify = () => listeners.forEach((cb) => cb());
    const subscribe = (cb: () => void) => {
      listeners.add(cb);
      window.addEventListener("popstate", notify);
      window.addEventListener(SORT_EVENT, notify);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("popstate", notify);
        window.removeEventListener(SORT_EVENT, notify);
      };
    };
    const getSnapshot = () => serializeSort();
    return [subscribe, getSnapshot] as const;
  }, []);

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => "\u0000high", // server snapshot: editors' order, highest first
  );
}

function writeSortToUrl(attr: string, dir: SortDir) {
  const url = new URL(window.location.href);
  if (attr) {
    url.searchParams.set("sort", attr);
    url.searchParams.set("dir", dir);
  } else {
    url.searchParams.delete("sort");
    url.searchParams.delete("dir");
  }
  window.history.replaceState(null, "", url);
  writeSortPref(attr, dir);
  window.dispatchEvent(new Event(SORT_EVENT));
}

export function ComparisonTable({
  items: originalItems,
  articleSlug,
  caption = "Product comparison",
  isDemo,
  className,
}: {
  items: ComparisonItemView[];
  articleSlug?: string;
  caption?: string;
  /** Demo context — REQUIRED so a demo comparison can never look real. */
  isDemo: boolean;
  className?: string;
}) {
  const [hoverCol, setHoverCol] = useState<number>(-1);
  const { ref: wrapRef, hasOverflowX } = useHasOverflowX<HTMLDivElement>();

  const allAttrs = useMemo(() => attributeRows(originalItems), [originalItems]);
  const sortable = useMemo(() => sortableAttributes(originalItems), [originalItems]);

  // URL-backed sort: parse the snapshot string into the working pair.
  // A sort label that no longer exists (shared link, edited table) falls
  // back to the editors' order instead of a half-applied sort.
  const sortSnapshot = useUrlSortState();
  const { sortAttr, sortDir } = useMemo(() => {
    const sep = sortSnapshot.lastIndexOf("\u0000");
    const attr = sortSnapshot.slice(0, sep);
    const dir = (sortSnapshot.slice(sep + 1) === "low" ? "low" : "high") as SortDir;
    const valid = attr === "" || sortable.includes(attr);
    return { sortAttr: valid ? attr : "", sortDir: dir };
  }, [sortSnapshot, sortable]);

  const onSelectSort = (attr: string) => writeSortToUrl(attr, sortDir);
  const onToggleDir = () => writeSortToUrl(sortAttr, sortDir === "high" ? "low" : "high");

  const items = useMemo(() => {
    if (!sortAttr) return originalItems;
    const sorted = [...originalItems];
    sorted.sort((a, b) => {
      const na = attrFor(a, sortAttr)?.numeric ?? null;
      const nb = attrFor(b, sortAttr)?.numeric ?? null;
      if (na == null && nb == null) return 0;
      if (na == null) return 1;
      if (nb == null) return -1;
      return sortDir === "high" ? nb - na : na - nb;
    });
    return sorted;
  }, [originalItems, sortAttr, sortDir]);

  /** Item id wearing the Editors' pick chip (editors' order + has score). */
  const pickId = useMemo(() => {
    if (sortAttr) return null;
    let best: ComparisonItemView | null = null;
    let bestScore = -Infinity;
    for (const item of originalItems) {
      if (item.score == null) continue;
      if (!best || item.score > bestScore) {
        best = item;
        bestScore = item.score;
      }
    }
    return best?.id ?? null;
  }, [originalItems, sortAttr]);

  const sortStatus = sortAttr
    ? `Sorted by ${sortAttr}, ${sortDir === "high" ? "highest first" : "lowest first"}.`
    : "Showing the editors' order.";

  /** Inset-shadow tint composites over any cell background (card, odd stripes, bg-inherit). */
  const colTint = (col: number) => (hoverCol === col ? "col-tint" : "");

  /** Event delegation: one pair of handlers tints the whole hovered column. */
  function onColOver(e: React.MouseEvent<HTMLTableElement>) {
    const cell = (e.target as HTMLElement).closest("[data-col]");
    if (!cell) return;
    const col = Number((cell as HTMLElement).dataset.col);
    if (Number.isFinite(col) && col !== hoverCol) setHoverCol(col);
  }

  return (
    <div className={cn("rounded-md border border-border bg-card", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="eyebrow text-muted-foreground">Compare</p>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="compare-sort" className="text-xs text-muted-foreground">
            Sort by
          </label>
          <select
            id="compare-sort"
            value={sortAttr}
            onChange={(e) => onSelectSort(e.target.value)}
            className="h-8 rounded-sm border border-input bg-background px-2 text-xs focus-visible:outline-2 focus-visible:outline-ring"
          >
            <option value="">Editors' order</option>
            {sortable.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            disabled={!sortAttr}
            aria-label={sortDir === "high" ? "Highest first. Switch to lowest first." : "Lowest first. Switch to highest first."}
            onClick={onToggleDir}
          >
            {sortDir === "high" ? <ArrowDownWideNarrow className="h-3.5 w-3.5" /> : <ArrowUpNarrowWide className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p aria-live="polite" className="sr-only">{sortStatus}</p>
      </div>

      {/* Desktop table */}
      <div
        ref={wrapRef}
        className={cn("hidden md:block", hasOverflowX ? "overflow-x-auto scroll-thin" : "overflow-visible")}
      >
        <table
          className="w-full border-collapse text-sm"
          onMouseOver={onColOver}
          onMouseLeave={() => setHoverCol(-1)}
        >
          <caption className="sr-only">{caption}</caption>
          <colgroup>
            <col className="w-40" />
            {items.map((item) => (
              <col key={item.id} className={items.length > 2 ? "w-auto" : "w-1/2"} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              <th
                data-col={0}
                scope="col"
                className={cn(
                  "sticky left-0 top-16 z-30 bg-card px-4 py-4 text-left align-bottom font-normal text-xs text-muted-foreground",
                  colTint(0),
                )}
              >
                Product
              </th>
              {items.map((item, idx) => (
                <th
                  key={item.id}
                  data-col={idx + 1}
                  scope="col"
                  className={cn("sticky top-16 z-20 bg-card px-4 py-4 align-bottom", colTint(idx + 1))}
                >
                  <div className="flex flex-col gap-2.5">
                    {item.imageUrl && (
                      <div className="relative aspect-[16/10] w-full max-w-44 overflow-hidden rounded-sm border border-border bg-muted">
                        <Image src={item.imageUrl} alt="" fill sizes="220px" className="object-cover" />
                      </div>
                    )}
                    <div>
                      {pickId === item.id && (
                        <p className="mb-1.5 flex w-fit items-center gap-1 rounded-sm bg-vermilion px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                          <Medal className="h-3 w-3" aria-hidden="true" /> Editors' pick
                        </p>
                      )}
                      {item.url ? (
                        <Link href={item.url} className="font-display text-base font-semibold leading-snug hover:underline underline-offset-4">
                          {item.name}
                        </Link>
                      ) : (
                        <span className="font-display text-base font-semibold leading-snug">{item.name}</span>
                      )}
                      {item.score != null && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground">
                            Our score <span className="font-display text-base font-semibold text-foreground">{item.score.toFixed(1)}</span>
                            <span className="text-muted-foreground/70">/10</span>
                          </p>
                          {/* Score meter: hairline track, vermilion fill — printed scale */}
                          <div
                            className="mt-1.5 h-1 w-full max-w-28 overflow-hidden rounded-full bg-muted"
                            role="img"
                            aria-label={`Score ${item.score.toFixed(1)} out of 10`}
                          >
                            <div
                              className="h-full rounded-full bg-vermilion/90"
                              style={{ width: `${Math.min(100, Math.max(0, item.score * 10))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {item.offer && (
                      <AffiliateButton offerId={item.offer.id} articleSlug={articleSlug} size="sm">
                        {item.offer.price ? `Get it — ${item.offer.price}` : "Check price"}
                      </AffiliateButton>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allAttrs.map((label) => {
              const winner = winnerFor(originalItems, label);
              return (
                <tr key={label} className="border-b border-border last:border-b-0 odd:bg-muted/30">
                  <th
                    data-col={0}
                    scope="row"
                    className={cn(
                      "sticky left-0 z-10 bg-inherit px-4 py-3 text-left align-top text-xs font-medium text-muted-foreground",
                      colTint(0),
                    )}
                  >
                    {label}
                  </th>
                  {items.map((item, idx) => {
                    const attr = attrFor(item, label);
                    const isWinner = items[winner]?.id === item.id && winner !== -1 && sortAttr === "";
                    return (
                      <td
                        key={item.id}
                        data-col={idx + 1}
                        className={cn("px-4 py-3 align-top", colTint(idx + 1), attr ? "" : "text-muted-foreground/50")}
                      >
                        <span className={cn(isWinner && attr && "font-semibold text-foreground")}>
                          {isWinner && attr && (
                            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-vermilion align-middle" aria-hidden="true" />
                          )}
                          {attr?.value ?? "—"}
                        </span>
                        {isWinner && attr && <span className="sr-only"> (best)</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {items.some((i) => i.pros.length > 0 || i.cons.length > 0) && (
              <tr className="border-t-2 border-border">
                <th
                  data-col={0}
                  scope="row"
                  className={cn(
                    "sticky left-0 z-10 bg-card px-4 py-3 text-left align-top text-xs font-medium text-muted-foreground",
                    colTint(0),
                  )}
                >
                  Pros &amp; cons
                </th>
                {items.map((item, idx) => (
                  <td key={item.id} data-col={idx + 1} className={cn("px-4 py-3 align-top", colTint(idx + 1))}>
                    <ul className="space-y-1">
                      {item.pros.slice(0, 3).map((p, i) => (
                        <li key={`p${i}`} className="flex gap-1.5 text-xs leading-relaxed">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                          {p}
                        </li>
                      ))}
                      {item.cons.slice(0, 3).map((c, i) => (
                        <li key={`c${i}`} className="flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
                          <X className="mt-0.5 h-3 w-3 shrink-0 text-vermilion" aria-hidden="true" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {items.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                {pickId === item.id && (
                  <p className="mb-1 flex w-fit items-center gap-1 rounded-sm bg-vermilion px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    <Medal className="h-3 w-3" aria-hidden="true" /> Editors' pick
                  </p>
                )}
                {item.url ? (
                  <Link href={item.url} className="font-display text-lg font-semibold leading-snug">
                    {item.name}
                  </Link>
                ) : (
                  <span className="font-display text-lg font-semibold">{item.name}</span>
                )}
                {item.score != null && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Our score <span className="font-display text-sm font-semibold text-foreground">{item.score.toFixed(1)}</span>/10
                  </p>
                )}
              </div>
              {item.imageUrl && (
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
                  <Image src={item.imageUrl} alt="" fill sizes="96px" className="object-cover" />
                </div>
              )}
            </div>
            {item.summary && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>}
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {allAttrs.map((label) => {
                const attr = attrFor(item, label);
                return (
                  <div key={label} className="flex items-baseline justify-between gap-2 border-b border-border/60 py-1">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className={cn("text-xs", attr ? "text-foreground" : "text-muted-foreground/50")}>{attr?.value ?? "—"}</dd>
                  </div>
                );
              })}
            </dl>
            {(item.pros.length > 0 || item.cons.length > 0) && (
              <ul className="mt-3 space-y-1">
                {item.pros.slice(0, 2).map((p, i) => (
                  <li key={`p${i}`} className="flex gap-1.5 text-xs leading-relaxed">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" /> {p}
                  </li>
                ))}
                {item.cons.slice(0, 2).map((c, i) => (
                  <li key={`c${i}`} className="flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
                    <X className="mt-0.5 h-3 w-3 shrink-0 text-vermilion" aria-hidden="true" /> {c}
                  </li>
                ))}
              </ul>
            )}
            {item.offer && (
              <AffiliateButton offerId={item.offer.id} articleSlug={articleSlug} size="sm" className="mt-4 w-full sm:w-auto">
                {item.offer.price ? `Get it — ${item.offer.price}` : "Check price"}
              </AffiliateButton>
            )}
          </div>
        ))}
      </div>

      <p className="border-t border-border px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        {isDemo ? (
          <>Buy links are affiliate links — we may earn a commission. Prices and availability are shown as examples in this demo.</>
        ) : (
          <>Buy links are affiliate links — we may earn a commission if you buy through them. Check the product page for current price and availability.</>
        )}
      </p>
    </div>
  );
}
