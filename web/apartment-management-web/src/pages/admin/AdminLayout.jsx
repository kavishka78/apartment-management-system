import { Outlet } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";
import "./AdminLayout.css";

export default function AdminLayout() {
  return (
    <div className="admin-layout" id="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
