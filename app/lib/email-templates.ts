/**
 * Bilingual email templates (EN/ES) for the Compose + Reply pickers in
 * /dashboard/inbox. Templates carry placeholder variables in `{snake_case}`.
 *
 * Two classes of variable:
 *   - auto: substituted at insert-time from the connected Gmail user
 *           (currently `user_first_name`, `user_full_name`).
 *   - manual: left as bracketed placeholders in the body so Roger can
 *             fill them before sending. (e.g. `{customer_first_name}`,
 *             `{project_name}`, `{brand_list}`, `{quote_amount}`, etc.)
 *
 * Template scope (per GMAIL_INTEGRATION_SPEC.md §9 W4 D4):
 *   1. quote-follow-up
 *   2. deposit-reminder
 *   3. shipment-update
 *   4. delay-notice
 *   5. delivery-scheduled
 */

export type TemplateLocale = "en" | "es";

export type TemplateId =
  | "quote-follow-up"
  | "deposit-reminder"
  | "shipment-update"
  | "delay-notice"
  | "delivery-scheduled";

export interface EmailTemplate {
  id: TemplateId;
  locale: TemplateLocale;
  label: string;
  subject: string;
  body: string;
}

export const TEMPLATE_LABELS: Record<TemplateId, { en: string; es: string }> = {
  "quote-follow-up": { en: "Quote follow-up", es: "Seguimiento de cotización" },
  "deposit-reminder": { en: "Deposit reminder", es: "Recordatorio de anticipo" },
  "shipment-update": { en: "Shipment update", es: "Actualización de envío" },
  "delay-notice": { en: "Delay notice", es: "Aviso de retraso" },
  "delivery-scheduled": { en: "Delivery scheduled", es: "Entrega agendada" },
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // 1. Quote follow-up ────────────────────────────────────────────────
  {
    id: "quote-follow-up",
    locale: "en",
    label: TEMPLATE_LABELS["quote-follow-up"].en,
    subject: "Following up on your quote — {project_name}",
    body: `Hi {customer_first_name},

Just circling back on the quote we sent for {project_name} ({brand_list}). Let me know if you have any questions on specs, lead times, or the landed-cost breakdown — happy to walk through any line item.

If the timing has shifted on your end, send me your latest target install date and I'll re-confirm production + delivery windows.

Best,
{user_first_name}
Counter Cultures`,
  },
  {
    id: "quote-follow-up",
    locale: "es",
    label: TEMPLATE_LABELS["quote-follow-up"].es,
    subject: "Seguimiento de tu cotización — {project_name}",
    body: `Hola {customer_first_name},

Te escribo para dar seguimiento a la cotización que enviamos para {project_name} ({brand_list}). Si tienes preguntas sobre especificaciones, tiempos de entrega o el desglose de costo entregado, con gusto repaso cualquier partida contigo.

Si el calendario cambió de tu lado, mándame la nueva fecha objetivo de instalación y te re-confirmo ventanas de producción y entrega.

Saludos,
{user_first_name}
Counter Cultures`,
  },

  // 2. Deposit reminder ───────────────────────────────────────────────
  {
    id: "deposit-reminder",
    locale: "en",
    label: TEMPLATE_LABELS["deposit-reminder"].en,
    subject: "Deposit due — {project_name}",
    body: `Hi {customer_first_name},

A friendly reminder that the {deposit_amount} deposit for {project_name} is due on {deposit_due_date} so we can release the order to {brand_list} and protect your delivery window.

Wire details and the deposit invoice are attached. Reply when the transfer is initiated and I'll confirm receipt as soon as it lands.

Best,
{user_first_name}
Counter Cultures`,
  },
  {
    id: "deposit-reminder",
    locale: "es",
    label: TEMPLATE_LABELS["deposit-reminder"].es,
    subject: "Anticipo por cobrar — {project_name}",
    body: `Hola {customer_first_name},

Te recuerdo amablemente que el anticipo de {deposit_amount} para {project_name} vence el {deposit_due_date}, para poder liberar el pedido con {brand_list} y proteger tu ventana de entrega.

Adjunto los datos para transferencia y la factura de anticipo. En cuanto inicies la transferencia, respóndeme y te confirmo la recepción al momento que se acredite.

Saludos,
{user_first_name}
Counter Cultures`,
  },

  // 3. Shipment update ────────────────────────────────────────────────
  {
    id: "shipment-update",
    locale: "en",
    label: TEMPLATE_LABELS["shipment-update"].en,
    subject: "Shipment update — {project_name}",
    body: `Hi {customer_first_name},

Quick status update on the {brand_list} shipment for {project_name}: currently {shipment_status}. Pedimento {pedimento_number}.

Current ETA at our SMA warehouse: {eta_delivered}. I'll send the next update at the next milestone — sooner if anything changes.

Best,
{user_first_name}
Counter Cultures`,
  },
  {
    id: "shipment-update",
    locale: "es",
    label: TEMPLATE_LABELS["shipment-update"].es,
    subject: "Actualización de envío — {project_name}",
    body: `Hola {customer_first_name},

Actualización rápida del envío de {brand_list} para {project_name}: actualmente {shipment_status}. Pedimento {pedimento_number}.

Llegada estimada a nuestra bodega en SMA: {eta_delivered}. Te aviso en el próximo hito — antes si algo cambia.

Saludos,
{user_first_name}
Counter Cultures`,
  },

  // 4. Delay notice ───────────────────────────────────────────────────
  {
    id: "delay-notice",
    locale: "en",
    label: TEMPLATE_LABELS["delay-notice"].en,
    subject: "Update on {project_name} — revised ETA",
    body: `Hi {customer_first_name},

Wanted to give you an honest heads-up on {project_name}: your {brand_list} shipment is running about {delay_days} days behind the original ETA due to {delay_reason}. New expected delivery: {eta_delivered}.

We're in daily contact with the broker and pushing for any recovery time available. I'll let you know the moment we have firmer dates. Appreciate your patience.

Best,
{user_first_name}
Counter Cultures`,
  },
  {
    id: "delay-notice",
    locale: "es",
    label: TEMPLATE_LABELS["delay-notice"].es,
    subject: "Actualización de {project_name} — nueva fecha estimada",
    body: `Hola {customer_first_name},

Quería darte un aviso honesto sobre {project_name}: tu envío de {brand_list} lleva alrededor de {delay_days} días de retraso vs. la fecha original, por {delay_reason}. Nueva entrega estimada: {eta_delivered}.

Estamos en contacto diario con el agente aduanal y empujando cualquier tiempo recuperable. Te aviso en cuanto tengamos fechas más firmes. Gracias por tu paciencia.

Saludos,
{user_first_name}
Counter Cultures`,
  },

  // 5. Delivery scheduled ─────────────────────────────────────────────
  {
    id: "delivery-scheduled",
    locale: "en",
    label: TEMPLATE_LABELS["delivery-scheduled"].en,
    subject: "Delivery scheduled — {project_name} on {delivery_date}",
    body: `Hi {customer_first_name},

Good news — your {brand_list} order for {project_name} is scheduled for delivery on {delivery_date}.

Please confirm:
  • Site is ready to receive (clear access, someone on-site to sign)
  • Best contact at the jobsite (name + phone)

If anything on your end has shifted, reply with a new preferred date and we'll re-coordinate with the carrier.

Best,
{user_first_name}
Counter Cultures`,
  },
  {
    id: "delivery-scheduled",
    locale: "es",
    label: TEMPLATE_LABELS["delivery-scheduled"].es,
    subject: "Entrega agendada — {project_name} el {delivery_date}",
    body: `Hola {customer_first_name},

Buenas noticias — tu pedido de {brand_list} para {project_name} está agendado para entrega el {delivery_date}.

Por favor confirma:
  • La obra está lista para recibir (acceso libre, alguien en sitio para firmar)
  • Mejor contacto en obra (nombre + teléfono)

Si algo cambió de tu lado, respóndeme con una nueva fecha preferida y re-coordinamos con el transportista.

Saludos,
{user_first_name}
Counter Cultures`,
  },
];

const VAR_PATTERN = /\{([a-z_][a-z0-9_]*)\}/gi;

export const applyTemplateVars = (
  text: string,
  vars: Record<string, string | undefined>
): string =>
  text.replace(VAR_PATTERN, (match, key: string) => {
    const value = vars[key];
    return typeof value === "string" && value.length > 0 ? value : match;
  });

export interface AppliedTemplate {
  subject: string;
  body: string;
}

export const applyTemplate = (
  template: EmailTemplate,
  vars: Record<string, string | undefined>
): AppliedTemplate => ({
  subject: applyTemplateVars(template.subject, vars),
  body: applyTemplateVars(template.body, vars),
});

/**
 * Best-effort first-name extraction from an email address. Splits the
 * local-part on `.` / `_` / `-`, takes the first token, capitalises.
 *   "joshua.semolik@x" → "Joshua"
 *   "roger@x"          → "Roger"
 */
export const guessFirstNameFromEmail = (email?: string | null): string => {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._-]/)[0] ?? "";
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "";
};

/**
 * Best-effort full-name extraction. Splits local-part, capitalises each
 * token, joins with a space. "joshua.semolik@x" → "Joshua Semolik".
 */
export const guessFullNameFromEmail = (email?: string | null): string => {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
};

export const getTemplatesByLocale = (locale: TemplateLocale): EmailTemplate[] =>
  EMAIL_TEMPLATES.filter((t) => t.locale === locale);
