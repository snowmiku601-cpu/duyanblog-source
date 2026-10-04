import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Admin sign in — Duyan Blog" };

export default async function AdminLoginPage() {
  const user = await getAdminUser();
  if (user) redirect("/admin/dashboard");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-vermilion">Duyan Blog</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Editor sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The desk behind the reviews — drafts, offers and redirects live here.
        </p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        No account? Admins are created via <code className="rounded-sm bg-muted px-1.5 py-0.5">npm run admin:bootstrap</code>{" "}
        on the server.
      </p>
    </div>
  );
}
