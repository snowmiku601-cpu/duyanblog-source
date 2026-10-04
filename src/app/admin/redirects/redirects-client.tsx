"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Ban, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/admin-client";
import { analyzeChain, hopCountsFor, normalizePath } from "@/lib/redirect-chain";
import { cn } from "@/lib/utils";
import { FormRow } from "../_components/form-row";

export type RedirectRow = {
  id: string;
  from: string;
  to: string;
  statusCode: number;
  active: boolean;
  createdAt: string;
};

const EMPTY = { from: "", to: "", statusCode: "301", active: true };

export function RedirectsClient({ rows }: { rows: RedirectRow[] }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * Live chain feedback while typing (computed, not an effect).
   * The duplicate check considers every row (the DB path is unique);
   * chain hops mirror the runtime, which serves active rows only.
   */
  const chain = useMemo(() => {
    const from = normalizePath(form.from);
    if (from && rows.some((r) => normalizePath(r.from) === from)) {
      return {
        blocked: `Another redirect already starts at ${from}. Delete or edit that one first.`,
        warning: null,
        hops: 0,
      };
    }
    return analyzeChain(
      rows.filter((r) => r.active),
      { from: form.from, to: form.to },
    );
  }, [rows, form.from, form.to]);

  /** Per-row outgoing hop counts for the table (active rows only, like the runtime). */
  const hopCounts = useMemo(() => hopCountsFor(rows.filter((r) => r.active)), [rows]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!form.from.startsWith("/")) return setError("From must start with “/” (an internal path).");
    if (!form.to.startsWith("/") && !form.to.startsWith("https://")) {
      return setError("To must start with “/” or “https://”.");
    }
    if (chain.blocked) return setError(chain.blocked);
    setBusy(true);
    setError(null);
    const res = await api<{ ok: true; id: string; warning?: string | null }>("/api/admin/redirects", "POST", {
      from: form.from.trim(),
      to: form.to.trim(),
      statusCode: Number(form.statusCode),
      active: form.active,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast({ title: "Redirect added", description: res.data.warning ?? undefined });
    setForm(EMPTY);
  }

  async function onDelete(row: RedirectRow) {
    if (!confirm(`Delete redirect ${row.from} → ${row.to}?`)) return;
    const res = await api(`/api/admin/redirects/${row.id}`, "DELETE");
    if (!res.ok) {
      toast({ title: "Delete failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Redirect deleted" });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onCreate} className="grid items-start gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_100px_auto_auto]" noValidate>
        <div className="contents">
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-2 lg:contents">
            <FormRow label="From" required hint="Internal path, e.g. /old-posts/esim-2023">
              <Input value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} placeholder="/old/path" />
            </FormRow>
            <FormRow label="To" required hint="/internal/path or https://external">
              <Input value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} placeholder="/reviews/esim-2023" />
            </FormRow>
          </div>
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1 lg:contents">
            <FormRow label="Status">
              <Select value={form.statusCode} onValueChange={(v) => setForm((f) => ({ ...f, statusCode: v }))}>
                <SelectTrigger aria-label="Status code">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 — permanent</SelectItem>
                  <SelectItem value="302">302 — temporary</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <div className="flex items-center gap-3 lg:pb-5">
              <Switch id="red-active" checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
              <Label htmlFor="red-active">Active</Label>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1 lg:pb-6">
          <Button type="submit" disabled={busy}>
            <Plus className="h-4 w-4" aria-hidden="true" /> {busy ? "Adding…" : "Add"}
          </Button>
        </div>
      </form>

      {chain.blocked && (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <Ban className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {chain.blocked}
        </p>
      )}
      {!chain.blocked && chain.warning && (
        <p role="status" className="flex items-start gap-2 rounded-md border border-amber-600/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-300/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {chain.warning}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-display text-lg">Nothing yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add the first redirect above.</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto scroll-thin rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const hops = hopCounts.get(row.id) ?? 1;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm">{row.from}</TableCell>
                    <TableCell className="max-w-72 truncate font-mono text-sm" title={row.to}>
                      <span className="inline-flex items-center gap-1">
                        {row.to}
                        {hops > 1 && (
                          <span
                            className="inline-flex items-center gap-0.5 rounded-sm bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground"
                            title={hops === -1 ? `Part of a redirect loop` : `Chains through ${hops} redirects`}
                          >
                            <ArrowRight className="h-3 w-3" aria-hidden="true" />
                            {hops === -1 ? "loop" : `×${hops}`}
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{row.statusCode}</TableCell>
                    <TableCell className="text-sm">{row.active ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(row)}
                        aria-label={`Delete redirect ${row.from}`}
                        className={cn("text-destructive hover:text-destructive")}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
