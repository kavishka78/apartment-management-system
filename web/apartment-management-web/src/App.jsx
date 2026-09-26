import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";

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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<Landing />} />

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
            <Route path="facilities" element={<Facilities />} />
            <Route path="visitors" element={<VisitorLogs />} />
            <Route path="ai-approvals" element={<AiApprovals />} />

            {/* Student 1 Module Routes */}
            <Route path="units" element={<Units />} />
            <Route path="residents" element={<Residents />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="staff" element={<DomesticStaff />} />
            <Route path="ai-safety" element={<AiSafetyAuditor />} />
          </Route>

          {/* Payment Module (teammate's routes — preserved exactly) */}
          <Route path="/payments" element={<PaymentDashboard />} />
          <Route path="/payments/invoices" element={<Invoices />} />
          <Route path="/payments/generate" element={<GenerateInvoice />} />
          <Route path="/payments/list" element={<Payments />} />
          <Route path="/payments/overdue" element={<OverdueAccounts />} />
          <Route path="/payments/reports" element={<CollectionReports />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;