/**
 * Secure admin bootstrap — the ONLY way to create the first admin user.
 *
 *   npm run admin:bootstrap -- --email you@example.com --password "long-pass-with-1-number"
 *
 * - Refuses to run when NODE_ENV=production unless ALLOW_ADMIN_BOOTSTRAP=true.
 * - Enforces a 12+ character password with letters and digits.
 * - Prints nothing sensitive; never echoes the password back.
 * - If an admin already exists, asks for --force or exits.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const db = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password.normalize("NFKC"), salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_BOOTSTRAP !== "true") {
    console.error("Refusing to bootstrap admin in production without ALLOW_ADMIN_BOOTSTRAP=true.");
    process.exit(1);
  }

  const email = arg("email")?.toLowerCase().trim();
  const password = arg("password");
  const name = arg("name") ?? "Editor";
  const force = process.argv.includes("--force");

  if (!email || !email.includes("@")) {
    console.error("Usage: npm run admin:bootstrap -- --email you@example.com --password '…' [--name Editor] [--force]");
    process.exit(1);
  }
  if (!password || password.length < 12 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    console.error("Password must be at least 12 characters and contain letters and digits.");
    process.exit(1);
  }

  const existingAdmins = await db.user.count();
  if (existingAdmins > 0 && !force) {
    console.error(`An admin account already exists (${existingAdmins}). Pass --force to add another.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name, role: "ADMIN" },
  });

  console.log(`Admin ready: ${user.email} (role ${user.role}). No password is printed, ever.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
