import { createContext, useContext, useState } from "react";

const USERS = [
  {
    id: "user-super-1",
    name: "Alexander Vance",
    email: "owner@apartmenthub.io",
    role: "SuperAdmin",
    roleLabel: "Platform Owner (Super Admin)",
    tenantId: null,
    complexName: "All Apartment Complexes (Global Platform)",
    avatar: "AV",
  },
  {
    id: "user-admin-1",
    name: "Nimal Fernando",
    email: "nimal.f@lotusgrand.lk",
    role: "ApartmentAdmin",
    roleLabel: "Apartment Admin (Manager)",
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
    roleLabel: "Apartment Admin (Manager)",
    tenantId: 2,
    complexName: "Cinnamon Breeze Condominiums",
    complexCode: "CBC-02",
    avatar: "SK",
  },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Default logged in as Super Admin
  const [currentUser, setCurrentUser] = useState(USERS[0]);
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
    const found = USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
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

    // Also add to available users list for simulation
    USERS.push({
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: "ApartmentAdmin",
      roleLabel: `Apartment Admin (${newAdmin.complexName})`,
      tenantId: newAdmin.complexId,
      complexName: newAdmin.complexName,
      avatar: newAdmin.name.slice(0, 2).toUpperCase(),
    });

    return newAdmin;
  };

  const isSuperAdmin = currentUser.role === "SuperAdmin";
  const isApartmentAdmin = currentUser.role === "ApartmentAdmin";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers: USERS,
        complexAdmins,
        isSuperAdmin,
        isApartmentAdmin,
        activeTenantId: currentUser.tenantId || 1,
        activeComplexName: currentUser.complexName,
        switchUser,
        addComplexAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
