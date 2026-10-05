import "server-only";

import { db } from "@/lib/db";

/**
 * Site settings are stored in the SiteSetting table and cached in memory for
 * the lifetime of the server process. Admin edits invalidate the cache.
 */

const CACHE_TTL_MS = 30_000;

let cache: { data: Record<string, string>; loadedAt: number } | null = null;

export async function getSiteSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) return cache.data;
  const rows = await db.siteSetting.findMany();
  const data: Record<string, string> = {};
  for (const row of rows) data[row.key] = row.value;
  cache = { data, loadedAt: now };
  return data;
}

export function invalidateSettingsCache() {
  cache = null;
}

export async function getSetting(key: string): Promise<string | null> {
  const settings = await getSiteSettings();
  return settings[key] ?? null;
}

export function isAdsEnabled(settings: Record<string, string>): boolean {
  // DB setting wins; NEXT_PUBLIC_ADS_ENABLED is the fallback when unset.
  if (settings["ads_enabled"] != null) return settings["ads_enabled"] === "true";
  return process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
}

/**
 * Production media-persistence decision (Correction 15): CMS uploads write to
 * <cwd>/public/images — durable on a VPS that never wipes the app dir, but a
 * rebuild-from-scratch pipeline overwrites it. MEDIA_PERSISTENT=true declares
 * "this environment persists media across deployments". In production, uploads
 * are refused without it (editorial media then lives in Git/deploy); on dev the
 * guard is off so the CMS media library stays usable.
 */
export function mediaPersistent(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.MEDIA_PERSISTENT === "true";
}
