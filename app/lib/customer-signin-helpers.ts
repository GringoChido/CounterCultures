const CUSTOMER_AUTH_BASE = "/api/auth/customer";

export function safeCallbackUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("://")) return null;
  if (raw.startsWith("/dashboard")) return null;
  return raw;
}

export function readClientLocale(): "en" | "es" {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  const val = match?.[1]?.trim();
  return val === "es" ? "es" : "en";
}

export async function sendCustomerMagicLink(
  email: string,
  callbackUrl: string = "/account/welcome",
  optIn: boolean = true,
): Promise<boolean> {
  try {
    await fetch("/api/account/whatsapp-opt-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), optIn }),
    });
  } catch { /* best-effort */ }

  try {
    const csrfRes = await fetch(`${CUSTOMER_AUTH_BASE}/csrf`);
    const { csrfToken } = await csrfRes.json();

    const res = await fetch(`${CUSTOMER_AUTH_BASE}/signin/email`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        email: email.trim().toLowerCase(),
        csrfToken,
        callbackUrl,
      }),
      redirect: "follow",
    });

    return res.url?.includes("/account/check-email") || res.ok;
  } catch {
    return false;
  }
}
