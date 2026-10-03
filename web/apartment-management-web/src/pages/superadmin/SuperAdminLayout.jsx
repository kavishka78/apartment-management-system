import { Navigate, Outlet } from "react-router-dom";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminLayout.css";

export default function SuperAdminLayout() {
  const { currentUser, authLoading, isSuperAdmin } = useAuth();

  if (authLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="super-admin-layout" id="super-admin-layout">
      <SuperAdminSidebar />
      <main className="super-admin-main">
        <Outlet />
      </main>
    </div>
  );
}
