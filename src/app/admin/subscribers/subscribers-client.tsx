"use client";

import { useMemo, useState } from "react";
import { Download, Link2, LoaderCircle, MailCheck, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DeleteRowButton } from "../_components/delete-row-button";
import { ConfirmedBadge } from "../_components/status-badge";

export type SubscriberRow = {
  id: string;
  email: string;
  source: string | null;
  confirmed: boolean;
  confirmToken: string | null;
  unsubscribeToken: string;
  createdAt: string;
};

export function SubscribersClient({ rows }: { rows: SubscriberRow[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) => r.email.toLowerCase().includes(q) || (r.source ?? "").toLowerCase().includes(q)
    );
  }, [items, query]);

  function remove(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  /**
   * Re-send the double opt-in email. The token rotates server-side, so the
   * row is patched with the fresh token — any previously copied link stops
   * working and the copy button picks up the new one.
   */
  async function resend(row: SubscriberRow) {
    if (resendingId) return;
    setResendingId(row.id);
    const res = await api<{ ok: boolean; delivered?: boolean; confirmToken?: string; confirmUrl?: string }>(
      `/api/admin/subscribers/${row.id}/resend`,
      "POST",
    );
    setResendingId(null);
    if (!res.ok) {
      toast({ title: "Re-send failed", description: res.error, variant: "destructive" });
      return;
    }
    if (res.data.confirmToken) {
      const freshToken = res.data.confirmToken;
      setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, confirmToken: freshToken } : r)));
    }
    if (res.data.delivered) {
      toast({
        title: "Confirmation email sent",
        description: `${row.email} — the fresh link is valid for 48 hours.`,
      });
    } else {
      // Dev transport: nothing was really emailed — copy the link instead.
      if (res.data.confirmUrl) void navigator.clipboard?.writeText(res.data.confirmUrl);
      toast({
        title: "Logged to server console (no mail provider)",
        description: res.data.confirmUrl
          ? `Confirmation link for ${row.email} copied to your clipboard.`
          : row.email,
      });
    }
  }

  function exportCsv() {
    if (items.length === 0) return;
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      ["email", "source", "status", "subscribed_at"].join(","),
      ...items.map((r) =>
        [escape(r.email), escape(r.source ?? ""), r.confirmed ? "confirmed" : "pending", r.createdAt].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `duyanblog-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${items.length} subscriber${items.length === 1 ? "" : "s"} downloaded.` });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email or source…"
            aria-label="Search subscribers"
            className="pl-8"
          />
        </div>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {filtered.length} of {items.length} shown
        </span>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={items.length === 0} className="sm:ml-auto">
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "No subscribers yet — the newsletter form on the site fills this list."
              : `Nothing matches “${query}”.`}
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto scroll-thin rounded-md border border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id} className={cn(!row.confirmed && "bg-amber-500/5")}>
                  <TableCell className="font-medium">
                    {row.email}
                    {!row.confirmed && (
                      <span className="ml-2 align-middle text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        awaiting opt-in
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.source ?? "—"}</TableCell>
                  <TableCell>
                    <ConfirmedBadge confirmed={row.confirmed} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {/* Double opt-in helpers for pending rows: copy the
                          link to hand-deliver it, or re-send the real email. */}
                      {!row.confirmed && row.confirmToken && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-vermilion"
                          aria-label={`Copy confirmation link for ${row.email}`}
                          title="Copy the double opt-in confirmation link (valid 48h)"
                          onClick={() => {
                            const url = `${window.location.origin}/newsletter/confirm?token=${row.confirmToken}`;
                            void navigator.clipboard?.writeText(url);
                            toast({ title: "Confirmation link copied", description: row.email });
                          }}
                        >
                          <MailCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                      {!row.confirmed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={resendingId === row.id}
                          className="h-8 w-8 text-muted-foreground hover:text-vermilion"
                          aria-label={`Re-send the confirmation email to ${row.email}`}
                          title="Re-send the confirmation email (rotates the link)"
                          onClick={() => void resend(row)}
                        >
                          {resendingId === row.id ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Copy unsubscribe link for ${row.email}`}
                        title="Copy the one-click unsubscribe link"
                        onClick={() => {
                          const url = `${window.location.origin}/newsletter/unsubscribe?token=${row.unsubscribeToken}`;
                          void navigator.clipboard?.writeText(url);
                          toast({ title: "Unsubscribe link copied", description: row.email });
                        }}
                      >
                        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <DeleteRowButton
                        label={row.email}
                        path={`/api/admin/subscribers/${row.id}`}
                        confirmText={`Remove ${row.email} from the newsletter list?`}
                        onDeleted={() => remove(row.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
