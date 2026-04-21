/**
 * WhatsApp Business API client — gated by WHATSAPP_ENABLED env flag.
 *
 * When disabled (default): sendWhatsAppTemplate() logs a dry-run line and
 * returns { status: "dry_run" } without any network I/O. This lets W8
 * ship before Meta approves the templates — code path is live, the flag
 * flips once approval lands.
 *
 * When enabled: POSTs to Meta Graph API v21.0 /{phone_id}/messages with
 * template-based messaging. Template names must be pre-registered in Meta
 * Business Manager (ops task, not code).
 *
 * Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */

const GRAPH_API_VERSION = "v21.0";

export interface SendWhatsAppTemplateInput {
  to: string;                    // E.164, e.g. "+5214151112222"
  templateName: string;          // Meta-registered (e.g. "cc_c_03_deposit_received_v1")
  languageCode: "en" | "es_MX" | "en_US";
  components?: Array<{
    type: "body" | "header";
    parameters: Array<{ type: "text"; text: string }>;
  }>;
}

export interface SendWhatsAppResult {
  status: "sent" | "dry_run" | "failed";
  error?: string;
  messageId?: string;
}

export const isWhatsAppEnabled = (): boolean =>
  process.env.WHATSAPP_ENABLED === "true" &&
  !!process.env.WHATSAPP_API_TOKEN &&
  !!process.env.WHATSAPP_PHONE_ID;

/**
 * Internal free-text send — for Roger alerts where his own number has an
 * active 24h session window with the business (he messages himself /
 * the business number regularly). NOT for customer-facing comms; those
 * require an approved template + sendWhatsAppTemplate below.
 */
export const sendWhatsAppFreeText = async (
  to: string,
  body: string
): Promise<SendWhatsAppResult> => {
  if (!isWhatsAppEnabled()) {
    console.log(`[WhatsApp DRY RUN] to=${to} free-text body=${body}`);
    return { status: "dry_run" };
  }
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      return {
        status: "failed",
        error: json.error?.message ?? `Meta returned ${res.status}`,
      };
    }
    return { status: "sent", messageId: json.messages?.[0]?.id };
  } catch (err) {
    return {
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

export const sendWhatsAppTemplate = async (
  input: SendWhatsAppTemplateInput
): Promise<SendWhatsAppResult> => {
  if (!isWhatsAppEnabled()) {
    console.log(
      `[WhatsApp DRY RUN] to=${input.to} template=${input.templateName} ` +
        `lang=${input.languageCode} components=${JSON.stringify(input.components ?? [])}`
    );
    return { status: "dry_run" };
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to: input.to,
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.languageCode },
      ...(input.components && input.components.length > 0
        ? { components: input.components }
        : {}),
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      return {
        status: "failed",
        error: json.error?.message ?? `Meta returned ${res.status}`,
      };
    }
    return {
      status: "sent",
      messageId: json.messages?.[0]?.id,
    };
  } catch (err) {
    return {
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
};
