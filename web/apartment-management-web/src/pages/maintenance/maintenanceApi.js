const localApiBase = 'http://localhost:5073/api';
const productionApiBase = 'https://apartment-management-system-production.up.railway.app/api';
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const isLoopback = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(configuredApiBase || '');

export const MAINTENANCE_API_BASE = (
  configuredApiBase && !(import.meta.env.PROD && isLoopback)
    ? configuredApiBase
    : import.meta.env.PROD ? productionApiBase : localApiBase
).replace(/\/+$/, '');

// Uploaded maintenance photos are served outside the /api route.
export const MAINTENANCE_API_ORIGIN = MAINTENANCE_API_BASE.replace(/\/api$/, '');
