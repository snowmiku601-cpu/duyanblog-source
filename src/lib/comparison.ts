import { z } from "zod";

/**
 * Comparison-engine data contract. ComparisonItem.attributes / pros / cons are
 * stored as JSON strings and validated with these schemas before rendering.
 */

export const comparisonAttributeSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(200),
  numeric: z.number().nullable().optional(),
  /** Which direction wins for this attribute ("high" = bigger is better). */
  direction: z.enum(["high", "low"]).optional(),
});

export const comparisonItemViewSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(140),
  url: z.string().max(300).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  score: z.number().min(0).max(10).nullable().optional(),
  summary: z.string().max(1_200).nullable().optional(),
  attributes: z.array(comparisonAttributeSchema).max(20).default([]),
  pros: z.array(z.string().max(300)).max(8).default([]),
  cons: z.array(z.string().max(300)).max(8).default([]),
  offer: z
    .object({
      id: z.string(),
      label: z.string(),
      price: z.string().nullable().optional(),
      badge: z.string().nullable().optional(),
      merchantName: z.string(),
    })
    .nullable()
    .optional(),
});

export type ComparisonAttribute = z.infer<typeof comparisonAttributeSchema>;
export type ComparisonItemView = z.infer<typeof comparisonItemViewSchema>;

export function parseJsonArray<T>(raw: string | null | undefined, schema: z.ZodType<T>): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = z.array(schema).safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function parseAttributes(raw: string | null | undefined): ComparisonAttribute[] {
  return parseJsonArray(raw, comparisonAttributeSchema);
}

export function parseStringList(raw: string | null | undefined): string[] {
  return parseJsonArray(raw, z.string().max(300));
}

/** Attribute rows shared by every item (union of labels, order-preserving). */
export function attributeRows(items: ComparisonItemView[]): string[] {
  const labels: string[] = [];
  for (const item of items) {
    for (const attr of item.attributes) {
      if (!labels.includes(attr.label)) labels.push(attr.label);
    }
  }
  return labels;
}

export function attrFor(item: ComparisonItemView, label: string): ComparisonAttribute | undefined {
  return item.attributes.find((a) => a.label === label);
}

/** Winner index for an attribute row, or -1 when undecided. */
export function winnerFor(items: ComparisonItemView[], label: string): number {
  const entries = items
    .map((item, i) => ({ i, attr: attrFor(item, label) }))
    .filter((e) => e.attr?.numeric != null);
  if (entries.length < 2) return -1;
  const direction = entries.find((e) => e.attr?.direction)?.attr?.direction ?? "high";
  const values = entries.map((e) => e.attr!.numeric!);
  const target = direction === "high" ? Math.max(...values) : Math.min(...values);
  const winners = entries.filter((e) => e.attr!.numeric === target);
  if (winners.length !== 1) return -1; // tie or duplicated best — no winner shown
  return winners[0]!.i;
}

/** Sortable numeric attributes (for the sort control). */
export function sortableAttributes(items: ComparisonItemView[]): string[] {
  return attributeRows(items).filter((label) =>
    items.some((item) => attrFor(item, label)?.numeric != null)
  );
}
