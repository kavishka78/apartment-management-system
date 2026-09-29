import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ModuleRoute({ module, children }) {
  const { currentUser, authLoading, isApartmentAdmin, isModuleEnabled } = useAuth();
  if (authLoading) return null;
  if (!currentUser || !isApartmentAdmin) return <Navigate to="/login" replace />;
  if (!isModuleEnabled(module)) return <Navigate to="/admin" replace />;
  return children;
}
