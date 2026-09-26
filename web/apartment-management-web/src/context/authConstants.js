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