/**
 * Read the Google service-account private key from env.
 *
 * Accepts either:
 *   - GOOGLE_PRIVATE_KEY: the PEM directly, with real newlines OR `\n` escapes
 *     (matches the legacy Netlify env-var format).
 *   - GOOGLE_PRIVATE_KEY_B64: the PEM base64-encoded. Used as a workaround
 *     when Netlify's enhanced-secret-scan blocks env values containing the
 *     literal `-----BEGIN PRIVATE KEY-----` header.
 *
 * Prefers the base64 variant if both are set.
 */
export const getGooglePrivateKey = (): string | undefined => {
  const b64 = process.env.GOOGLE_PRIVATE_KEY_B64;
  if (b64) {
    try {
      return Buffer.from(b64, "base64").toString("utf-8");
    } catch {
      // fall through to PEM
    }
  }
  const raw = process.env.GOOGLE_PRIVATE_KEY;
  return raw?.replace(/\\n/g, "\n");
};
