import { Badge } from "@/components/ui/badge";

/** A published article whose publish moment is still in the future. */
export function isScheduled(
  status: string,
  publishedAt: Date | string | null | undefined
): boolean {
  if (status !== "published" || !publishedAt) return false;
  const d = publishedAt instanceof Date ? publishedAt : new Date(publishedAt);
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
}

/** Status badge for draft / scheduled / published article rows. */
export function StatusBadge({
  status,
  publishedAt,
}: {
  status: string;
  publishedAt?: Date | string | null;
}) {
  if (status === "published") {
    if (isScheduled(status, publishedAt)) {
      return (
        <Badge
          variant="outline"
          className="border-amber-600/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        >
          Scheduled
        </Badge>
      );
    }
    return (
      <Badge className="border border-transparent bg-secondary text-secondary-foreground">Published</Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Draft
    </Badge>
  );
}

/** Badge for read / unread contact messages. */
export function ReadBadge({ read }: { read: boolean }) {
  if (read) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Read
      </Badge>
    );
  }
  return <Badge className="bg-primary text-primary-foreground">Unread</Badge>;
}

/** Badge for confirmed / pending newsletter subscribers. */
export function ConfirmedBadge({ confirmed }: { confirmed: boolean }) {
  if (confirmed) {
    return <Badge className="border border-transparent bg-secondary text-secondary-foreground">Confirmed</Badge>;
  }
  return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
}
