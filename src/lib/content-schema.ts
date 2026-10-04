import { z } from "zod";

/**
 * Structured content blocks for articles.
 *
 * Articles store a JSON array of these blocks in Article.blocks. The admin
 * editor validates against this schema before persisting, and the public
 * renderer re-validates before rendering — invalid blocks are dropped rather
 * than crashing a page.
 *
 * Inline text conventions (see src/components/editorial/inline-text.tsx):
 *   **bold**  *italic*  `code`  [label](https://…)  [label](/internal/path)
 *   [label](go:OFFER_ID)  → renders as a tracked affiliate link (/go/OFFER_ID)
 */

const inlineText = z.string().min(1).max(8_000);

export const paragraphBlock = z.object({
  type: z.literal("paragraph"),
  text: inlineText,
});

export const headingBlock = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string().min(1).max(300),
});

export const listBlock = z.object({
  type: z.literal("list"),
  ordered: z.boolean().default(false),
  items: z.array(inlineText).min(1).max(30),
});

export const quoteBlock = z.object({
  type: z.literal("quote"),
  text: inlineText,
  attribution: z.string().max(200).optional(),
});

export const calloutBlock = z.object({
  type: z.literal("callout"),
  variant: z.enum(["note", "warning", "tip"]),
  title: z.string().max(120).optional(),
  text: inlineText,
});

export const prosConsBlock = z.object({
  type: z.literal("prosCons"),
  title: z.string().max(120).optional(),
  pros: z.array(z.string().max(300)).max(12),
  cons: z.array(z.string().max(300)).max(12),
});

export const statsBlock = z.object({
  type: z.literal("stats"),
  items: z
    .array(z.object({ value: z.string().max(24), label: z.string().max(80) }))
    .min(1)
    .max(6),
});

export const tableBlock = z.object({
  type: z.literal("table"),
  caption: z.string().max(300).optional(),
  head: z.array(z.string().max(80)).min(1).max(8),
  rows: z.array(z.array(z.string().max(300)).min(1).max(8)).min(1).max(40),
});

export const imageBlock = z.object({
  type: z.literal("image"),
  src: z.string().min(1).max(500),
  alt: z.string().min(1).max(400),
  caption: z.string().max(300).optional(),
  credit: z.string().max(120).optional(),
});

export const pickBlock = z.object({
  type: z.literal("pick"),
  rank: z.number().int().min(1).max(100),
  name: z.string().min(1).max(140),
  blurb: z.string().min(1).max(1_200),
  badge: z.string().max(60).optional(),
  imageUrl: z.string().max(500).optional(),
  offerId: z.string().max(64).optional(),
  url: z.string().max(300).optional(),
});

export const comparisonEmbedBlock = z.object({
  type: z.literal("comparisonEmbed"),
  comparisonSlug: z.string().min(1).max(120),
});

export const offerEmbedBlock = z.object({
  type: z.literal("offerEmbed"),
  offerId: z.string().min(1).max(64),
});

export const faqBlock = z.object({
  type: z.literal("faq"),
  title: z.string().max(120).default("Frequently asked questions"),
  items: z
    .array(z.object({ q: z.string().min(1).max(300), a: z.string().min(1).max(1_500) }))
    .min(1)
    .max(15),
});

export const sourcesBlock = z.object({
  type: z.literal("sources"),
  title: z.string().max(120).default("Sources & further reading"),
  items: z
    .array(z.object({ label: z.string().min(1).max(200), url: z.string().max(500).optional() }))
    .min(1)
    .max(25),
});

export const dividerBlock = z.object({
  type: z.literal("divider"),
});

export const blockSchema = z.discriminatedUnion("type", [
  paragraphBlock,
  headingBlock,
  listBlock,
  quoteBlock,
  calloutBlock,
  prosConsBlock,
  statsBlock,
  tableBlock,
  imageBlock,
  pickBlock,
  comparisonEmbedBlock,
  offerEmbedBlock,
  faqBlock,
  sourcesBlock,
  dividerBlock,
]);

export const blocksSchema = z.array(blockSchema).max(300);

export type Block = z.infer<typeof blockSchema>;
export type PickBlockData = z.infer<typeof pickBlock>;
export type ProsConsBlockData = z.infer<typeof prosConsBlock>;

/** Parse + validate a blocks JSON string. Invalid entries are dropped. */
export function parseBlocks(json: string | null | undefined): Block[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    const result = blocksSchema.safeParse(parsed);
    if (result.success) return result.data;
    // Keep valid blocks individually so one bad block cannot break a page.
    if (Array.isArray(parsed)) {
      const ok: Block[] = [];
      for (const item of parsed) {
        const r = blockSchema.safeParse(item);
        if (r.success) ok.push(r.data);
      }
      return ok;
    }
    return [];
  } catch {
    return [];
  }
}

/** JSON-stringify blocks, throwing on invalid content (used by admin). */
export function serializeBlocks(blocks: unknown): string {
  const result = blocksSchema.parse(blocks);
  return JSON.stringify(result);
}

export function extractHeadings(blocks: Block[]): { id: string; text: string; level: number }[] {
  return blocks
    .filter((b): b is z.infer<typeof headingBlock> => b.type === "heading")
    .map((b) => ({ id: slugifyHeading(b.text), text: b.text, level: b.level }));
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "section";
}
