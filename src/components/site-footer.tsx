import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { CookieSettingsButton } from "@/components/consent/consent-manager";
import { footerNav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-ink text-[oklch(0.93_0.012_82)] dark:bg-card border-t border-border">
      {/* Decorative nón lá watermark — brand mark, echoes the hero geometry */}
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-14 -right-10 opacity-100">
        <LogoMark className="h-72 w-72 rotate-12 text-[oklch(0.93_0.012_82)]/[0.06] dark:text-foreground/[0.05]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 lg:px-6 pt-14 pb-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8 text-[oklch(0.93_0.012_82)]" />
              <span className="font-display text-2xl font-semibold tracking-tight">
                duyanblog<span className="text-vermilion">.</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[oklch(0.93_0.012_82)]/70">
              {site.tagline} Independent reviews of software, travel and technology —
              published with the methodology and trade-offs in the open.
            </p>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-[oklch(0.93_0.012_82)]/55">
              {site.publisherNote}
            </p>
          </div>

          <nav aria-label="Sections" className="md:col-span-2">
            <p className="eyebrow text-[oklch(0.93_0.012_82)]/50">Sections</p>
            <ul className="mt-3 space-y-2 text-sm">
              {footerNav.sections.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-[oklch(0.93_0.012_82)]/75 hover:text-[oklch(0.93_0.012_82)] underline-offset-4 hover:underline">{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Explore" className="md:col-span-2">
            <p className="eyebrow text-[oklch(0.93_0.012_82)]/50">Explore</p>
            <ul className="mt-3 space-y-2 text-sm">
              {footerNav.explore.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-[oklch(0.93_0.012_82)]/75 hover:text-[oklch(0.93_0.012_82)] underline-offset-4 hover:underline">{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company" className="md:col-span-2">
            <p className="eyebrow text-[oklch(0.93_0.012_82)]/50">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              {footerNav.company.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-[oklch(0.93_0.012_82)]/75 hover:text-[oklch(0.93_0.012_82)] underline-offset-4 hover:underline">{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="md:col-span-2">
            <p className="eyebrow text-[oklch(0.93_0.012_82)]/50">Policies</p>
            <ul className="mt-3 space-y-2 text-sm">
              {footerNav.legal.slice(0, 5).map((l) => (
                <li key={l.href}><Link href={l.href} className="text-[oklch(0.93_0.012_82)]/75 hover:text-[oklch(0.93_0.012_82)] underline-offset-4 hover:underline">{l.label}</Link></li>
              ))}
              <li><Link href="/privacy-policy" className="text-[oklch(0.93_0.012_82)]/75 hover:text-[oklch(0.93_0.012_82)] underline-offset-4 hover:underline">Privacy &amp; cookies</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-6 border-t border-[oklch(0.93_0.012_82)]/15 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[oklch(0.93_0.012_82)]/55">
            © {new Date().getFullYear()} {site.name} · {site.domain}. Demo build — every product, merchant and offer shown is a clearly labelled fictional sample.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <CookieSettingsButton className="text-[oklch(0.93_0.012_82)]/60 hover:text-[oklch(0.93_0.012_82)] underline-offset-4 hover:underline" />
            <Link href="/terms" className="text-[oklch(0.93_0.012_82)]/60 hover:text-[oklch(0.93_0.012_82)] underline-offset-4 hover:underline">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
