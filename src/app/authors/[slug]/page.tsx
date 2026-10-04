import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/editorial/article-card";
import { Reveal } from "@/components/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata, personJsonLd } from "@/lib/seo";
import { db } from "@/lib/db";
import { toCardData, articleCardSelect, liveDateGuard } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

async function getAuthor(slug: string) {
  const author = await db.author.findUnique({ where: { slug } });
  return author;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return {};
  return buildMetadata({
    title: `${author.name} — ${author.role}`,
    description: author.bio.slice(0, 160),
    path: `/authors/${author.slug}`,
  });
}

export default async function AuthorProfile({ params }: Params) {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) notFound();

  const rows = await db.article.findMany({
    where: {
      status: "published",
      AND: [liveDateGuard(), { OR: [{ authorId: author.id }, { reviewerId: author.id }] }],
    },
    orderBy: [{ publishedAt: "desc" }],
    select: articleCardSelect,
  });
  const articles = rows.map(toCardData);

  let focus: string[] = [];
  try {
    focus = JSON.parse(author.focusAreas) as string[];
  } catch {
    focus = [];
  }

  const initials = author.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <JsonLd data={personJsonLd(author)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Authors", href: "/authors" },
          { label: author.name, href: `/authors/${author.slug}` },
        ])}
      />

      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <span
              aria-hidden="true"
              className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-border bg-secondary font-display text-3xl font-semibold text-secondary-foreground"
            >
              {initials}
            </span>
            <div>
              <p className="eyebrow text-vermilion">Author profile</p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">{author.name}</h1>
              <p className="mt-1 text-lg text-muted-foreground">{author.role}</p>
              {focus.length > 0 && (
                <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground/70">{focus.join(" · ")}</p>
              )}
              <p className="prose-measure mt-4 text-base leading-relaxed text-foreground/85">{author.bio}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                On the masthead since {formatDate(author.createdAt)} · {articles.length} published piece{articles.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        {articles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Reveal key={article.id}>
                <ArticleCard article={article} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No published pieces yet.</p>
        )}
      </div>
    </>
  );
}
