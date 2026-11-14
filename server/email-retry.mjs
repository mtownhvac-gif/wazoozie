const MAX_DELAY = 6 * 3600000;

// Keep retries bounded even if an upstream sends a malformed or extreme header.
export function emailRetryDelay(attempts, retryAfter, now = Date.now()) {
  const backoff = Math.min(MAX_DELAY, 60000 * 2 ** (attempts - 1));
  if (typeof retryAfter !== 'string' || retryAfter.length > 128) return backoff;
  const value = retryAfter.trim();
  const requested = /^\d+$/.test(value) ? Number(value) * 1000 : Date.parse(value) - now;
  if (Number.isNaN(requested) || requested < 0) return backoff;
  return Math.max(backoff, Math.min(MAX_DELAY, requested));
}
