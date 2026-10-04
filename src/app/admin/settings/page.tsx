import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { formatDate } from "@/lib/admin-client";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings — Admin" };

/**
 * Which transport sendMail() would use right now — mirrors the priority in
 * src/lib/email.ts (Resend key → console in non-production → disabled).
 */
function currentEmailProvider(): "resend" | "console" | "none" {
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  if (process.env.NODE_ENV !== "production") return "console";
  return "none";
}

export default async function AdminSettingsPage() {
  const user = await requireAdminPage();

  const [rows, cached] = await Promise.all([
    db.siteSetting.findMany({ orderBy: { key: "asc" } }),
    getSiteSettings(),
  ]);

  return (
    <SettingsClient
      rows={rows.map((r) => ({ key: r.key, value: r.value, updatedAt: formatDate(r.updatedAt) }))}
      cached={cached}
      emailProvider={currentEmailProvider()}
      adminEmail={user.email}
    />
  );
}
