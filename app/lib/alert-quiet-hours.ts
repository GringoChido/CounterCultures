/**
 * Alert quiet hours — pure, no I/O.
 *
 * Customer-facing channels (email + WhatsApp) are gated to 8am–10pm
 * Mexico City time. Outside that window, alerts queue via the Notifications
 * sheet's `deliver_after` column and the nightly sweep releases them at
 * the next 8am MX tick.
 *
 * Roger + Finance are exempt — they want operational alerts any hour
 * (e.g. 3am customs border arrival).
 *
 * Mexico City observes no DST and sits at UTC-6 year-round. We compute
 * the current hour in America/Mexico_City via Intl.DateTimeFormat so the
 * server's own timezone doesn't matter.
 */

export type AlertAudience = "customer" | "roger" | "finance";

export interface QuietHoursConfig {
  startHour: number;   // 22 (10pm)
  endHour: number;     // 8 (8am)
  timezone: string;    // "America/Mexico_City"
}

export const DEFAULT_QUIET_HOURS: QuietHoursConfig = {
  startHour: 22,
  endHour: 8,
  timezone: "America/Mexico_City",
};

interface MxTimeParts {
  hour: number;
  minute: number;
  year: number;
  month: number;
  day: number;
}

const getMxTimeParts = (now: Date, tz: string): MxTimeParts => {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? 0);
  // en-US hour12:false can yield "24" for midnight; normalize to 0.
  let hour = get("hour");
  if (hour === 24) hour = 0;
  return {
    hour,
    minute: get("minute"),
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
};

const isQuietHour = (hour: number, config: QuietHoursConfig): boolean => {
  // startHour=22, endHour=8 → quiet if hour >= 22 OR hour < 8
  if (config.startHour > config.endHour) {
    return hour >= config.startHour || hour < config.endHour;
  }
  return hour >= config.startHour && hour < config.endHour;
};

/**
 * Compute the ISO timestamp of the next 8am MX, given a reference "now".
 * - If now is before 8am MX today → today's 8am
 * - If now is at or after 8am MX → tomorrow's 8am
 *
 * We construct the target Date in UTC by offsetting the MX wall time by 6h.
 * (No DST in MX, so this is a static offset.)
 */
const nextEndOfQuietHoursIso = (now: Date, config: QuietHoursConfig): string => {
  const mx = getMxTimeParts(now, config.timezone);
  // Is the current MX time already past today's endHour?
  const pastEndToday = mx.hour >= config.endHour && mx.hour < config.startHour;
  // Target calendar date (in MX)
  let targetYear = mx.year;
  let targetMonth = mx.month;
  let targetDay = mx.day;
  // Past midnight but before 8am → today's 8am (same MX date)
  // Past 10pm → tomorrow's 8am (MX date + 1)
  if (pastEndToday || mx.hour >= config.startHour) {
    // Add one day to the MX calendar date
    const d = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay + 1, 0, 0, 0));
    targetYear = d.getUTCFullYear();
    targetMonth = d.getUTCMonth() + 1;
    targetDay = d.getUTCDate();
  }

  // MX is UTC-6 → 8am MX = 14:00 UTC on the same MX date
  // The MX date T 08:00 in MX corresponds to T 14:00 UTC on the same calendar date
  const utc = new Date(
    Date.UTC(targetYear, targetMonth - 1, targetDay, config.endHour + 6, 0, 0)
  );
  return utc.toISOString();
};

/**
 * Returns null if delivery is allowed now, or the ISO timestamp of the
 * next allowed delivery window (8am MX of the current or next day).
 */
export const nextAllowedDelivery = (
  audience: AlertAudience,
  now: Date = new Date(),
  config: QuietHoursConfig = DEFAULT_QUIET_HOURS
): string | null => {
  if (audience !== "customer") return null;
  const mx = getMxTimeParts(now, config.timezone);
  if (!isQuietHour(mx.hour, config)) return null;
  return nextEndOfQuietHoursIso(now, config);
};
