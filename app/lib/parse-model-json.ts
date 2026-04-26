/**
 * Robust JSON extraction from LLM output. Models occasionally wrap the
 * payload in ```json fences, add trailing commentary, or emit stray
 * whitespace — all of which break a naive `JSON.parse(text)`.
 *
 * Three-pass strategy:
 *   1. Direct parse.
 *   2. Strip any ```json / ``` fences anywhere in the string, parse trimmed.
 *   3. Extract the first balanced {...} block via regex and parse that.
 *
 * Throws with a truncated preview if all three fail.
 */
export const parseModelJson = <T = unknown>(text: string): T => {
  const trimmed = text.trim();
  // 1. Direct
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continue
  }
  // 2. Fence-stripped
  const stripped = trimmed
    .replace(/```(?:json)?\s*/g, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {
    // continue
  }
  // 3. First {...} block
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      // fall through
    }
  }
  throw new Error(
    `Could not parse JSON from model output: ${trimmed.slice(0, 200)}`
  );
};
