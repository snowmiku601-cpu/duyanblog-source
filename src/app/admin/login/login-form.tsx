"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/admin-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const res = await api<{ ok: boolean }>("/api/admin/auth/login", "POST", {
      email: email.trim(),
      password,
    });

    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.replace("/admin/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@duyanblog.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
