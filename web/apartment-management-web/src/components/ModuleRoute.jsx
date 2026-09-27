import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ModuleRoute({ module, children }) {
  const { currentUser, authLoading, isModuleEnabled } = useAuth();
  if (authLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isModuleEnabled(module)) return <Navigate to="/admin" replace />;
  return children;
}
