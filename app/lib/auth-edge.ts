const SESSION_MAX_AGE = 60 * 60 * 24;

const encoder = new TextEncoder();

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
};

const getKey = async (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

export const validateSessionFromCookieEdge = async (
  cookieValue: string | undefined,
): Promise<boolean> => {
  if (!cookieValue) return false;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const lastDot = cookieValue.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = cookieValue.slice(0, lastDot);
  const signatureHex = cookieValue.slice(lastDot + 1);

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = hexToBytes(signatureHex);
  } catch {
    return false;
  }

  const key = await getKey(secret);
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payload)),
  );

  if (!timingSafeEqual(expected, signatureBytes)) return false;

  const timestampStr = payload.split(":")[1];
  const timestamp = Number(timestampStr);
  if (Number.isNaN(timestamp)) return false;

  const age = (Date.now() - timestamp) / 1000;
  return age < SESSION_MAX_AGE;
};
