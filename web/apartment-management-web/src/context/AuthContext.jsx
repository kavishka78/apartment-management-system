import { createContext, useContext, useState } from "react";

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

const INITIAL_COMPLEXES = [
  {
    id: 1,
    name: "Lotus Grand Residencies",
    code: "LGR-01",
    address: "No. 45, Alfred House Gardens, Colombo 03",
    contactEmail: "management@lotusgrand.lk",
    contactPhone: "+94 11 258 9630",
    subscriptionPlan: "Enterprise Suite",
    totalUnits: 48,
    occupiedUnits: 38,
    status: "Active",
    createdAt: "2026-01-15",
    enabledModules: ["units", "residents", "vehicles", "staff", "facilities", "maintenance", "visitors", "ai_safety", "payments"],
  },
  {
    id: 2,
    name: "Cinnamon Breeze Condominiums",
    code: "CBC-02",
    address: "No. 120, Marine Drive, Colombo 04",
    contactEmail: "admin@cinnamonbreeze.lk",
    contactPhone: "+94 11 472 1100",
    subscriptionPlan: "Professional Growth",
    totalUnits: 32,
    occupiedUnits: 25,
    status: "Active",
    createdAt: "2026-02-10",
    enabledModules: ["units", "residents", "vehicles", "staff", "facilities", "payments"],
  },
  {
    id: 3,
    name: "Pearl Oceanic Luxury Suites",
    code: "POL-03",
    address: "No. 88, Galle Road, Mount Lavinia",
    contactEmail: "ops@pearloceanic.com",
    contactPhone: "+94 11 271 4455",
    subscriptionPlan: "Standard Starter",
    totalUnits: 60,
    occupiedUnits: 45,
    status: "Active",
    createdAt: "2026-03-01",
    enabledModules: ["units", "residents", "payments"],
  },
];

const INITIAL_USERS = [
  {
    id: "user-super-1",
    name: "Alexander Vance",
    email: "owner@apartmenthub.io",
    role: "SuperAdmin",
    roleLabel: "Platform Owner",
    tenantId: null,
    complexName: "Global SaaS Platform",
    avatar: "AV",
  },
  {
    id: "user-admin-1",
    name: "Nimal Fernando",
    email: "nimal.f@lotusgrand.lk",
    role: "ApartmentAdmin",
    roleLabel: "Building Manager",
    tenantId: 1,
    complexName: "Lotus Grand Residencies",
    complexCode: "LGR-01",
    avatar: "NF",
  },
  {
    id: "user-admin-2",
    name: "Saman Kumara",
    email: "saman.k@cinnamonbreeze.lk",
    role: "ApartmentAdmin",
    roleLabel: "Building Manager",
    tenantId: 2,
    complexName: "Cinnamon Breeze Condominiums",
    complexCode: "CBC-02",
    avatar: "SK",
  },
  {
    id: "user-admin-3",
    name: "Dilini Senanayake",
    email: "dilini.s@pearloceanic.com",
    role: "ApartmentAdmin",
    roleLabel: "Building Manager",
    tenantId: 3,
    complexName: "Pearl Oceanic Luxury Suites",
    complexCode: "POL-03",
    avatar: "DS",
  },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]);
  const [complexes, setComplexes] = useState(INITIAL_COMPLEXES);
  const [complexAdmins, setComplexAdmins] = useState([
    {
      id: "admin-101",
      name: "Nimal Fernando",
      email: "nimal.f@lotusgrand.lk",
      phone: "+94 77 234 5678",
      complexId: 1,
      complexName: "Lotus Grand Residencies",
      role: "ApartmentAdmin",
      status: "Active",
      assignedAt: "2026-01-16",
    },
    {
      id: "admin-102",
      name: "Saman Kumara",
      email: "saman.k@cinnamonbreeze.lk",
      phone: "+94 71 888 4433",
      complexId: 2,
      complexName: "Cinnamon Breeze Condominiums",
      role: "ApartmentAdmin",
      status: "Active",
      assignedAt: "2026-02-12",
    },
    {
      id: "admin-103",
      name: "Dilini Senanayake",
      email: "dilini.s@pearloceanic.com",
      phone: "+94 77 665 1199",
      complexId: 3,
      complexName: "Pearl Oceanic Luxury Suites",
      role: "ApartmentAdmin",
      status: "Active",
      assignedAt: "2026-03-02",
    },
  ]);

  const switchUser = (userId) => {
    const found = INITIAL_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const addComplex = (complexData) => {
    const tier = SUBSCRIPTION_TIERS[complexData.subscriptionPlan] || SUBSCRIPTION_TIERS["Enterprise Suite"];
    const newComplex = {
      id: complexes.length + 1,
      ...complexData,
      totalUnits: parseInt(complexData.totalUnits, 10) || 24,
      occupiedUnits: 0,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
      enabledModules: complexData.enabledModules || tier.modules,
    };
    setComplexes((prev) => [newComplex, ...prev]);
    return newComplex;
  };

  const updateComplexPackage = (complexId, subscriptionPlan, enabledModules) => {
    setComplexes((prev) =>
      prev.map((c) => {
        if (c.id === complexId) {
          return {
            ...c,
            subscriptionPlan,
            enabledModules: enabledModules || SUBSCRIPTION_TIERS[subscriptionPlan]?.modules || c.enabledModules,
          };
        }
        return c;
      })
    );
  };

  const addComplexAdmin = (adminData) => {
    const newAdmin = {
      id: `admin-${Date.now()}`,
      ...adminData,
      role: "ApartmentAdmin",
      status: "Active",
      assignedAt: new Date().toISOString().split("T")[0],
    };
    setComplexAdmins((prev) => [newAdmin, ...prev]);

    INITIAL_USERS.push({
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: "ApartmentAdmin",
      roleLabel: `Building Manager (${newAdmin.complexName})`,
      tenantId: newAdmin.complexId,
      complexName: newAdmin.complexName,
      avatar: newAdmin.name.slice(0, 2).toUpperCase(),
    });

    return newAdmin;
  };

  // Find active complex info
  const currentComplex = complexes.find((c) => c.id === currentUser.tenantId) || complexes[0];

  // Helper to check if a module is allowed for the active apartment admin
  const isModuleEnabled = (moduleKey) => {
    if (currentUser.role === "SuperAdmin") return true;
    if (!currentComplex || !currentComplex.enabledModules) return false;
    return currentComplex.enabledModules.includes(moduleKey);
  };

  const isSuperAdmin = currentUser.role === "SuperAdmin";
  const isApartmentAdmin = currentUser.role === "ApartmentAdmin";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers: INITIAL_USERS,
        complexes,
        currentComplex,
        complexAdmins,
        isSuperAdmin,
        isApartmentAdmin,
        activeTenantId: currentUser.tenantId || 1,
        activeComplexName: isSuperAdmin ? "Global Platform" : currentComplex.name,
        activePackage: isSuperAdmin ? "SuperAdmin" : currentComplex.subscriptionPlan,
        isModuleEnabled,
        switchUser,
        addComplex,
        updateComplexPackage,
        addComplexAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
