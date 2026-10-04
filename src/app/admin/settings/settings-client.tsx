"use client";

import { useState } from "react";
import { LoaderCircle, Plus, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api, formatDate } from "@/lib/admin-client";
import { FormRow } from "../_components/form-row";

export type SettingRow = { key: string; value: string; updatedAt: string };

const BOOLEAN_KEYS = ["ads_enabled", "demo_mode"] as const;

const KEY_HELP: Record<string, string> = {
  ads_enabled: "Shows or hides ad slots across public pages (true / false).",
  demo_mode: "Demo mode flags the site as a portfolio preview — footer badge + no real campaigns (true / false).",
};

const PROVIDER_COPY: Record<string, { label: string; detail: string; tone: string }> = {
  resend: {
    label: "Resend (live)",
    detail: "RESEND_API_KEY is set — confirmations and test emails are delivered for real.",
    tone: "text-emerald-700 dark:text-emerald-400",
  },
  console: {
    label: "Console (dev only)",
    detail: "No RESEND_API_KEY — outgoing mail is logged to the server console instead of sent.",
    tone: "text-amber-700 dark:text-amber-400",
  },
  none: {
    label: "Disabled",
    detail: "Production without RESEND_API_KEY — outgoing mail is off. Set the key (see .env.example).",
    tone: "text-destructive",
  },
};

export function SettingsClient({
  rows,
  cached,
  emailProvider,
  adminEmail,
}: {
  rows: SettingRow[];
  cached: Record<string, string>;
  emailProvider: "resend" | "console" | "none";
  adminEmail: string;
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(rows);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  async function sendTestEmail() {
    if (sendingTest) return;
    setSendingTest(true);
    const res = await api<{ ok: boolean; delivered?: boolean; provider?: string }>(
      "/api/admin/email/test",
      "POST",
    );
    setSendingTest(false);
    if (!res.ok) {
      toast({
        title: "Test email not delivered",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    if (res.data.delivered) {
      toast({
        title: "Test email delivered",
        description: `Sent to ${adminEmail} via the ${res.data.provider ?? "configured"} transport.`,
      });
    } else {
      toast({
        title: "Logged to server console (no mail provider)",
        description: `The test message for ${adminEmail} is in the dev server log — set RESEND_API_KEY to deliver for real.`,
      });
    }
  }

  async function save(key: string, value: string) {
    if (busy) return;
    setBusy(key);
    const res = await api("/api/admin/settings", "PUT", { key, value });
    setBusy(null);
    if (!res.ok) {
      toast({ title: "Save failed", description: res.error, variant: "destructive" });
      return;
    }
    setItems((list) => {
      const existing = list.find((r) => r.key === key);
      if (existing) {
        return list.map((r) => (r.key === key ? { ...r, value } : r));
      }
      return [...list, { key, value, updatedAt: formatDate(new Date()) }].sort((a, b) =>
        a.key.localeCompare(b.key)
      );
    });
    toast({ title: `Saved “${key}”`, description: "The settings cache was invalidated." });
  }

  function isBooleanKey(key: string): boolean {
    return (BOOLEAN_KEYS as readonly string[]).includes(key);
  }

  async function onAddKey(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^[a-z_]{2,40}$/.test(newKey.trim())) {
      setError("Key must be 2–40 lowercase letters or underscores.");
      return;
    }
    if (!newValue.trim()) {
      setError("Value is required.");
      return;
    }
    setError(null);
    await save(newKey.trim(), newValue.trim());
    setNewKey("");
    setNewValue("");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Email transport</CardTitle>
          <CardDescription>
            The delivery path used by newsletter confirmations — probe it with a test email to {adminEmail}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={`font-medium ${PROVIDER_COPY[emailProvider].tone}`}>
              {PROVIDER_COPY[emailProvider].label}
            </p>
            <p className="text-sm text-muted-foreground">{PROVIDER_COPY[emailProvider].detail}</p>
          </div>
          <Button
            variant="outline"
            disabled={sendingTest}
            onClick={() => void sendTestEmail()}
          >
            {sendingTest ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <SendHorizonal className="h-4 w-4" aria-hidden="true" />
            )}
            {sendingTest ? "Sending…" : "Send test email"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Known switches</CardTitle>
          <CardDescription>Feature flags the public site reads from the settings cache.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {BOOLEAN_KEYS.map((key) => {
            const current = cached[key] === "true";
            return (
              <div key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
                <div>
                  <p className="font-medium">{key}</p>
                  <p className="text-sm text-muted-foreground">{KEY_HELP[key]}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-muted-foreground">{current ? "on" : "off"}</span>
                  <Switch
                    checked={current}
                    disabled={busy === key}
                    onCheckedChange={(v) => save(key, v ? "true" : "false")}
                    aria-label={`Toggle ${key}`}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">All settings</CardTitle>
          <CardDescription>
            {items.length === 0
              ? "Nothing yet — flip a switch above or add a key below."
              : "Raw key/value rows. Values are strings; consumers parse them."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nothing yet — create the first setting below.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-mono text-sm">{row.key}</TableCell>
                      <TableCell className="max-w-56 truncate font-mono text-sm" title={row.value}>
                        {row.value}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.updatedAt}</TableCell>
                      <TableCell className="text-right">
                        {isBooleanKey(row.key) ? (
                          <span className="text-sm text-muted-foreground">
                            edit via the switch above
                          </span>
                        ) : (
                          <InlineValueEditor
                            current={row.value}
                            busy={busy === row.key}
                            onSave={(value) => save(row.key, value)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Add a setting</CardTitle>
          <CardDescription>Lowercase letters/underscores, 2–40 chars. New keys are inert until a feature reads them.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAddKey} className="grid items-start gap-4 sm:grid-cols-[1fr_1fr_auto]" noValidate>
            <FormRow label="Key">
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="newsletter_banner"
                className="font-mono"
              />
            </FormRow>
            <FormRow label="Value">
              <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="true" />
            </FormRow>
            <div className="flex items-end pb-0.5 sm:pb-6">
              <Button type="submit" disabled={busy !== null}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add
              </Button>
            </div>
          </form>
          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InlineValueEditor({
  current,
  busy,
  onSave,
}: {
  current: string;
  busy: boolean;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(current);
  return (
    <div className="flex items-center justify-end gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-44 font-mono text-xs"
        aria-label={`New value for setting`}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy || value === current} onClick={() => onSave(value)}>
        Save
      </Button>
    </div>
  );
}
