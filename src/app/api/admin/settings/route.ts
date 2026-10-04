import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardAdmin, parseBody } from "@/lib/admin-api";
import { invalidateSettingsCache } from "@/lib/settings";
import { revalidateSettings } from "@/lib/admin-revalidate";

const bodySchema = z.object({
  key: z
    .string()
    .trim()
    .refine(
      (v) => ["ads_enabled", "demo_mode"].includes(v) || /^[a-z_]{2,40}$/.test(v),
      "Key must be a known switch or 2–40 lowercase letters/underscores"
    ),
  value: z.string().trim().min(1).max(500),
});

export async function PUT(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  const parsed = await parseBody(request, bodySchema);
  if (parsed.response) return parsed.response;

  try {
    const row = await db.siteSetting.upsert({
      where: { key: parsed.data.key },
      create: { key: parsed.data.key, value: parsed.data.value },
      update: { value: parsed.data.value },
    });
    // Fresh values for every reader — bust the in-memory cache + cached pages.
    invalidateSettingsCache();
    revalidateSettings();
    return NextResponse.json({ ok: true, key: row.key, value: row.value });
  } catch (err) {
    console.error("settings save failed", err);
    return NextResponse.json({ error: "Could not save the setting." }, { status: 500 });
  }
}
