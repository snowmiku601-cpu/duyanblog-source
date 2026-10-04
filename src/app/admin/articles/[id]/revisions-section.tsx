"use client";

import { useMemo, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api, formatDate } from "@/lib/admin-client";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

export type RevisionRow = {
  id: string;
  title: string;
  note: string | null;
  createdAt: string;
  bytes: number;
  blockCount: number;
};

type RevisionDetail = {
  id: string;
  title: string;
  note: string | null;
  createdAt: string;
  blocks: unknown[];
};

type CurrentContent = { title: string; blocks: unknown[] };

/* ------------------------------------------------------------------ */
/* Diff helpers — pure functions over parsed content blocks.           */
/* ------------------------------------------------------------------ */

const BLOCK_LABELS: Record<string, string> = {
  paragraph: "Paragraphs",
  heading: "Headings",
  list: "Lists",
  quote: "Quotes",
  callout: "Callouts",
  prosCons: "Pros & cons",
  stats: "Stat blocks",
  table: "Tables",
  image: "Images",
  pick: "Picks",
  comparisonEmbed: "Comparison embeds",
  offerEmbed: "Offer embeds",
  faq: "FAQ blocks",
  sources: "Source blocks",
  divider: "Dividers",
};

function words(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Human-readable text of one block (for word counting). */
function blockText(b: Record<string, unknown>): string {
  switch (b.type) {
    case "paragraph":
    case "heading":
    case "quote":
    case "callout":
      return String(b.text ?? "");
    case "list":
      return ((b.items as string[] | undefined) ?? []).join(" ");
    case "prosCons":
      return [...((b.pros as string[] | undefined) ?? []), ...((b.cons as string[] | undefined) ?? [])].join(" ");
    case "stats":
      return (((b.items as { value: string; label: string }[] | undefined) ?? []))
        .map((i) => `${i.value} ${i.label}`)
        .join(" ");
    case "table":
      return [...((b.head as string[] | undefined) ?? []), ...(((b.rows as string[][] | undefined) ?? []).flat())].join(" ");
    case "image":
      return `${b.alt ?? ""} ${b.caption ?? ""}`;
    case "pick":
      return `${b.name ?? ""} ${b.badge ?? ""} ${b.blurb ?? ""}`;
    case "faq":
      return (((b.items as { q: string; a: string }[] | undefined) ?? []))
        .map((i) => `${i.q} ${i.a}`)
        .join(" ");
    case "sources":
      return (((b.items as { label: string }[] | undefined) ?? [])).map((i) => i.label).join(" ");
    default:
      return "";
  }
}

function countWords(blocks: unknown[]): number {
  return blocks.reduce<number>(
    (sum, b) => sum + words(blockText(b as Record<string, unknown>)),
    0
  );
}

type Heading = { level: number; text: string };

function headingsOf(blocks: unknown[]): Heading[] {
  return blocks.flatMap((b) => {
    const block = b as Record<string, unknown>;
    return block.type === "heading"
      ? [{ level: Number(block.level) || 2, text: String(block.text ?? "") }]
      : [];
  });
}

function compositionOf(blocks: unknown[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const b of blocks) {
    const type = String((b as Record<string, unknown>).type);
    map.set(type, (map.get(type) ?? 0) + 1);
  }
  return map;
}

type DiffResult = {
  identical: boolean;
  titleChanged: boolean;
  /** Headings present in the snapshot but missing from current (restore gains them). */
  gainedHeadings: Heading[];
  /** Headings present in current but missing from the snapshot (restore removes them). */
  lostHeadings: Heading[];
  gainedTypes: [string, number][];
  lostTypes: [string, number][];
  wordsSnapshot: number;
  wordsCurrent: number;
  blocksSnapshot: number;
  blocksCurrent: number;
  /** 0-based index of the first differing block, or null. */
  firstDiff: number | null;
};

function diffBlocks(
  snapshot: { title: string; blocks: unknown[] },
  current: { title: string; blocks: unknown[] },
): DiffResult {
  const titleChanged = snapshot.title !== current.title;

  const hs = headingsOf(snapshot.blocks);
  const hc = headingsOf(current.blocks);
  const key = (h: Heading) => `${h.level}:${h.text}`;
  const hcSet = new Set(hc.map(key));
  const hsSet = new Set(hs.map(key));

  const cs = compositionOf(snapshot.blocks);
  const cc = compositionOf(current.blocks);
  const types = new Set([...cs.keys(), ...cc.keys()]);
  const gainedTypes: [string, number][] = [];
  const lostTypes: [string, number][] = [];
  for (const t of types) {
    const a = cs.get(t) ?? 0;
    const b = cc.get(t) ?? 0;
    if (a > b) gainedTypes.push([t, a - b]);
    if (b > a) lostTypes.push([t, b - a]);
  }

  let firstDiff: number | null = null;
  const min = Math.min(snapshot.blocks.length, current.blocks.length);
  for (let i = 0; i < min; i++) {
    if (JSON.stringify(snapshot.blocks[i]) !== JSON.stringify(current.blocks[i])) {
      firstDiff = i;
      break;
    }
  }
  if (firstDiff === null && snapshot.blocks.length !== current.blocks.length) {
    firstDiff = min;
  }

  return {
    identical: !titleChanged && firstDiff === null && snapshot.blocks.length === current.blocks.length,
    titleChanged,
    gainedHeadings: hs.filter((h) => !hcSet.has(key(h))),
    lostHeadings: hc.filter((h) => !hsSet.has(key(h))),
    gainedTypes,
    lostTypes,
    wordsSnapshot: countWords(snapshot.blocks),
    wordsCurrent: countWords(current.blocks),
    blocksSnapshot: snapshot.blocks.length,
    blocksCurrent: current.blocks.length,
    firstDiff,
  };
}

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground">±0</span>;
  return (
    <span className={value > 0 ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium text-vermilion"}>
      {value > 0 ? "+" : "−"}
      {Math.abs(value)}
    </span>
  );
}

function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

/**
 * Revision history for one article: every admin save snapshots the content.
 * Restore rolls title + blocks back to a snapshot; the pre-restore content is
 * itself snapshotted first, so a restore is reversible. The View dialog opens
 * on a summary diff (what restoring would gain/remove) with the raw JSON one
 * tab away.
 */
export function RevisionsSection({
  articleId,
  current,
}: {
  articleId: string;
  current: CurrentContent;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RevisionRow[] | null>(null);
  const [detail, setDetail] = useState<RevisionDetail | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    const res = await api<{ revisions: RevisionRow[] }>(
      `/api/admin/articles/${articleId}/revisions`,
      "GET"
    );
    if (res.ok) setRows(res.data.revisions);
    else toast({ title: "Could not load revisions", description: res.error, variant: "destructive" });
  };

  function toggle(next: boolean) {
    setOpen(next);
    // Lazy-load on first expand (event handler, not an effect).
    if (next && rows === null) void load();
  }

  async function view(row: RevisionRow) {
    const res = await api<{ revision: RevisionDetail }>(
      `/api/admin/articles/${articleId}/revisions/${row.id}`,
      "GET"
    );
    if (res.ok) setDetail(res.data.revision);
    else toast({ title: "Could not open revision", description: res.error, variant: "destructive" });
  }

  async function restore(revisionId: string) {
    setConfirmId(null);
    if (restoringId) return;
    setRestoringId(revisionId);
    const res = await api(`/api/admin/articles/${articleId}/revisions/${revisionId}/restore`, "POST");
    setRestoringId(null);
    if (res.ok) {
      toast({ title: "Revision restored", description: "The pre-restore content was kept as a new snapshot." });
      setRows(null);
      setDetail(null);
      // Re-render the server form with the restored title/blocks.
      window.location.reload();
    } else {
      toast({ title: "Restore failed", description: res.error, variant: "destructive" });
    }
  }

  const diff = useMemo(
    () => (detail ? diffBlocks({ title: detail.title, blocks: detail.blocks }, current) : null),
    [detail, current]
  );

  const jsonPretty = detail ? JSON.stringify(detail.blocks, null, 2) : "";

  return (
    <Collapsible open={open} onOpenChange={toggle} className="mt-8">
      <div className="rounded-md border border-border bg-card">
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-5 py-4 text-left hover:bg-accent/40">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-display font-semibold">Revision history</span>
          <span className="ml-auto text-xs text-muted-foreground">
            A snapshot is saved on every save — restores keep a backup of the current content
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border p-5">
            {rows === null ? (
              <p className="py-4 text-sm text-muted-foreground">Loading revisions…</p>
            ) : rows.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No revisions yet — they are created the first time you save this article.
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto scroll-thin rounded-md border border-border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Blocks</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(row.createdAt)}</TableCell>
                        <TableCell className="max-w-56 truncate" title={row.title}>{row.title}</TableCell>
                        <TableCell className="max-w-44 truncate text-muted-foreground" title={row.note ?? ""}>
                          {row.note ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.blockCount}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatBytes(row.bytes)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => void view(row)}>
                              View
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={restoringId !== null}
                              onClick={() => setConfirmId(row.id)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                              {restoringId === row.id ? "Restoring…" : "Restore"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>

      {/* Snapshot preview — summary diff by default, raw JSON one tab away */}
      <Dialog open={detail !== null} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">{detail?.title}</DialogTitle>
            <DialogDescription>
              {detail ? `Snapshot from ${formatDate(detail.createdAt)}${detail.note ? ` — ${detail.note}` : ""}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detail && diff && (
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary diff</TabsTrigger>
                <TabsTrigger value="json">Raw JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                {diff.identical ? (
                  <p className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    This snapshot is identical to the current version — nothing would change on restore.
                  </p>
                ) : (
                  <div className="flex flex-col gap-5">
                    {/* What restoring changes, in editor terms */}
                    <div className="rounded-md border border-border bg-muted/30 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Restoring this snapshot would
                      </p>
                      <ul className="mt-2 flex flex-col gap-y-1.5 text-sm">
                        {diff.titleChanged && (
                          <li className="flex flex-wrap items-baseline gap-x-1.5">
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">bring back</span>
                            <span>
                              the title <span className="font-medium">“{detail.title}”</span>{" "}
                              <span className="text-muted-foreground">(current: “{current.title}”)</span>
                            </span>
                          </li>
                        )}
                        {diff.gainedHeadings.length > 0 && (
                          <li className="flex flex-wrap items-baseline gap-x-1.5">
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">bring back</span>
                            <span>
                              {diff.gainedHeadings.length} heading{diff.gainedHeadings.length === 1 ? "" : "s"}{" "}
                              <span className="text-muted-foreground">
                                {diff.gainedHeadings.map((h) => `“${h.text}”`).join(", ")}
                              </span>
                            </span>
                          </li>
                        )}
                        {diff.lostHeadings.length > 0 && (
                          <li className="flex flex-wrap items-baseline gap-x-1.5">
                            <span className="font-medium text-vermilion">remove</span>
                            <span>
                              {diff.lostHeadings.length} heading{diff.lostHeadings.length === 1 ? "" : "s"}{" "}
                              <span className="text-muted-foreground">
                                {diff.lostHeadings.map((h) => `“${h.text}”`).join(", ")}
                              </span>
                            </span>
                          </li>
                        )}
                        {diff.gainedTypes.length > 0 && (
                          <li className="flex flex-wrap items-baseline gap-x-1.5">
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">bring back</span>
                            <span>
                              {diff.gainedTypes
                                .map(([t, n]) => `${n} ${BLOCK_LABELS[t] ?? t}`.toLowerCase())
                                .join(", ")}
                            </span>
                          </li>
                        )}
                        {diff.lostTypes.length > 0 && (
                          <li className="flex flex-wrap items-baseline gap-x-1.5">
                            <span className="font-medium text-vermilion">remove</span>
                            <span>
                              {diff.lostTypes
                                .map(([t, n]) => `${n} ${BLOCK_LABELS[t] ?? t}`.toLowerCase())
                                .join(", ")}
                            </span>
                          </li>
                        )}
                        {diff.gainedHeadings.length === 0 &&
                          diff.lostHeadings.length === 0 &&
                          diff.gainedTypes.length === 0 &&
                          diff.lostTypes.length === 0 &&
                          !diff.titleChanged && (
                            <li className="text-muted-foreground">
                              Change{diff.firstDiff !== null ? " starts" : "s"} inside block{" "}
                              {(diff.firstDiff ?? 0) + 1} — same structure, edited text. Use the Raw JSON tab to
                              inspect it.
                            </li>
                          )}
                      </ul>
                    </div>

                    {/* Stat strip */}
                    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border text-center">
                      <div className="bg-card px-3 py-2.5">
                        <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Words</dt>
                        <dd className="mt-0.5 font-display text-sm font-semibold tabular-nums">
                          {diff.wordsSnapshot} <span className="text-muted-foreground">vs {diff.wordsCurrent}</span>{" "}
                          <Delta value={diff.wordsSnapshot - diff.wordsCurrent} />
                        </dd>
                      </div>
                      <div className="bg-card px-3 py-2.5">
                        <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Blocks</dt>
                        <dd className="mt-0.5 font-display text-sm font-semibold tabular-nums">
                          {diff.blocksSnapshot} <span className="text-muted-foreground">vs {diff.blocksCurrent}</span>{" "}
                          <Delta value={diff.blocksSnapshot - diff.blocksCurrent} />
                        </dd>
                      </div>
                      <div className="bg-card px-3 py-2.5">
                        <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">First change</dt>
                        <dd className="mt-0.5 font-display text-sm font-semibold tabular-nums">
                          {diff.firstDiff === null ? "—" : `block ${(diff.firstDiff + 1).toString()}`}
                        </dd>
                      </div>
                    </dl>

                    {/* Side-by-side heading outlines */}
                    <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
                      {(
                        [
                          { label: "Snapshot outline", headings: headingsOf(detail.blocks) },
                          { label: "Current outline", headings: headingsOf(current.blocks) },
                        ] as const
                      ).map((side) => (
                        <div key={side.label} className="min-h-24 bg-card p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {side.label}
                          </p>
                          {side.headings.length === 0 ? (
                            <p className="mt-2 text-xs text-muted-foreground">No headings.</p>
                          ) : (
                            <ol className="mt-2 space-y-1">
                              {side.headings.map((h, i) => (
                                <li
                                  key={i}
                                  className={cn(
                                    "text-xs leading-relaxed",
                                    h.level === 3 && "pl-4 text-muted-foreground",
                                  )}
                                >
                                  <span className="mr-1.5 inline-block w-3 text-muted-foreground/60" aria-hidden="true">
                                    {h.level === 2 ? "§" : "–"}
                                  </span>
                                  {h.text}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="json" className="mt-4">
                <pre className="max-h-96 overflow-auto scroll-thin rounded-md border border-border bg-muted/40 p-4 text-xs leading-relaxed">
                  {jsonPretty}
                </pre>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void navigator.clipboard?.writeText(jsonPretty)}
                  >
                    Copy JSON
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDetail(null)}
            >
              Close
            </Button>
            <Button onClick={() => detail && void restore(detail.id)} disabled={restoringId !== null || detail === null}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Restore this version
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore confirmation */}
      <Dialog open={confirmId !== null} onOpenChange={(v) => !v && setConfirmId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restore this revision?</DialogTitle>
            <DialogDescription>
              The article&apos;s title and content blocks will be replaced by the snapshot.
              The current content is saved as a new revision first, so you can undo this.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmId && void restore(confirmId)} disabled={restoringId !== null}>
              {restoringId ? "Restoring…" : "Restore"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}
