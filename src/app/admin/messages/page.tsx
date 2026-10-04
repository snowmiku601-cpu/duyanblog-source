import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { MessagesClient } from "./messages-client";

export const metadata = { title: "Messages — Admin" };

export default async function AdminMessagesPage() {
  await requireAdminPage();

  const [rows, unread] = await Promise.all([
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
    db.contactMessage.count({ where: { read: false } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          From the public contact form · {unread} unread of {rows.length}
        </p>
      </header>
      <MessagesClient
        rows={rows.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          subject: m.subject,
          message: m.message,
          read: m.read,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
