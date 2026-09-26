// Standard module keys available on the platform
export const PLATFORM_MODULES = [
  { key: "units", label: "Unit Directory & Allocations", icon: "home" },
  { key: "residents", label: "Homeowners & Residents", icon: "users" },
  { key: "vehicles", label: "Vehicles & Parking Slots", icon: "car" },
  { key: "staff", label: "Domestic Staff Access Passes", icon: "badge" },
  { key: "facilities", label: "Facility Booking Engine", icon: "calendar" },
  { key: "maintenance", label: "Maintenance & Complaints", icon: "wrench" },
  { key: "visitors", label: "Visitor Gate Checkpoint Logs", icon: "shield" },
  { key: "ai_safety", label: "Autonomous AI Safety Auditor", icon: "cpu" },
  { key: "payments", label: "Commerce, Invoicing & Billing", icon: "credit-card" },
];

export const RENEWAL_PERIODS = [
  { months: 1, label: "1 month" },
  { months: 6, label: "6 months" },
  { months: 12, label: "12 months" },
];

const EXPIRING_SOON_DAYS = 30;

export function todayIso() {
  return new Date().toISOString().split("T")[0];
}

export function addMonthsIso(isoDate, months) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysUntil(isoDate) {
  if (!isoDate) return 0;
  const ms = new Date(`${isoDate}T00:00:00`) - new Date(`${todayIso()}T00:00:00`);
  return Math.round(ms / 86400000);
}

// Returns "Active" | "Expiring" | "Expired" | "Deactivated"
export function getSubscriptionStatus(complex) {
  if (!complex) return "Deactivated";
  if (complex.status === "Deactivated") return "Deactivated";
  const days = daysUntil(complex.subscriptionEnd);
  if (days < 0) return "Expired";
  if (days <= EXPIRING_SOON_DAYS) return "Expiring";
  return "Active";
}

export function isSubscriptionUsable(complex) {
  const s = getSubscriptionStatus(complex);
  return s === "Active" || s === "Expiring";
}

export const SUBSCRIPTION_TIERS = {
  "Standard Starter": {
    name: "Standard Starter",
    priceLkr: 35000,
    unitLimit: 50,
    modules: ["units", "residents", "payments"],
  },
  "Professional Growth": {
    name: "Professional Growth",
    priceLkr: 85000,
    unitLimit: 150,
    modules: ["units", "residents", "vehicles", "staff", "facilities", "payments"],
  },
  "Enterprise Suite": {
    name: "Enterprise Suite",
    priceLkr: 145000,
    unitLimit: 500,
    modules: ["units", "residents", "vehicles", "staff", "facilities", "maintenance", "visitors", "ai_safety", "payments"],
  },
};