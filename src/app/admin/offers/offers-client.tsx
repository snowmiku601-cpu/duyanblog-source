"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/admin-client";
import { FormRow } from "../_components/form-row";

export type OfferRow = {
  id: string;
  label: string;
  merchantName: string;
  articleId: string;
  articleTitle: string;
  url: string;
  price: string;
  note: string;
  badge: string;
  isDeal: boolean;
  dealText: string;
  active: boolean;
  order: number;
  clickCount: number;
};

type Option = { id: string; name?: string; title?: string };

type DialogState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; row: OfferRow };

type FormState = {
  merchantId: string;
  articleId: string; // "none" sentinel = site-wide
  label: string;
  url: string;
  price: string;
  note: string;
  badge: string;
  isDeal: boolean;
  dealText: string;
  active: boolean;
  order: string;
};

const EMPTY: FormState = {
  merchantId: "",
  articleId: "none",
  label: "",
  url: "",
  price: "",
  note: "",
  badge: "",
  isDeal: false,
  dealText: "",
  active: true,
  order: "0",
};

export function OffersClient({
  rows,
  merchants,
  articles,
}: {
  rows: OfferRow[];
  merchants: Option[];
  articles: Option[];
}) {
  const { toast } = useToast();
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setForm({ ...EMPTY, merchantId: merchants[0]?.id ?? "" });
    setError(null);
    setDialog({ mode: "create" });
  }

  function openEdit(row: OfferRow) {
    setForm({
      merchantId: merchants.find((m) => m.name === row.merchantName)?.id ?? "",
      articleId: row.articleId || "none",
      label: row.label,
      url: row.url,
      price: row.price,
      note: row.note,
      badge: row.badge,
      isDeal: row.isDeal,
      dealText: row.dealText,
      active: row.active,
      order: String(row.order),
    });
    setError(null);
    setDialog({ mode: "edit", row });
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!form.merchantId) return setError("Choose a merchant — create one under Merchants first.");
    if (!form.label.trim()) return setError("Label is required.");
    if (!form.url.startsWith("https://")) return setError("URL must start with https:// — affiliate destinations are never plain http.");

    setBusy(true);
    setError(null);
    const payload = {
      merchantId: form.merchantId,
      articleId: form.articleId === "none" ? null : form.articleId,
      label: form.label.trim(),
      url: form.url.trim(),
      price: form.price.trim() || null,
      note: form.note.trim() || null,
      badge: form.badge.trim() || null,
      isDeal: form.isDeal,
      dealText: form.dealText.trim() || null,
      active: form.active,
      order: Number(form.order) || 0,
    };
    const res =
      dialog.mode === "edit"
        ? await api(`/api/admin/offers/${dialog.row.id}`, "PUT", payload)
        : await api("/api/admin/offers", "POST", payload);
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast({ title: dialog.mode === "edit" ? "Offer updated" : "Offer created" });
    setDialog({ mode: "closed" });
  }

  async function onDelete(row: OfferRow) {
    if (!confirm(`Delete offer “${row.label}”? This cannot be undone.`)) return;
    const res = await api(`/api/admin/offers/${row.id}`, "DELETE");
    if (!res.ok) {
      toast({ title: "Delete failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Offer deleted" });
  }

  const open = dialog.mode !== "closed";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Offers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Affiliate destinations reached via <code className="rounded-sm bg-muted px-1">/go/[offerId]</code> — URLs must be https.
          </p>
        </div>
        <Button onClick={openCreate} disabled={merchants.length === 0}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New offer
        </Button>
      </header>

      {merchants.length === 0 && (
        <p className="rounded-md border border-ochre/60 bg-accent px-4 py-3 text-sm">
          Create a merchant first — every offer belongs to one.
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-display text-lg">Nothing yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {merchants.length === 0 ? "Create a merchant, then the first offer." : "Create the first offer."}
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto scroll-thin rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Article</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Deal</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-64">
                    <p className="truncate font-medium" title={row.label}>
                      {row.label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" title={row.url}>
                      {row.url.replace(/^https:\/\//, "")}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{row.merchantName}</TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-muted-foreground" title={row.articleTitle}>
                    {row.articleTitle || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{row.badge || "—"}</TableCell>
                  <TableCell className="text-sm">{row.isDeal ? row.dealText || "Deal" : "—"}</TableCell>
                  <TableCell className="text-sm">{row.active ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-sm tabular-nums">{row.order}</TableCell>
                  <TableCell className="text-sm tabular-nums">{row.clickCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={`Edit ${row.label}`}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(row)}
                        aria-label={`Delete ${row.label}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && setDialog({ mode: "closed" })}>
        <DialogContent className="max-h-[90vh] overflow-y-auto scroll-thin sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.mode === "edit" ? "Edit offer" : "New offer"}</DialogTitle>
            <DialogDescription>
              Readers reach the destination through the tracked /go route — the raw URL is never exposed directly.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSave} className="grid gap-4" noValidate>
            <FormRow label="Merchant" required>
              <Select value={form.merchantId} onValueChange={(v) => setForm((f) => ({ ...f, merchantId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Linked article" hint="Optional — scope the offer to one article.">
              <Select
                value={form.articleId}
                onValueChange={(v) => setForm((f) => ({ ...f, articleId: v }))}
                disabled={articles.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (site-wide)</SelectItem>
                  {articles.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Label" required hint='Shown to readers, e.g. "NomadLink — 15% off first eSIM".'>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </FormRow>
            <FormRow label="Destination URL" required hint="Must start with https://">
              <Input
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://merchant.example/deal?ref=duyan"
              />
            </FormRow>
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="Price" hint='Optional, e.g. "$9 / month".'>
                <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </FormRow>
              <FormRow label="Badge" hint='e.g. "Best overall".'>
                <Input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} />
              </FormRow>
            </div>
            <FormRow label="Note" hint="Small print under the button.">
              <Textarea rows={2} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </FormRow>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="off-isdeal"
                  checked={form.isDeal}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isDeal: v }))}
                />
                <Label htmlFor="off-isdeal">Is a deal</Label>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="off-active"
                  checked={form.active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                />
                <Label htmlFor="off-active">Active</Label>
              </div>
            </div>
            {form.isDeal && (
              <FormRow label="Deal text" hint="e.g. “15% off with code DUYAN”.">
                <Input value={form.dealText} onChange={(e) => setForm((f) => ({ ...f, dealText: e.target.value }))} />
              </FormRow>
            )}
            <FormRow label="Order" hint="Lower shows first within an article.">
              <Input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} />
            </FormRow>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialog({ mode: "closed" })} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save offer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
