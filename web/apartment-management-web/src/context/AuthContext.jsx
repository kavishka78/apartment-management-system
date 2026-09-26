import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSubscriptionStatus, isSubscriptionUsable } from "./authConstants.js";
import {
  getAuthToken,
  setAuthToken,
  loginApi,
  googleLoginApi,
  getMeApi,
  getComplexes,
  getComplexById,
  createComplexApi,
  updateComplexPackageApi,
  renewComplexApi,
  deactivateComplexApi,
  reactivateComplexApi,
  getSubscriptionHistoryApi,
  getAdminsApi,
  createAdminApi,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => getAuthToken() !== null);
  const [complexes, setComplexes] = useState([]);
  const [complexAdmins, setComplexAdmins] = useState([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);

  const loadData = useCallback(async (user) => {
    if (user.role === "SuperAdmin") {
      const [c, a, h] = await Promise.all([getComplexes(), getAdminsApi(), getSubscriptionHistoryApi()]);
      setComplexes(c || []);
      setComplexAdmins(a || []);
      setSubscriptionHistory(
        (h || []).map((x) => ({ ...x, complexName: x.complexName, by: x.by, at: x.at }))
      );
    } else {
      const c = await getComplexById(user.tenantId);
      setComplexes(c ? [c] : []);
      setComplexAdmins([]);
      setSubscriptionHistory([]);
    }
  }, []);

  // Restore the session from the database on first load
  useEffect(() => {
    if (getAuthToken() === null) return;
    let cancelled = false;
    (async () => {
      try {
        const user = await getMeApi();
        await loadData(user);
        if (!cancelled) setCurrentUser(user);
      } catch {
        setAuthToken(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const login = async (email, password) => {
    try {
      const { token, user } = await loginApi(email, password);
      setAuthToken(token);
      await loadData(user);
      setCurrentUser(user);
      return { ok: true, role: user.role };
    } catch (err) {
      const unreachable = err instanceof TypeError;
      return { ok: false, error: unreachable ? "Cannot reach the server. Is the backend running?" : err.message };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const { token, user } = await googleLoginApi(credential);
      setAuthToken(token);
      await loadData(user);
      setCurrentUser(user);
      return { ok: true, role: user.role };
    } catch (err) {
      const unreachable = err instanceof TypeError;
      return { ok: false, error: unreachable ? "Cannot reach the server. Is the backend running?" : err.message };
    }
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setComplexes([]);
    setComplexAdmins([]);
    setSubscriptionHistory([]);
  };

  const refresh = () => (currentUser ? loadData(currentUser) : Promise.resolve());

  const addComplex = async (complexData) => {
    const created = await createComplexApi(complexData);
    await refresh();
    return created;
  };

  const updateComplexPackage = async (complexId, subscriptionPlan, enabledModules) => {
    await updateComplexPackageApi(complexId, { subscriptionPlan, enabledModules });
    await refresh();
  };

  const renewSubscription = async (complexId, months) => {
    await renewComplexApi(complexId, months);
    await refresh();
  };

  const deactivateComplex = async (complexId) => {
    await deactivateComplexApi(complexId);
    await refresh();
  };

  const reactivateComplex = async (complexId) => {
    await reactivateComplexApi(complexId);
    await refresh();
  };

  const addComplexAdmin = async (adminData) => {
    const created = await createAdminApi(adminData);
    await refresh();
    return created;
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
        authLoading,
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
        loginWithGoogle,
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
