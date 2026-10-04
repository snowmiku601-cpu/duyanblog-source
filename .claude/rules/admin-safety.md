# Admin safety — auth, sessions, production guards

Read before touching `src/lib/auth.ts`, any `/api/admin/*` route, `requireAdmin*` calls, the
`User`/`Session` models, or the production guard flags.

## The invariants

1. **No default credentials.** Zero `User` rows are seeded. The only way in is
   `npm run admin:bootstrap -- --email <e> --password <12+ chars, letters+digits>`. Never seed a
   user in `prisma/seed.ts`.
2. **The guards are the safety net, not an annoyance.** `seed:demo` and `admin:bootstrap` refuse
   `NODE_ENV=production` unless `ALLOW_DEMO_SEED` / `ALLOW_ADMIN_BOOTSTRAP` are set. Never hack
   around them; never commit a working `.env` with them set.
3. **Sessions: raw tokens never touch the DB.** 32 random bytes base64url in cookie
   `dy_admin_session` (HttpOnly, SameSite=Lax, Secure in prod, 7-day TTL); DB stores only
   `sha256(token)` in `Session.tokenHash`. Keep `hashToken()` in the loop.
4. **Every admin mutation goes through `guardAdmin`** (same-origin 403 → `requireAdminApi` 401 →
   Zod 400). Login is rate-limited 5/min/IP. Keep that chain intact.
5. **After any content/taxonomy/settings mutation, call `revalidatePath()`**
   (use `src/lib/admin-revalidate.ts` helpers) and `invalidateSettingsCache()` for `SiteSetting`
   rows. Missing revalidation = edits invisible until the ISR window elapses (up to 300 s, and
   settings up to 30 s via cache).
6. **Scripts with side effects refuse to be run blind.** `admin:bootstrap` needs explicit
   `--email`/`--password`; never read a password from an env var into a committed file.

## Reversal

- Deleting a `User` does not revoke sessions (they live in `Session`); delete the rows.
- A lost session cookie is a 7-day TTL, not forever. Re-bootstrap is the documented recovery for
  a lost admin, guarded by `--force` refusing a second admin without it.