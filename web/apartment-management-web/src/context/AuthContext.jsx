import { createContext, useContext, useState, useEffect } from "react";
import {
  SUBSCRIPTION_TIERS,
  addMonthsIso,
  getSubscriptionStatus,
  isSubscriptionUsable,
  todayIso,
} from "./authConstants.js";

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
    subscriptionStart: "2026-09-01",
    subscriptionEnd: "2027-09-01",
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
    subscriptionStart: "2026-04-10",
    subscriptionEnd: "2026-10-10",
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
    subscriptionStart: "2026-03-01",
    subscriptionEnd: "2027-03-01",
    enabledModules: ["units", "residents", "payments"],
  },
];

const INITIAL_ACCOUNTS = [
  {
    id: "user-super-1",
    name: "Alexander Vance",
    email: "owner@apartmenthub.io",
    password: "owner123",
    role: "SuperAdmin",
    tenantId: null,
    avatar: "AV",
  },
  {
    id: "admin-101",
    name: "Nimal Fernando",
    email: "nimal.f@lotusgrand.lk",
    password: "admin123",
    role: "ApartmentAdmin",
    tenantId: 1,
    avatar: "NF",
  },
  {
    id: "admin-102",
    name: "Saman Kumara",
    email: "saman.k@cinnamonbreeze.lk",
    password: "admin123",
    role: "ApartmentAdmin",
    tenantId: 2,
    avatar: "SK",
  },
  {
    id: "admin-103",
    name: "Dilini Senanayake",
    email: "dilini.s@pearloceanic.com",
    password: "admin123",
    role: "ApartmentAdmin",
    tenantId: 3,
    avatar: "DS",
  },
];

const INITIAL_ADMINS = [
  { id: "admin-101", name: "Nimal Fernando", email: "nimal.f@lotusgrand.lk", phone: "+94 77 234 5678", complexId: 1, complexName: "Lotus Grand Residencies", role: "ApartmentAdmin", status: "Active", assignedAt: "2026-01-16" },
  { id: "admin-102", name: "Saman Kumara", email: "saman.k@cinnamonbreeze.lk", phone: "+94 71 888 4433", complexId: 2, complexName: "Cinnamon Breeze Condominiums", role: "ApartmentAdmin", status: "Active", assignedAt: "2026-02-12" },
  { id: "admin-103", name: "Dilini Senanayake", email: "dilini.s@pearloceanic.com", phone: "+94 77 665 1199", complexId: 3, complexName: "Pearl Oceanic Luxury Suites", role: "ApartmentAdmin", status: "Active", assignedAt: "2026-03-02" },
];

const AuthContext = createContext(null);

function usePersistedState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable; state stays in memory only
    }
  }, [key, value]);

  return [value, setValue];
}

export function AuthProvider({ children }) {
  const [sessionUserId, setSessionUserId] = usePersistedState("ah_v2_session", null);
  const [accounts, setAccounts] = usePersistedState("ah_v2_accounts", INITIAL_ACCOUNTS);
  const [complexes, setComplexes] = usePersistedState("ah_v2_complexes", INITIAL_COMPLEXES);
  const [complexAdmins, setComplexAdmins] = usePersistedState("ah_v2_admins", INITIAL_ADMINS);
  const [subscriptionHistory, setSubscriptionHistory] = usePersistedState("ah_v2_sub_history", []);

  const account = accounts.find((a) => a.id === sessionUserId) || null;
  const currentUser = account
    ? {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        tenantId: account.tenantId,
        avatar: account.avatar,
      }
    : null;

  const login = (email, password) => {
    const found = accounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
    );
    if (!found) return { ok: false, error: "Invalid email or password." };
    setSessionUserId(found.id);
    return { ok: true, role: found.role };
  };

  const logout = () => setSessionUserId(null);

  const logHistory = (complex, action, detail) => {
    setSubscriptionHistory((prev) => [
      {
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        complexId: complex.id,
        complexName: complex.name,
        action,
        detail,
        by: currentUser?.name || "System",
        at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const addComplex = (complexData) => {
    const tier = SUBSCRIPTION_TIERS[complexData.subscriptionPlan] || SUBSCRIPTION_TIERS["Enterprise Suite"];
    const months = Number(complexData.termMonths) || 12;
    const start = todayIso();
    const newComplex = {
      ...complexData,
      id: complexes.reduce((max, c) => Math.max(max, c.id), 0) + 1,
      totalUnits: parseInt(complexData.totalUnits, 10) || 24,
      occupiedUnits: 0,
      status: "Active",
      createdAt: start,
      subscriptionStart: start,
      subscriptionEnd: addMonthsIso(start, months),
      enabledModules: complexData.enabledModules || tier.modules,
    };
    delete newComplex.termMonths;
    setComplexes((prev) => [newComplex, ...prev]);
    logHistory(newComplex, "Onboarded", `${newComplex.subscriptionPlan}, ${months} month term`);
    return newComplex;
  };

  const updateComplexPackage = (complexId, subscriptionPlan, enabledModules) => {
    const target = complexes.find((c) => c.id === complexId);
    if (!target) return;
    const modules = enabledModules || SUBSCRIPTION_TIERS[subscriptionPlan]?.modules || target.enabledModules;
    if (subscriptionPlan !== target.subscriptionPlan) {
      const rank = (p) => SUBSCRIPTION_TIERS[p]?.priceLkr || 0;
      const kind = rank(subscriptionPlan) >= rank(target.subscriptionPlan) ? "Upgraded" : "Downgraded";
      logHistory(target, kind, `${target.subscriptionPlan} → ${subscriptionPlan}`);
    } else {
      logHistory(target, "Modules changed", `${modules.length} modules enabled`);
    }
    setComplexes((prev) =>
      prev.map((c) => (c.id === complexId ? { ...c, subscriptionPlan, enabledModules: modules } : c))
    );
  };

  const renewSubscription = (complexId, months) => {
    const target = complexes.find((c) => c.id === complexId);
    if (!target) return;
    const today = todayIso();
    // Renew from the current end date if still running, otherwise from today
    const base = target.subscriptionEnd && target.subscriptionEnd > today ? target.subscriptionEnd : today;
    const newEnd = addMonthsIso(base, months);
    setComplexes((prev) =>
      prev.map((c) =>
        c.id === complexId
          ? { ...c, status: "Active", subscriptionStart: base === today ? today : c.subscriptionStart, subscriptionEnd: newEnd }
          : c
      )
    );
    logHistory(target, "Renewed", `+${months} month(s), valid until ${newEnd}`);
  };

  const deactivateComplex = (complexId) => {
    const target = complexes.find((c) => c.id === complexId);
    if (!target) return;
    setComplexes((prev) => prev.map((c) => (c.id === complexId ? { ...c, status: "Deactivated" } : c)));
    logHistory(target, "Deactivated", "Admin access suspended");
  };

  const reactivateComplex = (complexId) => {
    const target = complexes.find((c) => c.id === complexId);
    if (!target) return;
    setComplexes((prev) => prev.map((c) => (c.id === complexId ? { ...c, status: "Active" } : c)));
    logHistory(target, "Reactivated", "Admin access restored");
  };

  const addComplexAdmin = (adminData) => {
    const email = adminData.email.trim().toLowerCase();
    if (accounts.some((a) => a.email.toLowerCase() === email)) {
      throw new Error("An account with this email already exists.");
    }
    const id = `admin-${Date.now()}`;
    const { password, ...profile } = adminData;
    const newAdmin = {
      id,
      ...profile,
      email,
      role: "ApartmentAdmin",
      status: "Active",
      assignedAt: todayIso(),
    };
    setComplexAdmins((prev) => [newAdmin, ...prev]);
    setAccounts((prev) => [
      ...prev,
      {
        id,
        name: newAdmin.name,
        email,
        password,
        role: "ApartmentAdmin",
        tenantId: newAdmin.complexId,
        avatar: newAdmin.name.slice(0, 2).toUpperCase(),
      },
    ]);
    return newAdmin;
  };

  const isSuperAdmin = currentUser?.role === "SuperAdmin";
  const isApartmentAdmin = currentUser?.role === "ApartmentAdmin";

  const currentComplex = isApartmentAdmin
    ? complexes.find((c) => c.id === currentUser.tenantId) || null
    : null;

  const subscriptionStatus = isApartmentAdmin ? getSubscriptionStatus(currentComplex) : "Active";
  const subscriptionActive = isSuperAdmin || (isApartmentAdmin && isSubscriptionUsable(currentComplex));

  const isModuleEnabled = (moduleKey) => {
    if (isSuperAdmin) return true;
    if (!subscriptionActive || !currentComplex?.enabledModules) return false;
    return currentComplex.enabledModules.includes(moduleKey);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        complexes,
        currentComplex,
        complexAdmins,
        subscriptionHistory,
        isSuperAdmin,
        isApartmentAdmin,
        activeTenantId: currentUser?.tenantId ?? null,
        activeComplexName: isSuperAdmin ? "Global Platform" : currentComplex?.name || "",
        activePackage: isSuperAdmin ? "SuperAdmin" : currentComplex?.subscriptionPlan,
        subscriptionStatus,
        subscriptionActive,
        isModuleEnabled,
        login,
        logout,
        addComplex,
        updateComplexPackage,
        renewSubscription,
        deactivateComplex,
        reactivateComplex,
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
