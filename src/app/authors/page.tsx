import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, personJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { db } from "@/lib/db";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Authors & editors",
  description: "The people who test, write and stand behind everything published on Duyan Blog.",
  path: "/authors",
});

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default async function AuthorsPage() {
  const authors = await db.author.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
      {authors.map((author) => (
        <JsonLd key={author.id} data={personJsonLd(author)} />
      ))}
      <p className="eyebrow text-vermilion">Masthead</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Names on the byline<span className="text-vermilion">.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Everything on Duyan Blog has a human name attached. We list roles, not inflated
        titles — and we never invent credentials.
      </p>

      <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((author) => {
          let focus: string[] = [];
          try {
            focus = JSON.parse(author.focusAreas) as string[];
          } catch {
            focus = [];
          }
          return (
            <Link key={author.id} href={`/authors/${author.slug}`} className="group flex flex-col bg-card p-6 transition-colors hover:bg-accent/50">
              <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-full bg-secondary font-display text-lg font-semibold text-secondary-foreground">
                {initials(author.name)}
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold group-hover:underline underline-offset-4">{author.name}</h2>
              <p className="text-sm text-muted-foreground">{author.role}</p>
              {focus.length > 0 && (
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground/70">{focus.join(" · ")}</p>
              )}
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                {author._count.articles} published piece{author._count.articles === 1 ? "" : "s"}
              </p>
            </Link>
          );
        })}
      </div>

      {authors.length === 0 && (
        <p className="mt-8 rounded-md border border-dashed border-border p-8 text-sm text-muted-foreground">
          No authors yet — run <code className="rounded-sm bg-muted px-1.5 py-0.5">npm run seed:demo</code>.
        </p>
      )}
    </div>
  );
}
