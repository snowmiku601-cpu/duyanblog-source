import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getPolicy } from "@/content/policies";
import { formatDate } from "@/lib/format";

/** Shared renderer for the eight static policy pages. */
export function PolicyPage({ slug }: { slug: string }) {
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 lg:px-6 lg:py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: policy.title, href: `/${policy.slug}` },
        ])}
      />
      <p className="eyebrow text-vermilion">Policy</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {policy.title}
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Updated {formatDate(policy.updated)} · Part of our{" "}
        <Link href="/editorial-policy" className="underline underline-offset-2 hover:text-foreground">
          editorial standards
        </Link>
      </p>

      <p className="prose-body prose-measure mt-8 text-lg text-foreground/90">{policy.intro}</p>

      <div className="prose-measure mt-10 space-y-10">
        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-2xl font-semibold">{section.heading}</h2>
            {section.body.map((p, i) => (
              <p key={i} className="prose-body mt-3 text-foreground/90">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-md border border-border bg-muted/40 p-6 text-sm leading-relaxed">
        <p>
          Questions about this policy?{" "}
          <Link href="/contact" className="underline underline-offset-2 hover:text-foreground">
            Contact the editors
          </Link>{" "}
          — we answer every substantive message.
        </p>
      </div>
    </article>
  );
}

/** Metadata builder for policy page files. */
export function policyMetadata(slug: string): Metadata {
  const policy = getPolicy(slug);
  if (!policy) return {};
  return buildMetadata({
    title: policy.title,
    description: policy.description,
    path: `/${policy.slug}`,
  });
}
