"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, slugify } from "@/lib/admin-client";
import { MediaField } from "@/components/admin/media-field";
import { FormRow } from "../_components/form-row";
import { JsonField, parseJsonField } from "../_components/json-field";

export type ComparisonEditorItem = {
  name: string;
  url: string;
  imageUrl: string;
  score: string;
  summary: string;
  offerId: string; // "" = none
  order: string;
  attributes: string;
  pros: string;
  cons: string;
};

export type ComparisonEditorData = {
  id: string;
  title: string;
  slug: string;
  intro: string;
  articleId: string; // "" = none
  items: ComparisonEditorItem[];
};

const ATTR_HINT = `[{"label":"Battery life","value":"18 h","numeric":18,"direction":"high"}] — numeric optional; direction "high" (bigger wins) or "low".`;
const LIST_HINT = `Plain JSON array of strings, e.g. ["Two USB-C ports","No bloatware"].`;

function emptyItem(index: number): ComparisonEditorItem {
  return {
    name: "",
    url: "",
    imageUrl: "",
    score: "",
    summary: "",
    offerId: "",
    order: String(index),
    attributes: "",
    pros: "",
    cons: "",
  };
}

export function ComparisonEditor({
  initial,
  articles,
  offers,
  media,
}: {
  initial: ComparisonEditorData;
  articles: { id: string; title: string }[];
  offers: { id: string; label: string }[];
  media: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isNew = initial.id === "";
  const slugTouched = useRef(!isNew);

  const [data, setData] = useState<ComparisonEditorData>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setHeader<K extends keyof ComparisonEditorData>(key: K, value: ComparisonEditorData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function setItem(index: number, patch: Partial<ComparisonEditorItem>) {
    setData((d) => ({
      ...d,
      items: d.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!data.title.trim()) return setError("Title is required.");
    if (!data.slug.trim()) return setError("Slug is required.");

    const items: Record<string, unknown>[] = [];
    for (const [i, item] of data.items.entries()) {
      if (!item.name.trim()) return setError(`Item ${i + 1}: name is required.`);
      const attributes = parseJsonField(`Item ${i + 1} attributes`, item.attributes, []);
      if (!attributes.ok) return setError(attributes.error);
      const pros = parseJsonField(`Item ${i + 1} pros`, item.pros, []);
      if (!pros.ok) return setError(pros.error);
      const cons = parseJsonField(`Item ${i + 1} cons`, item.cons, []);
      if (!cons.ok) return setError(cons.error);
      items.push({
        name: item.name.trim(),
        url: item.url.trim() || null,
        imageUrl: item.imageUrl.trim() || null,
        score: item.score.trim() === "" ? null : Number(item.score),
        summary: item.summary.trim() || null,
        offerId: item.offerId || null,
        order: Number(item.order) || i,
        attributes: attributes.data,
        pros: pros.data,
        cons: cons.data,
      });
    }

    setError(null);
    setBusy(true);
    const payload = {
      title: data.title.trim(),
      slug: data.slug.trim(),
      intro: data.intro.trim() || null,
      articleId: data.articleId || null,
      items,
    };
    const res = isNew
      ? await api<{ ok: boolean; id?: string }>("/api/admin/comparisons", "POST", payload)
      : await api(`/api/admin/comparisons/${data.id}`, "PUT", payload);

    if (!res.ok) {
      setError(res.error);
      toast({ title: "Save failed", description: res.error, variant: "destructive" });
      setBusy(false);
      return;
    }
    toast({ title: "Comparison saved" });
    router.push("/admin/comparisons");
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-6" noValidate>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {isNew ? "New comparison" : "Edit comparison"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Public table at <code className="rounded-sm bg-muted px-1">/compare/{data.slug || "slug"}</code>. Saving replaces all items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/comparisons")} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {busy ? "Saving…" : "Save comparison"}
          </Button>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
          <FormRow label="Title" required>
            <Input
              value={data.title}
              onChange={(e) => {
                const title = e.target.value;
                setData((d) => ({ ...d, title, slug: slugTouched.current ? d.slug : slugify(title) }));
              }}
              placeholder="NomadLink vs AeroSIM vs GlobalRoam"
            />
          </FormRow>
          <FormRow label="Slug" required>
            <Input
              value={data.slug}
              onChange={(e) => {
                slugTouched.current = true;
                setHeader("slug", e.target.value);
              }}
            />
          </FormRow>
          <FormRow label="Intro" className="sm:col-span-2" hint="Optional lead-in shown above the table.">
            <Textarea rows={2} value={data.intro} onChange={(e) => setHeader("intro", e.target.value)} />
          </FormRow>
          <FormRow label="Linked article" hint="Optional — the versus article this table belongs to.">
            <Select value={data.articleId || "none"} onValueChange={(v) => setHeader("articleId", v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {articles.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        </CardContent>
      </Card>

      {data.items.map((item, i) => (
        <Card key={i}>
          <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="col-span-full flex items-center justify-between">
              <p className="font-display text-lg font-semibold">Item {i + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove item ${i + 1}`}
                className="text-destructive hover:text-destructive"
                onClick={() => setData((d) => ({ ...d, items: d.items.filter((_, j) => j !== i) }))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <FormRow label="Name" required>
              <Input value={item.name} onChange={(e) => setItem(i, { name: e.target.value })} />
            </FormRow>
            <FormRow label="Link" hint="Optional internal article or section path.">
              <Input
                value={item.url}
                onChange={(e) => setItem(i, { url: e.target.value })}
                placeholder="/reviews/nomadlink-esim"
              />
            </FormRow>
            <FormRow
              label="Image"
              hint="Optional — pick from the library or upload a new file."
            >
              <MediaField
                id={`ci-${i}-image`}
                value={item.imageUrl}
                onChange={(v) => setItem(i, { imageUrl: v })}
                media={media}
                placeholder="/images/picks/item.png"
                browseLabel={`Use as the image for ${item.name || `item ${i + 1}`}`}
                emptyHint="Optional — table headers and mobile cards show it next to the name."
              />
            </FormRow>
            <FormRow label="Score" hint="0–10, shown with the pick badge.">
              <Input
                type="number"
                step="0.1"
                min={0}
                max={10}
                value={item.score}
                onChange={(e) => setItem(i, { score: e.target.value })}
              />
            </FormRow>
            <FormRow label="Summary" className="sm:col-span-2" hint="One or two sentences under the item name.">
              <Textarea rows={2} value={item.summary} onChange={(e) => setItem(i, { summary: e.target.value })} />
            </FormRow>
            <FormRow label="Offer" hint="Optional affiliate offer attached to this item.">
              <Select value={item.offerId || "none"} onValueChange={(v) => setItem(i, { offerId: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {offers.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Order" hint="Lower shows first.">
              <Input
                type="number"
                value={item.order}
                onChange={(e) => setItem(i, { order: e.target.value })}
              />
            </FormRow>
            <JsonField
              label="Attributes (JSON)"
              value={item.attributes}
              onChange={(v) => setItem(i, { attributes: v })}
              hint={ATTR_HINT}
              rows={4}
            />
            <JsonField label="Pros (JSON)" value={item.pros} onChange={(v) => setItem(i, { pros: v })} hint={LIST_HINT} rows={3} />
            <JsonField label="Cons (JSON)" value={item.cons} onChange={(v) => setItem(i, { cons: v })} hint={LIST_HINT} rows={3} />
          </CardContent>
        </Card>
      ))}

      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setData((d) => ({ ...d, items: [...d.items, emptyItem(d.items.length)] }))}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add item
        </Button>
        {data.items.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">No items yet — add at least two for a real comparison.</p>
        )}
      </div>
    </form>
  );
}
