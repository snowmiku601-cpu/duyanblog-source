import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { parseAttributes, parseStringList } from "@/lib/comparison";
import { InlineText } from "@/components/editorial/inline-text";
import { ProsCons } from "@/components/editorial/pros-cons";
import { MerchantOffer, type OfferView } from "@/components/affiliate/merchant-offer";
import { AffiliateDisclosure } from "@/components/affiliate/affiliate-link";
import { ComparisonTable } from "@/components/comparison-table";
import { ComparisonOffer } from "@/components/affiliate/merchant-offer";
import { ComparisonItemView, comparisonItemViewSchema } from "@/lib/comparison";
import type { Block } from "@/lib/content-schema";
import { slugifyHeading } from "@/lib/content-schema";
import { articlePath } from "@/lib/site";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/**
 * Renders validated content blocks server-side. Embeds (offers, comparisons)
 * fetch their rows from the database — articles never hardcode affiliate URLs
 * or comparison data in JSX.
 */

async function getOfferView(offerId: string): Promise<OfferView | null> {
  const offer = await db.affiliateOffer.findFirst({
    where: { id: offerId, active: true },
    include: { merchant: true },
  });
  if (!offer) return null;
  return {
    id: offer.id,
    label: offer.label,
    url: offer.url,
    price: offer.price,
    currency: offer.currency,
    note: offer.note,
    badge: offer.badge,
    isDeal: offer.isDeal,
    dealText: offer.dealText,
    merchantName: offer.merchant.name,
  };
}

async function getComparisonItems(slug: string): Promise<{ title: string; items: ComparisonItemView[] } | null> {
  const comparison = await db.comparison.findUnique({
    where: { slug },
    include: { items: { orderBy: { order: "asc" }, include: { offer: { include: { merchant: true } } } } },
  });
  if (!comparison) return null;
  const items: ComparisonItemView[] = comparison.items.map((item) => {
    const offer = item.offer;
    const parsed = comparisonItemViewSchema.safeParse({
      id: item.id,
      name: item.name,
      url: item.url,
      imageUrl: item.imageUrl,
      score: item.score,
      summary: item.summary,
      attributes: parseAttributes(item.attributes),
      pros: parseStringList(item.pros),
      cons: parseStringList(item.cons),
      offer: offer
        ? {
            id: offer.id,
            label: offer.label,
            price: offer.price,
            badge: offer.badge,
            merchantName: offer.merchant.name,
          }
        : null,
    });
    return parsed.success ? parsed.data : null;
  }).filter((x): x is ComparisonItemView => x !== null);
  return { title: comparison.title, items };
}

const calloutStyles = {
  note: { icon: Info, border: "border-l-sun", bg: "bg-secondary/20", label: "Note" },
  tip: { icon: Lightbulb, border: "border-l-primary", bg: "bg-primary/5", label: "Tip" },
  warning: { icon: AlertTriangle, border: "border-l-vermilion", bg: "bg-vermilion/5", label: "Watch out" },
} as const;

export async function ArticleRenderer({
  blocks,
  articleSlug,
  className,
  dropCap = false,
  isDemo,
}: {
  blocks: Block[];
  articleSlug?: string;
  className?: string;
  /** Editorial drop cap on the opening paragraph (long-form types). */
  dropCap?: boolean;
  /** Demo context — REQUIRED so a caller cannot omit it and let sample commerce look real. */
  isDemo: boolean;
}) {
  if (blocks.length === 0) return null;
  const out: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    const key = `${block.type}-${i}`;
    switch (block.type) {
      case "paragraph":
        out.push(
          <p
            key={key}
            className={cn(
              "prose-body prose-measure text-foreground/90",
              dropCap && i === 0 && "dropcap"
            )}
          >
            <InlineText text={block.text} ctx={{ articleSlug }} />
          </p>
        );
        break;
      case "heading": {
        const id = slugifyHeading(block.text);
        out.push(
          block.level === 2 ? (
            <h2 key={key} id={id} className="prose-measure scroll-mt-24 pt-4 font-display text-2xl font-semibold leading-tight sm:text-[1.7rem]">
              {block.text}
            </h2>
          ) : (
            <h3 key={key} id={id} className="prose-measure scroll-mt-24 pt-2 font-display text-xl font-semibold leading-snug">
              {block.text}
            </h3>
          )
        );
        break;
      }
      case "list":
        out.push(
          block.ordered ? (
            <ol key={key} className="prose-measure list-decimal space-y-2 pl-6 marker:font-display marker:text-vermilion prose-body text-foreground/90">
              {block.items.map((item, j) => (
                <li key={j}><InlineText text={item} ctx={{ articleSlug }} /></li>
              ))}
            </ol>
          ) : (
            <ul key={key} className="prose-measure space-y-2 prose-body text-foreground/90 [&>li]:relative [&>li]:pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span><InlineText text={item} ctx={{ articleSlug }} /></span>
                </li>
              ))}
            </ul>
          )
        );
        break;
      case "quote":
        out.push(
          <figure key={key} className="prose-measure border-l-2 border-l-primary pl-5">
            <blockquote className="font-display text-xl italic leading-relaxed text-foreground/90">
              <InlineText text={block.text} ctx={{ articleSlug }} />
            </blockquote>
            {block.attribution && (
              <figcaption className="mt-2 text-sm text-muted-foreground">— {block.attribution}</figcaption>
            )}
          </figure>
        );
        break;
      case "callout": {
        const style = calloutStyles[block.variant];
        const Icon = style.icon;
        out.push(
          <aside key={key} className={cn("prose-measure rounded-sm border border-border border-l-4 p-4", style.border, style.bg)}>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {block.title ?? style.label}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
              <InlineText text={block.text} ctx={{ articleSlug }} />
            </p>
          </aside>
        );
        break;
      }
      case "prosCons":
        out.push(
          <div key={key} className="prose-measure">
            {block.title && <h2 className="mb-3 font-display text-2xl font-semibold">{block.title}</h2>}
            <ProsCons pros={block.pros} cons={block.cons} />
          </div>
        );
        break;
      case "stats":
        out.push(
          <dl key={key} className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
            {block.items.map((stat, j) => (
              <div key={j} className="bg-card px-4 py-5 text-center">
                <dd className="font-display text-2xl font-semibold text-primary">{stat.value}</dd>
                <dt className="mt-1 text-xs leading-snug text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>
        );
        break;
      case "table":
        out.push(
          <figure key={key} className="prose-measure overflow-x-auto scroll-thin rounded-md border border-border">
            <table className="w-full border-collapse text-sm">
              {block.caption && <caption className="border-b border-border bg-muted/50 px-4 py-2.5 text-left text-xs text-muted-foreground">{block.caption}</caption>}
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {block.head.map((h, j) => (
                    <th key={j} scope="col" className="px-4 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, j) => (
                  <tr key={j} className="border-b border-border transition-colors last:border-b-0 odd:bg-muted/25 hover:bg-muted/40">
                    {row.map((cell, k) => (
                      <td key={k} className={cn("px-4 py-2.5 align-top", k === 0 && "font-medium")}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        );
        break;
      case "image":
        out.push(
          <figure key={key} className="overflow-hidden rounded-md border border-border">
            <div className="relative aspect-[16/9] bg-muted">
              <Image src={block.src} alt={block.alt} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
            </div>
            {(block.caption || block.credit) && (
              <figcaption className="bg-card px-4 py-2.5 text-xs text-muted-foreground">
                {block.caption}
                {block.credit && (
                  <span className="ml-2 italic">
                    (<InlineText text={block.credit} ctx={{ articleSlug }} />)
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        );
        break;
      case "pick": {
        const offer = block.offerId ? await getOfferView(block.offerId) : null;
        out.push(
          <article key={key} className="relative overflow-hidden rounded-md border border-border bg-card">
            <div className="flex items-start gap-4 border-b border-border bg-muted/30 px-5 py-4">
              <span className="font-display text-4xl font-semibold leading-none text-vermilion" aria-hidden="true">
                {block.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="eyebrow text-muted-foreground">Pick № {block.rank}{block.badge ? ` · ${block.badge}` : ""}</p>
                <h3 className="mt-1 font-display text-xl font-semibold leading-snug">
                  {block.url ? (
                    <Link href={block.url} className="hover:underline underline-offset-4">{block.name}</Link>
                  ) : (
                    block.name
                  )}
                </h3>
              </div>
              {block.imageUrl && (
                <div className="relative ml-auto h-16 w-24 shrink-0 overflow-hidden rounded-sm border border-border bg-muted md:h-20 md:w-28">
                  <Image
                    src={block.imageUrl}
                    alt="" // decorative: the schema has no truthful image-alt field, so we never
                    fill // invent alt text from the product name — the name sits in adjacent text
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            <div className="p-5">
              <p className="prose-body text-foreground/90">
                <InlineText text={block.blurb} ctx={{ articleSlug }} />
              </p>
              {offer && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <ComparisonOffer offer={offer} articleSlug={articleSlug} />
                  {offer.price ? <span className="font-medium text-foreground">{offer.price}</span> : null}
                  <span className="text-xs text-muted-foreground">via {offer.merchantName}</span>
                  {isDemo && (
                    <span className="text-xs font-medium uppercase tracking-wide text-ochre">sample data</span>
                  )}
                </div>
              )}
              {offer && (
                // Self-contained disclosure: guides/editorials can render picks without a
                // page-level AffiliateDisclosure, so a pick with a CTA carries its own.
                <AffiliateDisclosure className="mt-3" />
              )}
            </div>
          </article>
        );
        break;
      }
      case "comparisonEmbed": {
        const data = await getComparisonItems(block.comparisonSlug);
        if (data && data.items.length >= 2) {
          out.push(<ComparisonTable key={key} items={data.items} articleSlug={articleSlug} caption={data.title} isDemo={isDemo} />);
        }
        break;
      }
      case "offerEmbed": {
        const offer = await getOfferView(block.offerId);
        if (offer) out.push(<MerchantOffer key={key} offer={offer} articleSlug={articleSlug} isDemo={isDemo} />);
        break;
      }
      case "faq":
        out.push(
          <section key={key} aria-label={block.title} className="prose-measure">
            <h2 className="pt-2 font-display text-2xl font-semibold">{block.title}</h2>
            <Accordion type="single" collapsible className="mt-4">
              {block.items.map((item, j) => (
                <AccordionItem key={j} value={`faq-${j}`}>
                  <AccordionTrigger className="text-left text-base font-medium">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-foreground/85">
                    <InlineText text={item.a} ctx={{ articleSlug }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        );
        break;
      case "sources":
        out.push(
          <section key={key} aria-label={block.title} className="prose-measure">
            <h2 className="pt-2 font-display text-2xl font-semibold">{block.title}</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {block.items.map((s, j) => (
                <li key={j} className="flex gap-3">
                  <span className="section-index mt-0.5 text-muted-foreground/70">[{j + 1}]</span>
                  {s.url ? (
                    <a href={s.url} rel="noopener nofollow" target="_blank" className="underline underline-offset-2 hover:text-foreground">
                      {s.label}
                    </a>
                  ) : (
                    <span>{s.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        );
        break;
      case "divider":
        out.push(<hr key={key} className="prose-measure border-t border-dashed border-border" />);
        break;
    }
  }

  return <div className={cn("space-y-7", className)}>{out}</div>;
}
