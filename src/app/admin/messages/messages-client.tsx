"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api, formatDate } from "@/lib/admin-client";
import { ReadBadge } from "../_components/status-badge";

export type MessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function MessagesClient({ rows }: { rows: MessageRow[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(rows);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const open = items.find((m) => m.id === openId) ?? null;

  async function toggleRead(row: MessageRow) {
    if (busyId) return;
    setBusyId(row.id);
    const res = await api(`/api/admin/messages/${row.id}/read`, "POST", { read: !row.read });
    setBusyId(null);
    if (!res.ok) {
      toast({ title: "Update failed", description: res.error, variant: "destructive" });
      return;
    }
    setItems((list) => list.map((m) => (m.id === row.id ? { ...m, read: !row.read } : m)));
  }

  async function openMessage(row: MessageRow) {
    setOpenId(row.id);
    if (!row.read) await toggleRead(row); // opening marks as read
  }

  return (
    <>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-display text-lg">Inbox is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Messages from the contact form land here.</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto scroll-thin rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} className={row.read ? "opacity-70" : undefined}>
                  <TableCell>
                    <ReadBadge read={row.read} />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => openMessage(row)}
                      className="text-left underline-offset-2 hover:underline"
                    >
                      {row.subject}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-sm text-muted-foreground">{row.message}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRead(row)}
                      disabled={busyId === row.id}
                      aria-label={row.read ? `Mark “${row.subject}” unread` : `Mark “${row.subject}” read`}
                    >
                      {row.read ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="sm:max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.subject}</DialogTitle>
                <DialogDescription>
                  {open.name} · {open.email} · received {formatDate(open.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-72 overflow-y-auto scroll-thin whitespace-pre-wrap rounded-md bg-muted/60 p-4 text-sm leading-relaxed">
                {open.message}
              </div>
              <div className="flex justify-end">
                <Button asChild variant="outline">
                  <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}>Reply by email</a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
