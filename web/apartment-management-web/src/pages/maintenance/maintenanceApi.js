export const MAINTENANCE_API_BASE = (
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV
    ? 'http://localhost:5073/api'
    : 'https://apartment-management-system-production.up.railway.app/api')
).replace(/\/+$/, '');

// Uploaded maintenance photos are served outside the /api route.
export const MAINTENANCE_API_ORIGIN = MAINTENANCE_API_BASE.replace(/\/api$/, '');
