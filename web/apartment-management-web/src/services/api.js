const API_BASE = "http://localhost:5073/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetch(url, config);

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

// ─── Visitors ────────────────────────────────────────────────
export async function getActiveVisitors() {
  return request("/visitors/active");
}

export async function checkInVisitor(id, accessCode) {
  return request(`/visitors/${id}/check-in?accessCode=${accessCode}`, {
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

// ─── Dashboard Aggregates ────────────────────────────────────
export async function getDashboardStats() {
  // We aggregate from multiple endpoints
  const [facilities, visitors, bookings] = await Promise.allSettled([
    getFacilities(),
    getActiveVisitors(),
    getBookings(),
  ]);

  const facilitiesData =
    facilities.status === "fulfilled" ? facilities.value : [];
  const visitorsData = visitors.status === "fulfilled" ? visitors.value : [];
  const bookingsData = bookings.status === "fulfilled" ? bookings.value : [];

  const checkedIn = visitorsData.filter(
    (v) => v.status === "CheckedIn"
  ).length;
  const withParking = visitorsData.filter(
    (v) => v.assignedParkingSlot != null
  ).length;

  return {
    activeFacilities: facilitiesData.length,
    currentVisitors: checkedIn,
    totalVisitors: visitorsData.length,
    visitorsWithParking: withParking,
    totalBookings: bookingsData.length,
    facilities: facilitiesData,
    visitors: visitorsData,
    bookings: bookingsData,
  };
}
