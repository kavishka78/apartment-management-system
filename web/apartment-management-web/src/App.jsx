import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ModuleRoute from "./components/ModuleRoute";

// Load each route only when it is first opened, keeping unrelated modules out of the initial download.
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const TechnicianDashboard = lazy(() => import("./pages/technician/TechnicianDashboard"));

const PaymentDashboard = lazy(() => import("./pages/payment/PaymentDashboard"));
const Invoices = lazy(() => import("./pages/payment/Invoices"));
const GenerateInvoice = lazy(() => import("./pages/payment/GenerateInvoice"));
const Payments = lazy(() => import("./pages/payment/Payments"));
const OverdueAccounts = lazy(() => import("./pages/payment/OverdueAccounts"));
const CollectionReports = lazy(() => import("./pages/payment/CollectionReports"));

const SuperAdminLayout = lazy(() => import("./pages/superadmin/SuperAdminLayout"));
const SuperAdminOverview = lazy(() => import("./pages/superadmin/SuperAdminOverview"));
const SuperAdminComplexes = lazy(() => import("./pages/superadmin/SuperAdminComplexes"));
const SuperAdminAdmins = lazy(() => import("./pages/superadmin/SuperAdminAdmins"));
const SuperAdminSubscriptions = lazy(() => import("./pages/superadmin/SuperAdminSubscriptions"));
const SuperAdminAiGovernance = lazy(() => import("./pages/superadmin/SuperAdminAiGovernance"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Overview = lazy(() => import("./pages/admin/Overview"));
const Facilities = lazy(() => import("./pages/admin/Facilities"));
const VisitorLogs = lazy(() => import("./pages/admin/VisitorLogs"));
const AiApprovals = lazy(() => import("./pages/admin/AiApprovals"));
const Units = lazy(() => import("./pages/admin/Units"));
const Residents = lazy(() => import("./pages/admin/Residents"));
const Vehicles = lazy(() => import("./pages/admin/Vehicles"));
const DomesticStaff = lazy(() => import("./pages/admin/DomesticStaff"));
const AiSafetyAuditor = lazy(() => import("./pages/admin/AiSafetyAuditor"));

const MaintenanceDashboard = lazy(() => import("./pages/maintenance/MaintenanceDashboard"));
const Complaints = lazy(() => import("./pages/maintenance/Complaints"));
const MaintenanceDetails = lazy(() => import("./pages/maintenance/MaintenanceDetails"));
const TechniciansList = lazy(() => import("./pages/maintenance/TechniciansList"));
const WorkOrders = lazy(() => import("./pages/maintenance/WorkOrders"));
const SlaRisk = lazy(() => import("./pages/maintenance/SlaRisk"));
const MaintenanceReports = lazy(() => import("./pages/maintenance/MaintenanceReports"));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="app-route-loading" role="status">Loading page...</div>}>
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

          <Route path="/technician/work-orders" element={<TechnicianDashboard />} />
            {/* Catch-all */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
