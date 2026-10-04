import type { Metadata } from "next";
import { ContactForm } from "./contact-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Reach the Duyan Blog editors: corrections, tips, press, partnership and advertising enquiries.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow text-vermilion">Contact</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Talk to the editors<span className="text-vermilion">.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Corrections get the fastest treatment — they also get a public note, per our{" "}
            <a href="/corrections-policy" className="underline underline-offset-2 hover:text-foreground">corrections policy</a>.
            For review suggestions, tell us what you&apos;re trying to buy.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
        <aside className="lg:col-span-5">
          <div className="rounded-md border border-border bg-muted/40 p-6 text-sm leading-relaxed">
            <p className="eyebrow text-muted-foreground">What goes where</p>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="font-semibold">Corrections &amp; fact-checks</dt>
                <dd className="mt-1 text-muted-foreground">Use this form with the article link. We respond within a week and publish the outcome.</dd>
              </div>
              <div>
                <dt className="font-semibold">Review suggestions</dt>
                <dd className="mt-1 text-muted-foreground">Tell us the decision you&apos;re making — &quot;best eSIM for two weeks in Japan&quot; beats &quot;review eSIMs&quot;.</dd>
              </div>
              <div>
                <dt className="font-semibold">Sponsorships &amp; advertising</dt>
                <dd className="mt-1 text-muted-foreground">We sell clearly-labelled placements, never verdicts. Ask for the media kit and the <a href="/advertising-disclosure" className="underline underline-offset-2 hover:text-foreground">advertising disclosure</a>.</dd>
              </div>
              <div>
                <dt className="font-semibold">Press</dt>
                <dd className="mt-1 text-muted-foreground">Interviews about independent publishing, methodology or affiliate ethics are welcome.</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
