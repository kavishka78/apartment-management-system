const API_BASE = "http://localhost:5073/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    // Return null or rethrow based on caller
    throw err;
  }
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

let mockUnits = [
  {
    id: 1,
    tenantId: 1,
    unitNumber: "A-101",
    floorNumber: 1,
    blockName: "Block A - Lotus Wing",
    numberOfBedrooms: 2,
    numberOfBathrooms: 2,
    squareFeet: 1150,
    monthlyRent: 125000,
    status: "Occupied",
    currentResidentName: "Kamal Perera",
    currentResidentPhone: "+94 77 123 4567",
    parkingSlot: "P-A101",
  },
  {
    id: 2,
    tenantId: 1,
    unitNumber: "A-102",
    floorNumber: 1,
    blockName: "Block A - Lotus Wing",
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    squareFeet: 1450,
    monthlyRent: 165000,
    status: "Available",
    currentResidentName: null,
    currentResidentPhone: null,
    parkingSlot: "P-A102",
  },
  {
    id: 3,
    tenantId: 1,
    unitNumber: "B-201",
    floorNumber: 2,
    blockName: "Block B - Jasmine Wing",
    numberOfBedrooms: 3,
    numberOfBathrooms: 3,
    squareFeet: 1600,
    monthlyRent: 190000,
    status: "Occupied",
    currentResidentName: "Dr. Anoma Jayasinghe",
    currentResidentPhone: "+94 71 889 2341",
    parkingSlot: "P-B201",
  },
  {
    id: 4,
    tenantId: 1,
    unitNumber: "B-202",
    floorNumber: 2,
    blockName: "Block B - Jasmine Wing",
    numberOfBedrooms: 2,
    numberOfBathrooms: 2,
    squareFeet: 1200,
    monthlyRent: 130000,
    status: "UnderMaintenance",
    currentResidentName: null,
    currentResidentPhone: null,
    parkingSlot: "P-B202",
  },
  {
    id: 5,
    tenantId: 1,
    unitNumber: "C-301",
    floorNumber: 3,
    blockName: "Block C - Royal Penthouse",
    numberOfBedrooms: 4,
    numberOfBathrooms: 4,
    squareFeet: 2400,
    monthlyRent: 320000,
    status: "Occupied",
    currentResidentName: "Mahesh Gunasekara",
    currentResidentPhone: "+94 77 555 8901",
    parkingSlot: "P-C301",
  },
  {
    id: 6,
    tenantId: 1,
    unitNumber: "C-302",
    floorNumber: 3,
    blockName: "Block C - Royal Penthouse",
    numberOfBedrooms: 4,
    numberOfBathrooms: 4,
    squareFeet: 2400,
    monthlyRent: 320000,
    status: "Available",
    currentResidentName: null,
    currentResidentPhone: null,
    parkingSlot: "P-C302",
  }
];

let mockResidents = [
  {
    id: 1,
    tenantId: 1,
    fullName: "Kamal Perera",
    email: "kamal.perera@gmail.com",
    phoneNumber: "+94 77 123 4567",
    nationalId: "198812345678",
    unitNumber: "A-101",
    unitId: 1,
    role: "Resident",
    status: "Active",
    monthlyIncome: 450000,
    emergencyContact: "Sunethra Perera (Spouse) - +94 77 123 4568",
    householdMembers: [
      { name: "Sunethra Perera", relation: "Spouse", age: 34 },
      { name: "Dineth Perera", relation: "Son", age: 7 }
    ],
    vehiclesCount: 1,
    staffCount: 1,
    moveInDate: "2024-06-01",
  },
  {
    id: 2,
    tenantId: 1,
    fullName: "Dr. Anoma Jayasinghe",
    email: "anoma.j@asiri.lk",
    phoneNumber: "+94 71 889 2341",
    nationalId: "197545678912",
    unitNumber: "B-201",
    unitId: 3,
    role: "Resident",
    status: "Active",
    monthlyIncome: 650000,
    emergencyContact: "Rohan Jayasinghe (Brother) - +94 71 223 9988",
    householdMembers: [
      { name: "Niluka Jayasinghe", relation: "Daughter", age: 14 }
    ],
    vehiclesCount: 2,
    staffCount: 1,
    moveInDate: "2023-11-15",
  },
  {
    id: 3,
    tenantId: 1,
    fullName: "Mahesh Gunasekara",
    email: "mahesh@apextech.io",
    phoneNumber: "+94 77 555 8901",
    nationalId: "199178901234",
    unitNumber: "C-301",
    unitId: 5,
    role: "Resident",
    status: "Active",
    monthlyIncome: 950000,
    emergencyContact: "Saman Gunasekara (Father) - +94 77 444 1122",
    householdMembers: [
      { name: "Kavindi Gunasekara", relation: "Spouse", age: 31 },
      { name: "Aria Gunasekara", relation: "Daughter", age: 3 }
    ],
    vehiclesCount: 2,
    staffCount: 2,
    moveInDate: "2025-01-10",
  },
  {
    id: 4,
    tenantId: 1,
    fullName: "Sanjaya Wickramasinghe",
    email: "sanjaya.w@outlook.com",
    phoneNumber: "+94 76 901 3456",
    nationalId: "199432109876",
    unitNumber: "Pending Allocation",
    unitId: null,
    role: "Resident",
    status: "PendingVerification",
    monthlyIncome: 380000,
    emergencyContact: "Chandana Wickramasinghe - +94 76 111 2222",
    householdMembers: [],
    vehiclesCount: 1,
    staffCount: 0,
    moveInDate: "2026-04-01",
  }
];

let mockVehicles = [
  {
    id: 1,
    tenantId: 1,
    residentId: 1,
    residentName: "Kamal Perera",
    unitNumber: "A-101",
    plateNumber: "CAB-4521",
    vehicleType: "Car",
    makeModel: "Toyota Prius 2018 (Silver)",
    parkingSlot: "P-A101",
    registeredAt: "2024-06-02",
    status: "Approved",
  },
  {
    id: 2,
    tenantId: 1,
    residentId: 2,
    residentName: "Dr. Anoma Jayasinghe",
    unitNumber: "B-201",
    plateNumber: "WP-KQ-8890",
    vehicleType: "SUV",
    makeModel: "Honda CR-V (Black)",
    parkingSlot: "P-B201",
    registeredAt: "2023-11-16",
    status: "Approved",
  },
  {
    id: 3,
    tenantId: 1,
    residentId: 2,
    residentName: "Dr. Anoma Jayasinghe",
    unitNumber: "B-201",
    plateNumber: "BI-3320",
    vehicleType: "Motorcycle",
    makeModel: "Yamaha FZ (Red)",
    parkingSlot: "P-B201-B",
    registeredAt: "2024-01-20",
    status: "Approved",
  },
  {
    id: 4,
    tenantId: 1,
    residentId: 3,
    residentName: "Mahesh Gunasekara",
    unitNumber: "C-301",
    plateNumber: "CBG-1100",
    vehicleType: "Car",
    makeModel: "BMW 520d (Alpine White)",
    parkingSlot: "P-C301",
    registeredAt: "2025-01-11",
    status: "Approved",
  },
  {
    id: 5,
    tenantId: 1,
    residentId: 3,
    residentName: "Mahesh Gunasekara",
    unitNumber: "C-301",
    plateNumber: "CAA-9912",
    vehicleType: "Van",
    makeModel: "Toyota Alphard (Pearl)",
    parkingSlot: "P-C301-B",
    registeredAt: "2025-01-12",
    status: "Approved",
  }
];

let mockDomesticStaff = [
  {
    id: 1,
    tenantId: 1,
    residentId: 1,
    residentName: "Kamal Perera",
    unitNumber: "A-101",
    fullName: "Nalani Kumari",
    staffType: "Housekeeper / Maid",
    nicNumber: "197855667788",
    contactPhone: "+94 77 908 1122",
    accessPassCode: "PASS-N78-101",
    workingHours: "08:00 AM - 05:00 PM (Mon-Fri)",
    isActive: true,
  },
  {
    id: 2,
    tenantId: 1,
    residentId: 2,
    residentName: "Dr. Anoma Jayasinghe",
    unitNumber: "B-201",
    fullName: "Sarath Bandara",
    staffType: "Chauffeur / Driver",
    nicNumber: "198211223344",
    contactPhone: "+94 71 556 7788",
    accessPassCode: "PASS-S82-201",
    workingHours: "07:00 AM - 07:00 PM (Daily)",
    isActive: true,
  },
  {
    id: 3,
    tenantId: 1,
    residentId: 3,
    residentName: "Mahesh Gunasekara",
    unitNumber: "C-301",
    fullName: "Kusuma Silva",
    staffType: "Chef / Cook",
    nicNumber: "198033445566",
    contactPhone: "+94 77 332 9900",
    accessPassCode: "PASS-K80-301",
    workingHours: "09:00 AM - 03:00 PM (Daily)",
    isActive: true,
  },
  {
    id: 4,
    tenantId: 1,
    residentId: 3,
    residentName: "Mahesh Gunasekara",
    unitNumber: "C-301",
    fullName: "Priyantha Jayalath",
    staffType: "Chauffeur / Driver",
    nicNumber: "198944556677",
    contactPhone: "+94 77 665 4321",
    accessPassCode: "PASS-P89-301",
    workingHours: "08:00 AM - 08:00 PM (Daily)",
    isActive: true,
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
  } catch (err) {
    return [...mockTenants];
  }
}

export async function createTenant(data) {
  try {
    return await request("/v1/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err) {
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

// ─── API Functions for Units ──────────────────────────────────
export async function getUnits(tenantId = 1) {
  try {
    return await request(`/v1/tenants/${tenantId}/units`);
  } catch (err) {
    return mockUnits.filter((u) => u.tenantId === Number(tenantId));
  }
}

export async function createUnit(data) {
  try {
    return await request("/v1/units", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err) {
    const newUnit = {
      id: mockUnits.length + 1,
      tenantId: data.tenantId || 1,
      ...data,
      status: data.status || "Available",
      currentResidentName: null,
      currentResidentPhone: null,
    };
    mockUnits.push(newUnit);
    return newUnit;
  }
}

export async function updateUnit(id, data) {
  try {
    return await request(`/v1/units/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (err) {
    const idx = mockUnits.findIndex((u) => u.id === id);
    if (idx !== -1) {
      mockUnits[idx] = { ...mockUnits[idx], ...data };
      return mockUnits[idx];
    }
    return data;
  }
}

// ─── API Functions for Residents ──────────────────────────────
export async function getResidents(tenantId = 1) {
  try {
    return await request(`/v1/residents?tenantId=${tenantId}`);
  } catch (err) {
    return mockResidents.filter((r) => r.tenantId === Number(tenantId));
  }
}

export async function onboardResident(data) {
  try {
    return await request("/v1/residents/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err) {
    const newRes = {
      id: mockResidents.length + 1,
      tenantId: data.tenantId || 1,
      ...data,
      status: "Active",
      householdMembers: data.householdMembers || [],
      vehiclesCount: data.plateNumber ? 1 : 0,
      staffCount: 0,
      moveInDate: data.moveInDate || new Date().toISOString().split("T")[0],
    };
    mockResidents.unshift(newRes);

    // If unit was selected, update unit status
    if (data.unitId) {
      const uIdx = mockUnits.findIndex((u) => u.id === Number(data.unitId));
      if (uIdx !== -1) {
        mockUnits[uIdx].status = "Occupied";
        mockUnits[uIdx].currentResidentName = data.fullName;
        mockUnits[uIdx].currentResidentPhone = data.phoneNumber;
      }
    }

    // Auto-record vehicle if provided
    if (data.plateNumber) {
      mockVehicles.push({
        id: mockVehicles.length + 1,
        tenantId: data.tenantId || 1,
        residentId: newRes.id,
        residentName: newRes.fullName,
        unitNumber: newRes.unitNumber || "Assigned",
        plateNumber: data.plateNumber,
        vehicleType: data.vehicleType || "Car",
        makeModel: data.makeModel || "Standard",
        parkingSlot: data.parkingSlot || "P-Unassigned",
        registeredAt: new Date().toISOString().split("T")[0],
        status: "Approved",
      });
    }

    return newRes;
  }
}

// ─── API Functions for Vehicles ───────────────────────────────
export async function getVehicles(tenantId = 1) {
  try {
    return await request(`/v1/vehicles?tenantId=${tenantId}`);
  } catch (err) {
    return mockVehicles.filter((v) => v.tenantId === Number(tenantId));
  }
}

export async function createVehicle(data) {
  try {
    return await request("/v1/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err) {
    const newVeh = {
      id: mockVehicles.length + 1,
      tenantId: data.tenantId || 1,
      ...data,
      registeredAt: new Date().toISOString().split("T")[0],
      status: "Approved",
    };
    mockVehicles.push(newVeh);
    return newVeh;
  }
}

// ─── API Functions for Domestic Staff ─────────────────────────
export async function getDomesticStaff(tenantId = 1) {
  try {
    return await request(`/v1/staff?tenantId=${tenantId}`);
  } catch (err) {
    return mockDomesticStaff.filter((s) => s.tenantId === Number(tenantId));
  }
}

export async function createDomesticStaff(data) {
  try {
    return await request("/v1/staff", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err) {
    const newStaff = {
      id: mockDomesticStaff.length + 1,
      tenantId: data.tenantId || 1,
      ...data,
      accessPassCode: `PASS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${data.unitNumber || "100"}`,
      isActive: true,
    };
    mockDomesticStaff.unshift(newStaff);
    return newStaff;
  }
}

export async function toggleStaffAccess(id) {
  try {
    return await request(`/v1/staff/${id}/toggle`, { method: "PATCH" });
  } catch (err) {
    const s = mockDomesticStaff.find((item) => item.id === id);
    if (s) {
      s.isActive = !s.isActive;
      return s;
    }
    return null;
  }
}

// ─── API Functions for AI Safety Logs ─────────────────────────
export async function getAiSafetyLogs(tenantId = 1) {
  try {
    return await request(`/v1/ai/safety-logs?tenantId=${tenantId}`);
  } catch (err) {
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
    totalUnits: mockUnits.length,
    occupiedUnits: mockUnits.filter((u) => u.status === "Occupied").length,
    activeResidents: mockResidents.filter((r) => r.status === "Active").length,
  };
}
