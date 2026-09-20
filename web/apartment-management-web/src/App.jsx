import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ─── Payment Pages (teammate's code — untouched) ────────
import PaymentDashboard from "./pages/payment/PaymentDashboard";
import Invoices from "./pages/payment/Invoices";
import GenerateInvoice from "./pages/payment/GenerateInvoice";
import Payments from "./pages/payment/Payments";
import OverdueAccounts from "./pages/payment/OverdueAccounts";
import CollectionReports from "./pages/payment/CollectionReports";

// ─── Admin Pages ─────────────────────────────────────────
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import Facilities from "./pages/admin/Facilities";
import VisitorLogs from "./pages/admin/VisitorLogs";
import AiApprovals from "./pages/admin/AiApprovals";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirects to admin dashboard */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Admin Portal (sidebar layout) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="facilities" element={<Facilities />} />
          <Route path="visitors" element={<VisitorLogs />} />
          <Route path="ai-approvals" element={<AiApprovals />} />
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
  );
}

export default App;