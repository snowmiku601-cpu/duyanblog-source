import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { LogoMark } from "@/components/logo";
import { buildMetadata } from "@/lib/seo";
import { db } from "@/lib/db";

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "About Duyan Blog",
  description:
    "Why Duyan Blog exists: an independent editorial publication reviewing software, travel and technology with the reasoning shown.",
  path: "/about",
});

export default async function AboutPage() {
  const authors = await db.author.findMany({ orderBy: { name: "asc" }, take: 6 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="prose-measure lg:col-span-8">
          <p className="eyebrow text-vermilion">About us</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Named after a hat. Run on principles<span className="text-vermilion">.</span>
          </h1>
          <div className="prose-body mt-6 space-y-5 text-foreground/90">
            <p>
              The <strong>nón lá</strong> — the Vietnamese conical hat — is a piece of design that
              has quietly done its job for centuries: simple, honest, and surprisingly engineered.
              A palm-leaf cone, a bamboo frame, and not one gram of decoration that doesn&apos;t
              work. We named this publication after it because that&apos;s the standard we hold
              our reviews to.
            </p>
            <p>
              Duyan Blog is an independent editorial publication covering software, travel and
              technology. Our reviews are built from the published specs, source documents and
              the dates we record when we check each figure. Verdicts are written before anyone
              looks at commission rates — that rule is written into our{" "}
              <Link href="/how-we-make-money" className="underline underline-offset-2">business model</Link> and our{" "}
              <Link href="/editorial-policy" className="underline underline-offset-2">editorial policy</Link>.{" "}
              Where an article contains genuine first-hand work, it says so and describes exactly what was done.
            </p>
            <p>
              We are small on purpose. Every piece has a named author and, for reviews, a second
              editor who checks the claims. Where our data is thin, we publish our{" "}
              <Link href="/methodology" className="underline underline-offset-2">methodology</Link>{" "}
              instead of inventing statistics — and our{" "}
              <Link href="/corrections-policy" className="underline underline-offset-2">corrections stay up</Link>.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
            {[
              { t: "Independent", d: "No manufacturer signs off on our verdicts. Ever." },
              { t: "Not for sale", d: "Commercial relationships never buy rankings or verdicts." },
              { t: "Reasoned", d: "Every score maps to a published criterion. Disagree with the method, not the vibe." },
            ].map((v) => (
              <div key={v.t} className="bg-card p-5">
                <p className="font-display text-lg font-semibold">{v.t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-12 font-display text-2xl font-semibold">The masthead</h2>
          <ul className="mt-4 space-y-3">
            {authors.map((a) => (
              <li key={a.id} className="flex items-baseline gap-3 text-sm">
                <Link href={`/authors/${a.slug}`} className="font-medium underline-offset-4 hover:underline">{a.name}</Link>
                <span className="text-muted-foreground">{a.role}</span>
              </li>
            ))}
            {authors.length === 0 && <li className="text-sm text-muted-foreground">Masthead loads with the demo seed.</li>}
          </ul>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-28 space-y-6">
            <div className="overflow-hidden rounded-md border border-border">
              <Image src="/images/og-default.png" alt="Geometric sun rising behind a conical hat — Duyan Blog illustration" width={672} height={384} className="w-full object-cover" />
            </div>
            <div className="rounded-md border border-border bg-card p-5">
              <LogoMark className="h-8 w-8" />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Duyan Blog is an independent publication. Our reviews are dated, sourced and
                reasoned in the open — read the methodology and challenge the working.
              </p>
              <Link href="/contact" className="mt-4 inline-block text-sm font-medium underline underline-offset-4 hover:text-foreground">
                Say hello →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
