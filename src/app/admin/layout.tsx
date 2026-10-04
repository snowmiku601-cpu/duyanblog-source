import type { Metadata } from "next";
import { AdminShell } from "./_components/admin-shell";

/**
 * Admin chrome only — no auth check here (login lives at /admin/login, which
 * this layout also wraps). Each protected page calls requireAdminPage() itself.
 */
export const metadata: Metadata = {
  title: "Admin — Duyan Blog",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
