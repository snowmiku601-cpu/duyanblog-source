/**
 * Email transport — the only place the app knows how to send mail.
 *
 * Providers, in priority order:
 *  1. RESEND_API_KEY (env) → POST to Resend's HTTP API. No SDK dependency;
 *    a plain fetch keeps the bundle lean and Hostinger deployments simple.
 *  2. No key → "console" transport: the message is logged as a structured
 *    line and `delivered: false` is reported, so callers can decide whether
 *    a dev shortcut (e.g. the newsletter confirmUrl) is safe to expose.
 *
 * Non-goals: queues/retries (HTTP 4xx/5xx are surfaced, not retried), batch
 * sends, attachments. When transactional email becomes a bigger surface,
 * swap this module's internals — call sites keep the sendMail() contract.
 */

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type MailResult = {
  delivered: boolean;
  provider: "resend" | "console" | "none";
  error?: string;
};

const FROM_DEFAULT = "Duyan Blog <onboarding@resend.dev>";

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || FROM_DEFAULT;
}

async function sendViaResend(msg: MailMessage): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY!.trim();
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
      }),
    });
    if (res.ok) return { delivered: true, provider: "resend" };
    const body = await res.text().catch(() => "");
    console.error(`[email] resend ${res.status}: ${body.slice(0, 300)}`);
    return { delivered: false, provider: "resend", error: `Resend returned ${res.status}` };
  } catch (err) {
    console.error("[email] resend request failed", err);
    return { delivered: false, provider: "resend", error: "Network error talking to Resend" };
  }
}

function sendToConsole(msg: MailMessage): MailResult {
  console.info(
    `[email:console] to=${msg.to} subject=${JSON.stringify(msg.subject)}\n${msg.text}`,
  );
  return { delivered: false, provider: "console" };
}

/**
 * Send a message through whichever provider is configured. Never throws —
 * callers get a MailResult and decide what the user sees.
 */
export async function sendMail(msg: MailMessage): Promise<MailResult> {
  if (process.env.RESEND_API_KEY?.trim()) {
    return sendViaResend(msg);
  }
  if (process.env.NODE_ENV !== "production") {
    return sendToConsole(msg);
  }
  // Production without a provider — say so loudly once, and report failure.
  console.warn(
    "[email] RESEND_API_KEY is not set — outgoing mail is disabled. " +
      "Set it (see .env.example) or subscribers will never receive confirmations.",
  );
  return { delivered: false, provider: "none", error: "No email provider configured" };
}

/* ---------------------------------------------------------------------------
   Newsletter templates — one brand, plain and honest, no dark patterns.
--------------------------------------------------------------------------- */

export function newsletterConfirmEmail(confirmUrl: string): Omit<MailMessage, "to"> {
  const subject = "Confirm your Duyan Blog subscription";
  const text = [
    "Welcome to the desk.",
    "",
    "You asked to hear from Duyan Blog — one email when we publish, nothing else.",
    "Confirm your address with this link (valid for 48 hours):",
    "",
    confirmUrl,
    "",
    "If it wasn't you, ignore this message and you won't be subscribed.",
    "",
    "— Duyan Blog, independent reviews with reasons attached",
  ].join("\n");
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#faf7f2;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#1a1815;">
    <p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#c2452d;margin:0 0 20px;">Duyan Blog — The desk</p>
    <h1 style="font-size:24px;line-height:1.25;margin:0 0 12px;">One click and you're on the list.</h1>
    <p style="font-size:16px;line-height:1.65;margin:0 0 24px;">You asked to hear from Duyan Blog — one email when we publish, nothing else. Confirm your address (link valid for 48 hours):</p>
    <p style="margin:0 0 24px;">
      <a href="${confirmUrl}" style="display:inline-block;background:#c2452d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.06em;padding:12px 22px;border-radius:3px;">Confirm subscription</a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:#6b665e;margin:0 0 8px;">Or paste this link into your browser:<br><a href="${confirmUrl}" style="color:#c2452d;">${confirmUrl}</a></p>
    <hr style="border:none;border-top:1px solid #e5ded2;margin:24px 0;">
    <p style="font-size:12px;line-height:1.6;color:#8a8478;margin:0;">If it wasn't you, ignore this message and you won't be subscribed.<br>Duyan Blog — independent reviews with reasons attached.</p>
  </div>
</body></html>`;
  return { subject, text, html };
}

/** Admin "is mail working?" probe — sent from the Settings page. */
export function adminTestEmail(sentBy: string): Omit<MailMessage, "to"> {
  const subject = "Duyan Blog test email — the mail transport works";
  const text = [
    "This is a test email from the Duyan Blog admin.",
    "",
    `Requested by: ${sentBy}`,
    `Sent at: ${new Date().toISOString()}`,
    "",
    "If you can read this, the configured transport delivers mail end-to-end.",
    "Newsletter confirmations use the exact same path.",
    "",
    "— Duyan Blog, independent reviews with reasons attached",
  ].join("\n");
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#faf7f2;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#1a1815;">
    <p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#c2452d;margin:0 0 20px;">Duyan Blog — The desk</p>
    <h1 style="font-size:24px;line-height:1.25;margin:0 0 12px;">The mail transport works.</h1>
    <p style="font-size:16px;line-height:1.65;margin:0 0 24px;">This test email was requested by <strong>${sentBy}</strong> at ${new Date().toISOString()}. Newsletter confirmations use the exact same delivery path.</p>
    <hr style="border:none;border-top:1px solid #e5ded2;margin:24px 0;">
    <p style="font-size:12px;line-height:1.6;color:#8a8478;margin:0;">Duyan Blog — independent reviews with reasons attached.</p>
  </div>
</body></html>`;
  return { subject, text, html };
}
