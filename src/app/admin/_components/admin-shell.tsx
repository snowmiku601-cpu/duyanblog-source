"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  AtSign,
  BadgePercent,
  Columns3,
  ExternalLink,
  FileText,
  FolderOpen,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/admin-client";

type NavItem = { label: string; href: string; icon: LucideIcon; exact?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Articles", href: "/admin/articles", icon: FileText },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Authors", href: "/admin/authors", icon: Users },
  { label: "Media", href: "/admin/media", icon: Images },
  { label: "Merchants", href: "/admin/merchants", icon: Store },
  { label: "Offers", href: "/admin/offers", icon: BadgePercent },
  { label: "Comparisons", href: "/admin/comparisons", icon: Columns3 },
  { label: "Redirects", href: "/admin/redirects", icon: ArrowRightLeft },
  { label: "Messages", href: "/admin/messages", icon: Mail },
  { label: "Subscribers", href: "/admin/subscribers", icon: AtSign },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-primary/10 font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    await api("/api/admin/auth/logout", "POST");
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={logout} disabled={busy} className={className}>
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {busy ? "Signing out…" : "Sign out"}
    </Button>
  );
}

function Brand() {
  return (
    <Link href="/admin/dashboard" className="flex items-baseline gap-2 py-1">
      <span className="font-display text-lg font-semibold tracking-tight">Duyan Blog</span>
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-vermilion">Admin</span>
    </Link>
  );
}

/**
 * Chrome for the admin area: desktop sidebar + mobile top bar.
 * The login page renders bare (no chrome) so the shell hides itself there.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="w-full">
      {/* Mobile top bar */}
      <div className="border-b bg-card lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="View site">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t px-2 pb-3 pt-2">
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-3 flex items-center gap-2 px-1">
              <LogoutButton className="flex-1" />
              <Button asChild variant="ghost" size="sm">
                <a href="/" target="_blank" rel="noreferrer">
                  View site <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex w-full">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r bg-card px-3 py-5 lg:flex">
          <div>
            <div className="px-2">
              <Brand />
            </div>
            <div className="mt-5">
              <NavLinks pathname={pathname} />
            </div>
          </div>
          <div className="flex flex-col gap-2 px-1">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View site
            </a>
            <LogoutButton className="w-full" />
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
