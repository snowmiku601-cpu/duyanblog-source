"use client";

import { useRef, useState } from "react";
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
import { api, slugify } from "@/lib/admin-client";
import { FormRow } from "../_components/form-row";

export type MerchantRow = {
  id: string;
  slug: string;
  name: string;
  website: string;
  note: string;
  offerCount: number;
};

type DialogState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; row: MerchantRow };

const EMPTY = { name: "", slug: "", website: "", note: "" };

export function MerchantsClient({ rows }: { rows: MerchantRow[] }) {
  const { toast } = useToast();
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slugTouched = useRef(false);

  function openCreate() {
    slugTouched.current = false;
    setForm(EMPTY);
    setError(null);
    setDialog({ mode: "create" });
  }

  function openEdit(row: MerchantRow) {
    slugTouched.current = true;
    setForm({ name: row.name, slug: row.slug, website: row.website, note: row.note });
    setError(null);
    setDialog({ mode: "edit", row });
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.slug.trim()) return setError("Slug is required.");

    setBusy(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      website: form.website.trim() || null,
      note: form.note.trim() || null,
    };
    const res =
      dialog.mode === "edit"
        ? await api(`/api/admin/merchants/${dialog.row.id}`, "PUT", payload)
        : await api("/api/admin/merchants", "POST", payload);
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast({ title: dialog.mode === "edit" ? "Merchant updated" : "Merchant created" });
    setDialog({ mode: "closed" });
  }

  async function onDelete(row: MerchantRow) {
    if (!confirm(`Delete merchant “${row.name}”? This cannot be undone.`)) return;
    const res = await api(`/api/admin/merchants/${row.id}`, "DELETE");
    if (!res.ok) {
      toast({ title: "Delete failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Merchant deleted" });
  }

  const open = dialog.mode !== "closed";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Merchants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Retailers behind affiliate offers. Demo merchants should say so in the note.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New merchant
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-display text-lg">Nothing yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create the first merchant — offers attach to them.
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto scroll-thin rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Offers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.slug}</TableCell>
                  <TableCell className="max-w-56 truncate text-sm">
                    {row.website ? (
                      <a href={row.website} target="_blank" rel="noreferrer nofollow sponsored" className="underline underline-offset-2">
                        {row.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-sm text-muted-foreground">{row.note || "—"}</TableCell>
                  <TableCell className="text-sm tabular-nums">{row.offerCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(row)}
                        aria-label={`Delete ${row.name}`}
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
            <DialogTitle>{dialog.mode === "edit" ? "Edit merchant" : "New merchant"}</DialogTitle>
            <DialogDescription>Offers on articles and the deals page point here via /go links.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSave} className="grid gap-4" noValidate>
            <FormRow label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: slugTouched.current ? f.slug : slugify(name) }));
                }}
              />
            </FormRow>
            <FormRow label="Slug" required>
              <Input
                value={form.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
            </FormRow>
            <FormRow label="Website" hint="Full https:// URL of the merchant.">
              <Input
                type="url"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://example.com"
              />
            </FormRow>
            <FormRow label="Note" hint="Internal only, e.g. “Fictional demo merchant”.">
              <Textarea rows={2} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
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
                {busy ? "Saving…" : "Save merchant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
