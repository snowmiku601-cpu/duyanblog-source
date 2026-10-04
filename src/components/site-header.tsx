"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { primaryNav, footerNav } from "@/lib/site";
import { cn } from "@/lib/utils";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={mounted && resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="text-muted-foreground hover:text-foreground"
    >
      {mounted && resolvedTheme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </Button>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Press "/" anywhere to jump to search (unless typing in a form field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      e.preventDefault();
      router.push("/search");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <header className="sticky top-0 z-50 bg-background/95 supports-[backdrop-filter]:bg-background/90 backdrop-blur-sm border-b border-border">
      {/* Utility strip — trust signals up top */}
      <div className="hidden md:block border-b border-border/70 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 flex items-center justify-between py-1.5">
          <p className="eyebrow text-muted-foreground">Independent · Reader-supported · Vietnamese roots</p>
          <nav aria-label="Trust" className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/methodology" className="hover:text-foreground underline-offset-4 hover:underline">How we test</Link>
            <Link href="/how-we-make-money" className="hover:text-foreground underline-offset-4 hover:underline">How we make money</Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
            {primaryNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "px-3 py-2 text-sm rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    active ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild aria-label="Search duyanblog.com (press /)">
              <Link href="/search" className="relative">
                <Search className="h-4.5 w-4.5" />
                <kbd className="pointer-events-none absolute bottom-0.5 right-0.5 hidden select-none font-sans text-[9px] font-semibold leading-none text-muted-foreground/70 lg:block" aria-hidden="true">
                  /
                </kbd>
              </Link>
            </Button>
            <ThemeToggle />
            <Button asChild size="sm" className="hidden sm:inline-flex ml-1 font-medium">
              <Link href="/#newsletter">Newsletter</Link>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-display text-left">Browse</SheetTitle>
                </SheetHeader>
                <nav aria-label="Mobile" className="px-4 pb-8 flex flex-col">
                  <div className="flex flex-col gap-0.5">
                    {primaryNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="px-2 py-2.5 rounded-sm text-base font-medium hover:bg-accent"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <hr className="my-4 border-border" />
                  <p className="eyebrow text-muted-foreground px-2 pb-2">Sections</p>
                  <div className="flex flex-col gap-0.5">
                    {footerNav.sections.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="px-2 py-2 rounded-sm text-sm hover:bg-accent">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <hr className="my-4 border-border" />
                  <p className="eyebrow text-muted-foreground px-2 pb-2">About</p>
                  <div className="flex flex-col gap-0.5">
                    {footerNav.company.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="px-2 py-2 rounded-sm text-sm hover:bg-accent">
                        {item.label}
                      </Link>
                    ))}
                    <Link href="/search" onClick={() => setOpen(false)} className="px-2 py-2 rounded-sm text-sm hover:bg-accent">Search</Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
