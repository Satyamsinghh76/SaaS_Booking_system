import axios from 'axios';

const API_ROOT = (() => {
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  const trimmed = base.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
})();

/**
 * Fire-and-forget health ping to wake the server from a cold start.
 * Call on auth page mount so the server starts booting while
 * the user fills in the form.
 */
export function warmUpServer(): void {
  if (!API_ROOT) return;
  axios.get(`${API_ROOT}/health`, { timeout: 30_000 }).catch(() => {});
}
