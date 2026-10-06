export const MAINTENANCE_API_BASE = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5073/api'
).replace(/\/+$/, '');

// Uploaded maintenance photos are served outside the /api route.
export const MAINTENANCE_API_ORIGIN = MAINTENANCE_API_BASE.replace(/\/api$/, '');
