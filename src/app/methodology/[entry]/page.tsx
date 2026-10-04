import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const revalidate = 600;

type Params = { params: Promise<{ entry: string }> };

async function getEntry(slug: string) {
  return db.methodologyEntry.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { entry: slug } = await params;
  const entry = await getEntry(slug);
  if (!entry) return {};
  return buildMetadata({
    title: entry.title,
    description: entry.body.slice(0, 160),
    path: `/methodology/${entry.slug}`,
  });
}

export default async function MethodologyEntryPage({ params }: Params) {
  const { entry: slug } = await params;
  const entry = await getEntry(slug);
  if (!entry) notFound();

  const paragraphs = entry.body.split("\n\n");

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 lg:px-6 lg:py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Methodology", href: "/methodology" },
          { label: entry.title, href: `/methodology/${entry.slug}` },
        ])}
      />
      <p className="eyebrow text-vermilion">Methodology</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{entry.title}</h1>
      <p className="mt-2 text-xs text-muted-foreground">Last updated {formatDate(entry.updatedAt)}</p>
      <div className="prose-body prose-measure mt-8 space-y-5 text-foreground/90">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
