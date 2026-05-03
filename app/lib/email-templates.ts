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

// ---------------------------------------------------------------------------
// W8 — ALERT TEMPLATES — per PIPELINE_AUTOMATION_SPEC.md §Notifications
// ---------------------------------------------------------------------------
//
// Three audiences × 14-stage pipeline = 31 distinct templates:
//   - 10 customer touchpoints (C-01..C-10)   — email + WhatsApp
//   - 14 Roger alerts (R-01..R-14)           — dashboard + (WA free-text)
//   - 7  Finance alerts (F-01..F-07)         — email only
//
// Every template is bilingual EN/ES. Customer templates carry a WhatsApp
// body string AND a `metaTemplateName` placeholder — once Joshua registers
// the templates in Meta Business Manager + they're approved, fill those
// in. Until then the dispatcher sends via dry-run logger.

export type AlertAudience = "customer" | "roger" | "finance";

export interface AlertLocaleContent {
  subject: string;
  body: string;
}

export interface AlertWhatsAppContent {
  en: string;
  es: string;
  metaTemplateName?: string; // filled in post-Meta-approval
}

export interface AlertTemplate {
  id: string;
  audience: AlertAudience;
  locales: {
    en: AlertLocaleContent;
    es: AlertLocaleContent;
  };
  whatsapp?: AlertWhatsAppContent;
}

// Placeholder vars referenced below (not an exhaustive list — any
// {snake_case} token is substituted from the vars map):
//   customer_name, customer_first_name, deal_id, project_name,
//   brand_list, total_value, deposit_amount, deposit_pct,
//   payment_deadline, stripe_link, bank_details, eta_delivered,
//   production_eta, days_to_production_complete, origin_port,
//   tracking_link, eta_border, nom_status, broker_contact,
//   broker_firm, days_to_eta, pedimento_number, duties_paid_mxn,
//   iva_paid_mxn, balance_amount_mxn, customer_phone,
//   scheduled_delivery_datetime, installer_name, installer_phone,
//   delivery_location, issue_type, issue_summary, recommended_action,
//   total_collected_mxn, testimonial_link, photo_upload_link,
//   portfolio_url, po_amount_usd, amount, fx_amount_usd, fx_amount_mxn,
//   fx_rate, payment_terms
export const ALERT_TEMPLATES: Record<string, AlertTemplate> = {
  // =========================================================================
  // CUSTOMER — C-01..C-10
  // =========================================================================

  "C-01-quote-approved": {
    id: "C-01-quote-approved",
    audience: "customer",
    locales: {
      en: {
        subject: "Thanks for approving your proposal — {project_name}",
        body: `Hi {customer_first_name},

Thanks for approving your proposal for {project_name}! We're excited to bring this project to life with {brand_list}.

We'll send your deposit invoice ({deposit_amount} MXN, {deposit_pct}%) within 24 hours so we can begin production.

If you have any questions in the meantime, just reply to this email.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "Gracias por aprobar tu propuesta — {project_name}",
        body: `Hola {customer_first_name},

¡Gracias por aprobar tu propuesta para {project_name}! Nos entusiasma traer este proyecto a la vida con {brand_list}.

Te enviaremos la factura del anticipo ({deposit_amount} MXN, {deposit_pct}%) en las próximas 24 horas para comenzar la producción.

Si tienes cualquier pregunta mientras tanto, solo contesta este correo.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "Thanks for approving {project_name}! Deposit invoice ({deposit_amount} MXN) coming within 24h.",
      es: "¡Gracias por aprobar {project_name}! Factura de anticipo ({deposit_amount} MXN) en 24h.",
    },
  },

  "C-02-deposit-invoice": {
    id: "C-02-deposit-invoice",
    audience: "customer",
    locales: {
      en: {
        subject: "Deposit invoice — {project_name}",
        body: `Hi {customer_first_name},

Your deposit invoice for {project_name} is attached ({deposit_amount} MXN, {deposit_pct}%).

Payment by {payment_deadline} to begin production.

Pay online: {stripe_link}
Wire transfer: {bank_details}

Once we receive your deposit, we'll place the order with {brand_list} immediately.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "Factura de anticipo — {project_name}",
        body: `Hola {customer_first_name},

Adjunto la factura de tu anticipo para {project_name} ({deposit_amount} MXN, {deposit_pct}%).

Pago antes del {payment_deadline} para iniciar la producción.

Pago en línea: {stripe_link}
Transferencia SPEI: {bank_details}

Al recibir tu anticipo, colocaremos inmediatamente el pedido con {brand_list}.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "Deposit invoice for {project_name}: {deposit_amount} MXN, due {payment_deadline}. Pay: {stripe_link}",
      es: "Factura de anticipo para {project_name}: {deposit_amount} MXN, vence {payment_deadline}. Pagar: {stripe_link}",
    },
  },

  "C-03-deposit-received": {
    id: "C-03-deposit-received",
    audience: "customer",
    locales: {
      en: {
        subject: "Deposit received — {project_name} order being placed",
        body: `Hi {customer_first_name},

Deposit received for {project_name}, thank you! We're placing your order with {brand_list} now.

Estimated delivery: {eta_delivered}.

We'll keep you posted as each milestone hits — production, shipping, customs clearance, and final delivery.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "Anticipo recibido — colocando la orden de {project_name}",
        body: `Hola {customer_first_name},

¡Anticipo recibido para {project_name}, gracias! Estamos colocando tu pedido con {brand_list} ahora.

Entrega estimada: {eta_delivered}.

Te mantendremos al tanto en cada etapa — producción, envío, aduana y entrega final.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "Deposit received! Placing your order with {brand_list}. ETA delivery: {eta_delivered}.",
      es: "¡Anticipo recibido! Colocando tu pedido con {brand_list}. Entrega estimada: {eta_delivered}.",
    },
  },

  "C-04-order-placed": {
    id: "C-04-order-placed",
    audience: "customer",
    locales: {
      en: {
        subject: "Order placed — {project_name} in production soon",
        body: `Hi {customer_first_name},

We've placed your order with {brand_list} today.

Expected production completion: {production_eta}.

We'll let you know the moment your order ships.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "Pedido colocado — {project_name} en producción pronto",
        body: `Hola {customer_first_name},

Hemos colocado tu pedido con {brand_list} hoy.

Terminación de producción estimada: {production_eta}.

Te avisaremos en cuanto tu pedido se envíe.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "Order placed with {brand_list}. Production complete ~{production_eta}.",
      es: "Pedido colocado con {brand_list}. Producción lista ~{production_eta}.",
    },
  },

  "C-05-production-confirmed": {
    id: "C-05-production-confirmed",
    audience: "customer",
    locales: {
      en: {
        subject: "In production — {project_name}",
        body: `Hi {customer_first_name},

Your {brand_list} order is confirmed and now in production. Factory completion: {production_eta}.

We'll notify you when it ships.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "En producción — {project_name}",
        body: `Hola {customer_first_name},

Tu pedido de {brand_list} está confirmado y ahora en producción. Terminación de fábrica: {production_eta}.

Te notificaremos cuando se envíe.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "{brand_list} now in production. Factory complete {production_eta}.",
      es: "{brand_list} ahora en producción. Fábrica lista {production_eta}.",
    },
  },

  "C-06-shipped": {
    id: "C-06-shipped",
    audience: "customer",
    locales: {
      en: {
        subject: "Shipped! {project_name} en route",
        body: `Hi {customer_first_name},

Your {brand_list} order for {project_name} shipped today from {origin_port}!

Tracking: {tracking_link}
ETA Mexico border: {eta_border}

We'll be in touch when it arrives at customs.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "¡Enviado! {project_name} en tránsito",
        body: `Hola {customer_first_name},

Tu pedido de {brand_list} para {project_name} se envió hoy desde {origin_port}.

Seguimiento: {tracking_link}
ETA frontera México: {eta_border}

Te contactaremos cuando llegue a aduana.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "Shipped! {brand_list} for {project_name} en route. Tracking: {tracking_link}. ETA border: {eta_border}.",
      es: "¡Enviado! {brand_list} para {project_name} en tránsito. Seguimiento: {tracking_link}. ETA frontera: {eta_border}.",
    },
  },

  "C-07-in-customs": {
    id: "C-07-in-customs",
    audience: "customer",
    locales: {
      en: {
        subject: "At the border — {project_name} in customs",
        body: `Hi {customer_first_name},

Your shipment for {project_name} arrived at the Mexican border today ✅

Now in customs clearance. Expected clearance: {eta_delivered}.

We'll keep you posted if anything changes.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "En la frontera — {project_name} en aduana",
        body: `Hola {customer_first_name},

Tu envío para {project_name} llegó hoy a la frontera mexicana ✅

Ahora en proceso aduanal. Liberación estimada: {eta_delivered}.

Te informaremos si hay cualquier cambio.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "Your shipment for {project_name} arrived at the Mexican border today ✅ Now in customs. Expected clearance: {eta_delivered}.",
      es: "Tu envío para {project_name} llegó a la frontera mexicana hoy ✅ En aduana. Liberación estimada: {eta_delivered}.",
    },
  },

  "C-08-customs-cleared": {
    id: "C-08-customs-cleared",
    audience: "customer",
    locales: {
      en: {
        subject: "Cleared customs — en route to San Miguel",
        body: `Hi {customer_first_name},

Great news — your {brand_list} shipment cleared Mexican customs today.

In domestic transit to San Miguel de Allende. Expected delivery: {eta_delivered}.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "Aduana liberada — en tránsito a San Miguel",
        body: `Hola {customer_first_name},

Excelentes noticias — tu envío de {brand_list} liberó aduana hoy.

En tránsito doméstico hacia San Miguel de Allende. Entrega estimada: {eta_delivered}.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "Great news — {brand_list} cleared Mexican customs. En route to SMA. Delivery: {eta_delivered}.",
      es: "Excelentes noticias — {brand_list} liberó aduana. En tránsito a SMA. Entrega: {eta_delivered}.",
    },
  },

  "C-09-delivered": {
    id: "C-09-delivered",
    audience: "customer",
    locales: {
      en: {
        subject: "Delivered — {project_name}",
        body: `Hi {customer_first_name},

Delivered! Your {brand_list} arrived at {delivery_location} today.

Final invoice for the remaining balance ({balance_amount_mxn} MXN) is attached. Photos from the install are also included.

Thank you for choosing Counter Cultures for this project.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "Entregado — {project_name}",
        body: `Hola {customer_first_name},

¡Entregado! Tu {brand_list} llegó a {delivery_location} hoy.

Adjunto la factura final con el saldo restante ({balance_amount_mxn} MXN). Las fotos de la instalación también van incluidas.

Gracias por elegir Counter Cultures para este proyecto.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "Delivered! {brand_list} at {delivery_location}. Final invoice ({balance_amount_mxn} MXN) attached.",
      es: "¡Entregado! {brand_list} en {delivery_location}. Factura final ({balance_amount_mxn} MXN) adjunta.",
    },
  },

  "C-10-complete": {
    id: "C-10-complete",
    audience: "customer",
    locales: {
      en: {
        subject: "Thank you — {project_name} complete",
        body: `Hi {customer_first_name},

Project complete. Thank you — it was a pleasure working with you on {project_name}.

We'd love if you'd share your experience: {testimonial_link}
Photos for our project portfolio: {photo_upload_link}

And, of course, we're here whenever the next project starts.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "Gracias — {project_name} completo",
        body: `Hola {customer_first_name},

Proyecto completo. Gracias — fue un placer trabajar contigo en {project_name}.

Nos encantaría que compartieras tu experiencia: {testimonial_link}
Fotos para nuestro portafolio: {photo_upload_link}

Y, por supuesto, estamos aquí cuando empiece el próximo proyecto.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "Thank you, {customer_first_name}! {project_name} complete. Share your experience: {testimonial_link}",
      es: "¡Gracias, {customer_first_name}! {project_name} completo. Comparte tu experiencia: {testimonial_link}",
    },
  },

  // R4 Note 8: customer-service + marketing follow-up. Asks "how was
  // everything?", reminds them their installer can reach out, and
  // softly opens the door to ongoing contact. Fires alongside C-10 on
  // T-13 (project complete). Marketing-bucket segmentation happens
  // server-side off the Lead's contact_type / marketing_segment — not
  // visible to the customer.
  "C-11-feedback": {
    id: "C-11-feedback",
    audience: "customer",
    locales: {
      en: {
        subject: "How was {project_name}?",
        body: `Hi {customer_first_name},

Now that {project_name} is in and installed, I wanted to check in honestly: how was everything? Did the {brand_list} pieces meet expectations day-to-day?

If anything came up — a finish that wasn't quite right, a piece that needs tightening, a question about cleaning or maintenance — your installer can reach out to us directly. We'll get them what they need.

If everything's perfect, even better. We'd love a couple of lines for the project portfolio: {testimonial_link}

And whenever the next project starts, we're a message away.

Warmly,
Roger
Counter Cultures`,
      },
      es: {
        subject: "¿Cómo quedó {project_name}?",
        body: `Hola {customer_first_name},

Ahora que {project_name} ya está instalado, quería preguntarte honestamente: ¿cómo quedó todo? ¿Las piezas de {brand_list} están cumpliendo en el día a día?

Si surgió algo — un acabado que no quedó bien, una pieza que necesita ajuste, una duda sobre limpieza o mantenimiento — tu instalador puede contactarnos directamente. Le damos lo que necesite.

Si todo está perfecto, mejor aún. Nos encantaría unas líneas para el portafolio: {testimonial_link}

Y cuando arranque el próximo proyecto, estamos a un mensaje.

Cordialmente,
Roger
Counter Cultures`,
      },
    },
    whatsapp: {
      en: "Hi {customer_first_name} — how is {project_name} going? Any questions, your installer can reach us directly. If everything's perfect, a couple lines for our portfolio would mean a lot: {testimonial_link}",
      es: "Hola {customer_first_name} — ¿cómo va {project_name}? Si surge algo, tu instalador puede contactarnos directo. Si todo está perfecto, unas líneas para nuestro portafolio significarían mucho: {testimonial_link}",
    },
  },

  // =========================================================================
  // ROGER — R-01..R-14 (dashboard-first; WA free-text when WHATSAPP_ENABLED)
  // =========================================================================

  "R-01-quote-approved": {
    id: "R-01-quote-approved",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · Quote approved", body: "📝 Quote approved — {project_name}, {total_value} MXN, deposit {deposit_amount} due {payment_deadline}" },
      es: { subject: "DEAL-{deal_id} · Cotización aprobada", body: "📝 Cotización aprobada — {project_name}, {total_value} MXN, anticipo {deposit_amount} vence {payment_deadline}" },
    },
  },
  "R-02-deposit-pending-3d": {
    id: "R-02-deposit-pending-3d",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · Deposit 3d+ overdue", body: "⏰ Deposit pending 3+ days — {project_name}, {customer_name}. Consider calling {customer_phone}." },
      es: { subject: "DEAL-{deal_id} · Anticipo 3d+ vencido", body: "⏰ Anticipo pendiente 3+ días — {project_name}, {customer_name}. Considera llamar {customer_phone}." },
    },
  },
  "R-03-deposit-received": {
    id: "R-03-deposit-received",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · Deposit received", body: "💰 Deposit received ({amount} MXN) — ready to PO {brand_list}. Total PO: ~{po_amount_usd} USD." },
      es: { subject: "DEAL-{deal_id} · Anticipo recibido", body: "💰 Anticipo recibido ({amount} MXN) — listo para ordenar {brand_list}. OC total: ~{po_amount_usd} USD." },
    },
  },
  "R-04-ordering-sla-breach": {
    id: "R-04-ordering-sla-breach",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · Brand not confirmed in 3d", body: "🔔 Ordering SLA breach — {brand_list} not confirmed. Follow up with brand." },
      es: { subject: "DEAL-{deal_id} · Marca sin confirmar 3d+", body: "🔔 Ordering SLA superado — {brand_list} sin confirmar. Dar seguimiento." },
    },
  },
  "R-05-in-production": {
    id: "R-05-in-production",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · In production", body: "🏭 In Production — countdown {days_to_production_complete} days to {production_eta}." },
      es: { subject: "DEAL-{deal_id} · En producción", body: "🏭 En Producción — quedan {days_to_production_complete} días hasta {production_eta}." },
    },
  },
  "R-06-shipped": {
    id: "R-06-shipped",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · Shipped", body: "🚢 Shipped from {origin_port}. Broker: {broker_firm}. Pedimento expected by {eta_border}." },
      es: { subject: "DEAL-{deal_id} · Enviado", body: "🚢 Enviado desde {origin_port}. Agente: {broker_firm}. Pedimento esperado para {eta_border}." },
    },
  },
  "R-07-in-customs": {
    id: "R-07-in-customs",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · In customs", body: "⚠ In customs. NOM status: {nom_status}. Broker: {broker_contact}. Days to client ETA: {days_to_eta}." },
      es: { subject: "DEAL-{deal_id} · En aduana", body: "⚠ En aduana. NOM: {nom_status}. Agente: {broker_contact}. Días para ETA cliente: {days_to_eta}." },
    },
  },
  "R-08-customs-cleared": {
    id: "R-08-customs-cleared",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · Customs cleared", body: "✅ Cleared! Moving to warehouse. Pedimento {pedimento_number}." },
      es: { subject: "DEAL-{deal_id} · Aduana liberada", body: "✅ ¡Liberada! En tránsito a bodega. Pedimento {pedimento_number}." },
    },
  },
  "R-09-received-at-cc": {
    id: "R-09-received-at-cc",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · At CC warehouse", body: "📦 Ready to schedule delivery. Contact {customer_name} at {customer_phone}." },
      es: { subject: "DEAL-{deal_id} · En bodega CC", body: "📦 Listo para agendar entrega. Contactar a {customer_name} al {customer_phone}." },
    },
  },
  "R-10-delivery-scheduled": {
    id: "R-10-delivery-scheduled",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · Delivery scheduled", body: "📅 Scheduled {scheduled_delivery_datetime}. Installer: {installer_name} ({installer_phone})." },
      es: { subject: "DEAL-{deal_id} · Entrega agendada", body: "📅 Agendado {scheduled_delivery_datetime}. Instalador: {installer_name} ({installer_phone})." },
    },
  },
  "R-11-delivered": {
    id: "R-11-delivered",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · Delivered", body: "✅ DEAL-{deal_id} delivered to {customer_name}. Final invoice ({balance_amount_mxn} MXN) auto-generating." },
      es: { subject: "DEAL-{deal_id} · Entregado", body: "✅ DEAL-{deal_id} entregado a {customer_name}. Factura final ({balance_amount_mxn} MXN) generándose." },
    },
  },
  "R-12-balance-pending-reminder": {
    id: "R-12-balance-pending-reminder",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · Balance 14d+ overdue", body: "💸 Balance pending 14+ days — {customer_name}, {balance_amount_mxn} MXN. Finance escalating." },
      es: { subject: "DEAL-{deal_id} · Saldo 14d+ vencido", body: "💸 Saldo pendiente 14+ días — {customer_name}, {balance_amount_mxn} MXN. Finanzas escalando." },
    },
  },
  "R-13-complete": {
    id: "R-13-complete",
    audience: "roger",
    locales: {
      en: { subject: "DEAL-{deal_id} · Complete 🎉", body: "🎉 Complete — {project_name}, {total_collected_mxn} MXN collected. Portfolio-ready? Add: {portfolio_url}" },
      es: { subject: "DEAL-{deal_id} · Completado 🎉", body: "🎉 Completado — {project_name}, {total_collected_mxn} MXN cobrados. ¿Para portafolio? Agrega: {portfolio_url}" },
    },
  },
  "R-14-issue": {
    id: "R-14-issue",
    audience: "roger",
    locales: {
      // No emoji — severity is already conveyed via the Needs You panel's
      // danger dot + the bell badge's red ring. Title reads cleanly.
      en: { subject: "DEAL-{deal_id} · Issue flagged", body: "DEAL-{deal_id} flagged — {issue_type}. {issue_summary}. Recommended: {recommended_action}" },
      es: { subject: "DEAL-{deal_id} · Incidencia", body: "DEAL-{deal_id} con incidencia — {issue_type}. {issue_summary}. Recomendado: {recommended_action}" },
    },
  },

  // =========================================================================
  // FINANCE — F-01..F-07 (email only; detailed with amounts + pedimento)
  // =========================================================================

  "F-01-deposit-cfdi-request": {
    id: "F-01-deposit-cfdi-request",
    audience: "finance",
    locales: {
      en: {
        subject: "DEAL-{deal_id} · Generate deposit CFDI",
        body: `Deposit CFDI request:

Deal: DEAL-{deal_id} · {project_name}
Customer: {customer_name}
Amount: {deposit_amount} MXN ({deposit_pct}%)
Due: {payment_deadline}

Please issue the CFDI and attach to the deal.`,
      },
      es: {
        subject: "DEAL-{deal_id} · Generar CFDI de anticipo",
        body: `Solicitud de CFDI de anticipo:

Deal: DEAL-{deal_id} · {project_name}
Cliente: {customer_name}
Monto: {deposit_amount} MXN ({deposit_pct}%)
Vence: {payment_deadline}

Favor de emitir el CFDI y adjuntarlo al deal.`,
      },
    },
  },
  "F-02-deposit-received-ar-update": {
    id: "F-02-deposit-received-ar-update",
    audience: "finance",
    locales: {
      en: {
        subject: "DEAL-{deal_id} · Deposit received — AR update",
        body: `Deposit received, update AR:

Deal: DEAL-{deal_id}
Amount: {amount} MXN
Payment terms: {payment_terms}`,
      },
      es: {
        subject: "DEAL-{deal_id} · Anticipo recibido — actualizar CxC",
        body: `Anticipo recibido, actualizar CxC:

Deal: DEAL-{deal_id}
Monto: {amount} MXN
Términos: {payment_terms}`,
      },
    },
  },
  "F-03-po-fx-prep": {
    id: "F-03-po-fx-prep",
    audience: "finance",
    locales: {
      en: {
        subject: "DEAL-{deal_id} · Prep FX payment",
        body: `PO placed — prep FX payment:

Deal: DEAL-{deal_id}
Brand: {brand_list}
Expected FX: {fx_amount_usd} USD ({fx_amount_mxn} MXN @ {fx_rate})
Payment terms: {payment_terms}`,
      },
      es: {
        subject: "DEAL-{deal_id} · Preparar pago FX",
        body: `OC colocada — preparar pago FX:

Deal: DEAL-{deal_id}
Marca: {brand_list}
FX esperado: {fx_amount_usd} USD ({fx_amount_mxn} MXN @ {fx_rate})
Términos: {payment_terms}`,
      },
    },
  },
  "F-04-fx-processing": {
    id: "F-04-fx-processing",
    audience: "finance",
    locales: {
      en: {
        subject: "DEAL-{deal_id} · FX processing",
        body: `FX payment to {brand_list} now processing: {fx_amount_usd} USD.`,
      },
      es: {
        subject: "DEAL-{deal_id} · FX en proceso",
        body: `Pago FX a {brand_list} en proceso: {fx_amount_usd} USD.`,
      },
    },
  },
  "F-05-customs-duties-due": {
    id: "F-05-customs-duties-due",
    audience: "finance",
    locales: {
      en: {
        subject: "DEAL-{deal_id} · Duties due · Pedimento {pedimento_number}",
        body: `Customs duties due:

Deal: DEAL-{deal_id}
Duties: {duties_paid_mxn} MXN
IVA: {iva_paid_mxn} MXN
Pedimento: {pedimento_number}
Broker: {broker_firm}
Deadline: {payment_deadline}

Pay before deadline to release shipment.`,
      },
      es: {
        subject: "DEAL-{deal_id} · Impuestos aduanales · Pedimento {pedimento_number}",
        body: `Impuestos aduanales por cubrir:

Deal: DEAL-{deal_id}
Impuestos: {duties_paid_mxn} MXN
IVA: {iva_paid_mxn} MXN
Pedimento: {pedimento_number}
Agente: {broker_firm}
Fecha límite: {payment_deadline}

Cubrir antes del límite para liberar envío.`,
      },
    },
  },
  "F-06-broker-invoice-expected": {
    id: "F-06-broker-invoice-expected",
    audience: "finance",
    locales: {
      en: {
        subject: "DEAL-{deal_id} · Broker invoice expected",
        body: `Broker invoice incoming:

Deal: DEAL-{deal_id}
Pedimento: {pedimento_number}
CFDI: generating.`,
      },
      es: {
        subject: "DEAL-{deal_id} · Factura del agente aduanal",
        body: `Factura del agente aduanal por llegar:

Deal: DEAL-{deal_id}
Pedimento: {pedimento_number}
CFDI: en generación.`,
      },
    },
  },
  "F-07-balance-cfdi-request": {
    id: "F-07-balance-cfdi-request",
    audience: "finance",
    locales: {
      en: {
        subject: "DEAL-{deal_id} · Generate final CFDI",
        body: `Final balance CFDI request:

Deal: DEAL-{deal_id}
Customer: {customer_name}
Balance: {balance_amount_mxn} MXN`,
      },
      es: {
        subject: "DEAL-{deal_id} · Generar CFDI final",
        body: `Solicitud de CFDI del saldo final:

Deal: DEAL-{deal_id}
Cliente: {customer_name}
Saldo: {balance_amount_mxn} MXN`,
      },
    },
  },
};

export type AlertChannel = "email" | "whatsapp" | "dashboard";

/**
 * Unified alert-template renderer. Substitutes {snake_case} placeholders
 * against `vars`, resolves the right locale, and returns the right shape
 * for the delivery channel.
 *   - email / dashboard → { subject, body }
 *   - whatsapp          → { body } (no subject line for WA)
 *   - unknown id        → null
 */
export const renderAlertTemplate = (
  id: string,
  vars: Record<string, string | number>,
  locale: "en" | "es" = "en",
  channel: AlertChannel = "email"
): { subject: string; body: string } | { body: string } | null => {
  const t = ALERT_TEMPLATES[id];
  if (!t) return null;
  // Coerce number values to strings for substitution
  const stringVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) stringVars[k] = String(v);

  if (channel === "whatsapp") {
    const raw = t.whatsapp?.[locale];
    if (!raw) return { body: "" };
    return { body: applyTemplateVars(raw, stringVars) };
  }

  const l = t.locales[locale];
  return {
    subject: applyTemplateVars(l.subject, stringVars),
    body: applyTemplateVars(l.body, stringVars),
  };
};
