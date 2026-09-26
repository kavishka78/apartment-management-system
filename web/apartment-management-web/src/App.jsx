import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ModuleRoute from "./components/ModuleRoute";

// ─── Payment Pages (teammate's code — untouched) ────────
import PaymentDashboard from "./pages/payment/PaymentDashboard";
import Invoices from "./pages/payment/Invoices";
import GenerateInvoice from "./pages/payment/GenerateInvoice";
import Payments from "./pages/payment/Payments";
import OverdueAccounts from "./pages/payment/OverdueAccounts";
import CollectionReports from "./pages/payment/CollectionReports";

// ─── Super Admin Dedicated Portal Layout & Pages ─────────
import SuperAdminLayout from "./pages/superadmin/SuperAdminLayout";
import SuperAdminOverview from "./pages/superadmin/SuperAdminOverview";
import SuperAdminComplexes from "./pages/superadmin/SuperAdminComplexes";
import SuperAdminAdmins from "./pages/superadmin/SuperAdminAdmins";
import SuperAdminSubscriptions from "./pages/superadmin/SuperAdminSubscriptions";
import SuperAdminAiGovernance from "./pages/superadmin/SuperAdminAiGovernance";

// ─── Apartment Admin Layout & Facilities Pages ───────────
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import Facilities from "./pages/admin/Facilities";
import VisitorLogs from "./pages/admin/VisitorLogs";
import AiApprovals from "./pages/admin/AiApprovals";

// ─── Student 1: Apartment Admin Pages (Scoped to Building)
import Units from "./pages/admin/Units";
import Residents from "./pages/admin/Residents";
import Vehicles from "./pages/admin/Vehicles";
import DomesticStaff from "./pages/admin/DomesticStaff";
import AiSafetyAuditor from "./pages/admin/AiSafetyAuditor";

// ─── Maintenance & Complaint Management Pages ─────────────
import MaintenanceDashboard from "./pages/maintenance/MaintenanceDashboard";
import Complaints from "./pages/maintenance/Complaints";
import MaintenanceDetails from "./pages/maintenance/MaintenanceDetails";
import TechniciansList from "./pages/maintenance/TechniciansList";
import WorkOrders from "./pages/maintenance/WorkOrders";
import SlaRisk from "./pages/maintenance/SlaRisk";
import MaintenanceReports from "./pages/maintenance/MaintenanceReports";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* 👑 Super Admin Dedicated URL Route Tree */}
          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminOverview />} />
            <Route path="complexes" element={<SuperAdminComplexes />} />
            <Route path="admins" element={<SuperAdminAdmins />} />
            <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
            <Route path="ai-governance" element={<SuperAdminAiGovernance />} />
          </Route>

          {/* 🏢 Apartment Admin Portal (Scoped to TenantId) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="facilities" element={<ModuleRoute module="facilities"><Facilities /></ModuleRoute>} />
            <Route path="visitors" element={<ModuleRoute module="visitors"><VisitorLogs /></ModuleRoute>} />
            <Route path="ai-approvals" element={<ModuleRoute module="ai_safety"><AiApprovals /></ModuleRoute>} />

            {/* Student 1 Module Routes */}
            <Route path="units" element={<ModuleRoute module="units"><Units /></ModuleRoute>} />
            <Route path="residents" element={<ModuleRoute module="residents"><Residents /></ModuleRoute>} />
            <Route path="vehicles" element={<ModuleRoute module="vehicles"><Vehicles /></ModuleRoute>} />
            <Route path="staff" element={<ModuleRoute module="staff"><DomesticStaff /></ModuleRoute>} />
            <Route path="ai-safety" element={<ModuleRoute module="ai_safety"><AiSafetyAuditor /></ModuleRoute>} />
          </Route>

          {/* Payment Module (teammate's routes — preserved exactly) */}
          <Route path="/payments" element={<ModuleRoute module="payments"><PaymentDashboard /></ModuleRoute>} />
          <Route path="/payments/invoices" element={<ModuleRoute module="payments"><Invoices /></ModuleRoute>} />
          <Route path="/payments/generate" element={<ModuleRoute module="payments"><GenerateInvoice /></ModuleRoute>} />
          <Route path="/payments/list" element={<ModuleRoute module="payments"><Payments /></ModuleRoute>} />
          <Route path="/payments/overdue" element={<ModuleRoute module="payments"><OverdueAccounts /></ModuleRoute>} />
          <Route path="/payments/reports" element={<ModuleRoute module="payments"><CollectionReports /></ModuleRoute>} />

          {/* Maintenance & Complaint Management Module (Own Layout) */}
          <Route path="/maintenance" element={<ModuleRoute module="maintenance"><MaintenanceDashboard /></ModuleRoute>} />
          <Route path="/maintenance/complaints" element={<ModuleRoute module="maintenance"><Complaints /></ModuleRoute>} />
          <Route path="/maintenance/complaints/:id" element={<ModuleRoute module="maintenance"><MaintenanceDetails /></ModuleRoute>} />
          <Route path="/maintenance/technicians" element={<ModuleRoute module="maintenance"><TechniciansList /></ModuleRoute>} />
          <Route path="/maintenance/work-orders" element={<ModuleRoute module="maintenance"><WorkOrders /></ModuleRoute>} />
          <Route path="/maintenance/sla-risk" element={<ModuleRoute module="maintenance"><SlaRisk /></ModuleRoute>} />
          <Route path="/maintenance/reports" element={<ModuleRoute module="maintenance"><MaintenanceReports /></ModuleRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;