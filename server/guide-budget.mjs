// Cloudflare published neuron rates, checked 2026-11-11. This is a conservative
// reservation, not a provider usage meter. The account must remain Workers Free.
export const GUIDE_DAILY_NEURONS = 5000;
export const GUIDE_MAX_TOKENS = 700;
export const GUIDE_MAX_INPUT_BYTES = 12000;
export function guideReservation(messages) {
  const bytes = new TextEncoder().encode(JSON.stringify(messages)).byteLength;
  if (bytes > GUIDE_MAX_INPUT_BYTES) return null;
  // UTF-8 bytes overestimate input tokens; leave room for the chat template.
  return Math.ceil((bytes + 512) * 26668 / 1e6 + GUIDE_MAX_TOKENS * 204805 / 1e6) + 1;
}
