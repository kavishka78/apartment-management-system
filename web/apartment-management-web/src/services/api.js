const API_BASE = "http://localhost:5073/api";

const TOKEN_KEY = "ah_token";

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable; the session lasts until reload
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (response.status === 401 && token && endpoint !== "/v1/auth/login") {
    setAuthToken(null);
    window.location.assign("/login");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ─── Facilities ──────────────────────────────────────────────
export async function getFacilities() {
  return request("/facilities");
}

export async function getFacilityById(id) {
  return request(`/facilities/${id}`);
}

export async function createFacility(data) {
  return request("/facilities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFacility(id, data) {
  return request(`/facilities/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function toggleFacilityStatus(id) {
  return request(`/facilities/${id}/toggle-status`, {
    method: "PATCH",
  });
}

export async function updateFacilityStatus(id, isActive, deactivationReason = "") {
  return request(`/facilities/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive, deactivationReason }),
  });
}

// ─── Visitors ────────────────────────────────────────────────
export async function getActiveVisitors() {
  return request("/visitors/active");
}

export async function getAllVisitors() {
  return request("/visitors");
}

export async function updateVisitor(id, data) {
  return request(`/visitors/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function cancelVisitor(id) {
  return request(`/visitors/${id}/cancel`, { method: "POST" });
}

export async function checkInVisitor(id, accessCode) {
  return request(`/visitors/${id}/check-in${accessCode ? `?accessCode=${accessCode}` : ""}`, {
    method: "POST",
  });
}

export async function checkOutVisitor(id) {
  return request(`/visitors/${id}/check-out`, { method: "POST" });
}

// ─── Bookings ────────────────────────────────────────────────
export async function getBookings() {
  return request("/bookings");
}

export async function getBookingsForFacility(facilityId) {
  return request(`/bookings/facility/${facilityId}`);
}

export async function createBooking(data) {
  return request("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function approveBooking(id) {
  return request(`/bookings/${id}/approve`, { method: "PUT" });
}

// ─── Parking ─────────────────────────────────────────────────
export async function getParkingSlots() {
  return request("/parkingslots");
}

export async function createParkingSlot(data) {
  return request("/parkingslots", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateParkingSlot(id, data) {
  return request(`/parkingslots/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteParkingSlot(id) {
  return request(`/parkingslots/${id}`, {
    method: "DELETE",
  });
}

// ─── Workflows (AI Approvals) ────────────────────────────────
export async function getPendingWorkflows() {
  return request("/workflows?status=pending");
}

export async function approveWorkflow(id) {
  return request(`/workflows/${id}/approve`, { method: "PUT" });
}

export async function rejectWorkflow(id) {
  return request(`/workflows/${id}/reject`, { method: "PUT" });
}

export async function reviseWorkflow(id, data) {
  return request(`/workflows/${id}/revise`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ═════════════════════════════════════════════════════════════
// ─── Student 1: Tenant & Resident Registry Management ─────────
// ═════════════════════════════════════════════════════════════

// In-memory mock store for smooth UI previews when backend is connecting
let mockTenants = [
  {
    id: 1,
    name: "Lotus Grand Residencies",
    code: "LGR-01",
    address: "No. 45, Alfred House Gardens, Colombo 03",
    contactEmail: "management@lotusgrand.lk",
    contactPhone: "+94 11 258 9630",
    subscriptionPlan: "Enterprise B2B",
    totalUnits: 48,
    occupiedUnits: 38,
    status: "Active",
    createdAt: "2026-01-15T08:00:00Z",
  },
  {
    id: 2,
    name: "Cinnamon Breeze Condominiums",
    code: "CBC-02",
    address: "No. 120, Marine Drive, Colombo 04",
    contactEmail: "admin@cinnamonbreeze.lk",
    contactPhone: "+94 11 472 1100",
    subscriptionPlan: "Standard SaaS",
    totalUnits: 32,
    occupiedUnits: 25,
    status: "Active",
    createdAt: "2026-02-10T09:30:00Z",
  },
  {
    id: 3,
    name: "Pearl Oceanic Luxury Suites",
    code: "POL-03",
    address: "No. 88, Galle Road, Mount Lavinia",
    contactEmail: "ops@pearloceanic.com",
    contactPhone: "+94 11 271 4455",
    subscriptionPlan: "Premium Tier",
    totalUnits: 60,
    occupiedUnits: 45,
    status: "Active",
    createdAt: "2026-03-01T11:00:00Z",
  }
];

let mockSafetyLogs = [
  {
    id: "LOG-9921",
    workflowId: "WF-2026-9041",
    tenantId: 1,
    agentRole: "ValidationAndSafetyAgent",
    actionRequested: "Resident Onboarding & Unit Allocation",
    targetEntity: "Unit A-101 / Resident Kamal Perera",
    isolationCheck: "PASS (Verified TenantId=1 matches session)",
    rbacCheck: "PASS (Role 'ApartmentManager' authorized)",
    schemaValidation: "VALID (All mandatory fields & NIC format verified)",
    spendingCheck: "N/A",
    requiresApproval: false,
    status: "Allowed",
    timestamp: "2026-03-24T14:32:10Z"
  },
  {
    id: "LOG-9922",
    workflowId: "WF-2026-9042",
    tenantId: 1,
    agentRole: "ValidationAndSafetyAgent",
    actionRequested: "High-Cost Emergency Elevator Motor Replacement",
    targetEntity: "Maintenance Ticket #502",
    isolationCheck: "PASS (TenantId=1)",
    rbacCheck: "PASS (Facility Manager)",
    schemaValidation: "VALID (Vendor quote schema verified)",
    spendingCheck: "TRIGGERED (Estimated cost LKR 85,000 > LKR 25,000 threshold)",
    requiresApproval: true,
    approvalDecision: "Pending Admin Approval",
    status: "PausedForHumanApproval",
    timestamp: "2026-03-25T09:15:00Z"
  },
  {
    id: "LOG-9923",
    workflowId: "WF-2026-9043",
    tenantId: 2,
    agentRole: "ValidationAndSafetyAgent",
    actionRequested: "Cross-Tenant Unit Data Query",
    targetEntity: "Tenant 1 Unit Records",
    isolationCheck: "BLOCKED (Cross-tenant boundary violation detected)",
    rbacCheck: "REJECTED",
    schemaValidation: "REJECTED",
    spendingCheck: "N/A",
    requiresApproval: false,
    status: "BlockedSecurityViolation",
    timestamp: "2026-03-25T11:45:22Z"
  }
];

// ─── API Functions for Tenants ────────────────────────────────
export async function getTenants() {
  try {
    return await request("/v1/tenants");
  } catch {
    return [...mockTenants];
  }
}

export async function createTenant(data) {
  try {
    return await request("/v1/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    const newTenant = {
      id: mockTenants.length + 1,
      ...data,
      totalUnits: data.totalUnits || 0,
      occupiedUnits: 0,
      status: "Active",
      createdAt: new Date().toISOString(),
    };
    mockTenants.unshift(newTenant);
    return newTenant;
  }
}

// ─── Platform: auth, complexes, admins, subscriptions ─────────
const post = (url, body = {}) => request(url, { method: "POST", body: JSON.stringify(body) });

export const loginApi = (email, password) => post("/v1/auth/login", { email, password });
export const googleLoginApi = (credential) => post("/v1/auth/google", { credential });
export const getMeApi = () => request("/v1/auth/me");

export const getComplexes = () => request("/v1/complexes");
export const getComplexById = (id) => request(`/v1/complexes/${id}`);
export const createComplexApi = (data) => post("/v1/complexes", data);
export const updateComplexPackageApi = (id, data) =>
  request(`/v1/complexes/${id}/package`, { method: "PUT", body: JSON.stringify(data) });
export const renewComplexApi = (id, months) => post(`/v1/complexes/${id}/renew`, { months });
export const deactivateComplexApi = (id) => post(`/v1/complexes/${id}/deactivate`);
export const reactivateComplexApi = (id) => post(`/v1/complexes/${id}/reactivate`);
export const getSubscriptionHistoryApi = () => request("/v1/subscription-history");

export const getAdminsApi = () => request("/v1/admins");
export const createAdminApi = (data) => post("/v1/admins", data);

// ─── API Functions for Units ──────────────────────────────────
export async function getUnits(tenantId) {
  return request(`/v1/tenants/${tenantId}/units`);
}

export async function createUnit(data) {
  return request("/v1/units", { method: "POST", body: JSON.stringify(data) });
}

export async function updateUnit(id, data) {
  return request(`/v1/units/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

// ─── API Functions for Residents ──────────────────────────────
export async function getResidents(tenantId) {
  return request(`/v1/residents?tenantId=${tenantId}`);
}

export async function onboardResident(data) {
  return request("/v1/residents/onboard", { method: "POST", body: JSON.stringify(data) });
}

// ─── API Functions for Vehicles ───────────────────────────────
export async function getVehicles(tenantId) {
  return request(`/v1/vehicles?tenantId=${tenantId}`);
}

export async function createVehicle(data) {
  return request("/v1/vehicles", { method: "POST", body: JSON.stringify(data) });
}

// ─── API Functions for Domestic Staff ─────────────────────────
export async function getDomesticStaff(tenantId) {
  return request(`/v1/staff?tenantId=${tenantId}`);
}

export async function createDomesticStaff(data) {
  return request("/v1/staff", { method: "POST", body: JSON.stringify(data) });
}

export async function toggleStaffAccess(id) {
  return request(`/v1/staff/${id}/toggle`, { method: "PATCH" });
}

// ─── API Functions for AI Safety Logs ─────────────────────────
export async function getAiSafetyLogs(tenantId = 1) {
  try {
    return await request(`/v1/ai/safety-logs?tenantId=${tenantId}`);
  } catch {
    return [...mockSafetyLogs];
  }
}

// ─── Dashboard Aggregates ────────────────────────────────────
export async function getDashboardStats() {
  const [facilities, visitors, bookings] = await Promise.allSettled([
    getFacilities(),
    getActiveVisitors(),
    getBookings(),
  ]);

  const facilitiesData =
    facilities.status === "fulfilled" ? facilities.value : [];
  const visitorsData = visitors.status === "fulfilled" ? visitors.value : [];
  const bookingsData = bookings.status === "fulfilled" ? bookings.value : [];

  const checkedIn = (visitorsData || []).filter(
    (v) => v.status === "CheckedIn"
  ).length;
  const withParking = (visitorsData || []).filter(
    (v) => v.assignedParkingSlot != null
  ).length;

  return {
    activeFacilities: (facilitiesData || []).length,
    currentVisitors: checkedIn,
    totalVisitors: (visitorsData || []).length,
    visitorsWithParking: withParking,
    totalBookings: (bookingsData || []).length,
    facilities: facilitiesData,
    visitors: visitorsData,
    bookings: bookingsData,
    totalTenants: mockTenants.length,
  };
}
