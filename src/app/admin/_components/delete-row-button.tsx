"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/admin-client";

/** Generic confirm-then-DELETE row action. Refreshes the server list on success. */
export function DeleteRowButton({
  path,
  label,
  confirmText,
  onDeleted,
}: {
  path: string;
  label: string;
  confirmText: string;
  onDeleted?: () => void;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy || !confirm(confirmText)) return;
    setBusy(true);
    const res = await api(path, "DELETE");
    setBusy(false);
    if (!res.ok) {
      toast({ title: "Delete failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: `${label} deleted` });
    onDeleted?.();
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onDelete}
      disabled={busy}
      aria-label={`Delete ${label}`}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
