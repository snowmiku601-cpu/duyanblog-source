"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMounted } from "@/hooks/use-mounted";
import {
  CONSENT_OPEN_EVENT,
  getConsentSnapshot,
  saveConsent,
  subscribeConsent,
  type ConsentState,
} from "@/lib/consent";

/**
 * Consent banner + reusable settings dialog (footer "Cookie settings").
 * Consent is an external store (localStorage + events) read via
 * useSyncExternalStore — nothing optional runs before a decision is stored.
 * Replaceable with a full CMP; the contract lives in src/lib/consent.ts.
 */
export function ConsentManager() {
  const mounted = useMounted();
  const consent = useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => null);
  const [draft, setDraft] = useState({ analytics: false, advertising: false });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const open = () => {
      const current = getConsentSnapshot();
      setDraft({ analytics: current?.analytics ?? false, advertising: current?.advertising ?? false });
      setSettingsOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  const decideAll = (value: boolean) => {
    saveConsent({ analytics: value, advertising: value });
    setSettingsOpen(false);
  };

  const saveChoices = () => {
    saveConsent(draft);
    setSettingsOpen(false);
  };

  if (!mounted) return null;

  const showBanner = consent === null;

  return (
    <>
      {showBanner && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-[90] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md border border-border bg-card text-card-foreground shadow-lg rounded-md p-4"
        >
          <p className="font-display text-base font-semibold">A quick word on cookies</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            We use necessary cookies to run the site. Analytics and advertising cookies
            stay off until you say otherwise — and affiliate links work either way.{" "}
            <a href="/cookie-policy" className="underline underline-offset-2 hover:text-foreground">
              Cookie policy
            </a>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => decideAll(true)}>Accept all</Button>
            <Button size="sm" variant="outline" onClick={() => decideAll(false)}>Only necessary</Button>
            <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>Manage</Button>
          </div>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Cookie settings</DialogTitle>
            <DialogDescription>
              Necessary cookies keep the site working and are always on. Everything else is your call.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="consent-necessary" className="flex flex-col gap-0.5">
                Necessary
                <span className="text-xs font-normal text-muted-foreground">Required for the site to function.</span>
              </Label>
              <Switch id="consent-necessary" checked disabled aria-readonly />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="consent-analytics" className="flex flex-col gap-0.5">
                Analytics
                <span className="text-xs font-normal text-muted-foreground">Anonymous usage statistics. Off by default.</span>
              </Label>
              <Switch
                id="consent-analytics"
                checked={draft.analytics}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="consent-advertising" className="flex flex-col gap-0.5">
                Advertising
                <span className="text-xs font-normal text-muted-foreground">Allows ad networks to set cookies. Off by default.</span>
              </Label>
              <Switch
                id="consent-advertising"
                checked={draft.advertising}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, advertising: v }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => decideAll(false)}>Reject non-essential</Button>
            <Button size="sm" onClick={saveChoices}>Save choices</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Footer link that re-opens the settings dialog. Client-only. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT))}
      className={className ?? "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"}
    >
      Cookie settings
    </button>
  );
}
