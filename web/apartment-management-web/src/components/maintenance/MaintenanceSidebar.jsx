import { useNavigate, useLocation } from 'react-router-dom'; import { MdArrowBack } from 'react-icons/md';

function MaintenanceSidebar({ activePage }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="payment-sidebar">
      <div className="payment-logo">
        <img src="/logo.png" alt="ApartmentHub Logo" className="logo-img" />
        <span>ApartmentHub</span>
      </div>

      <p className="menu-label">MAINTENANCE MANAGEMENT</p>

      <nav className="payment-menu">
        <button
          className={`menu-item ${isActive("/maintenance") ? "active" : ""}`}
          onClick={() => navigate("/maintenance")}
        >
          Maintenance Dashboard
        </button>

        <button
          className={`menu-item ${isActive("/maintenance/complaints") ? "active" : ""}`}
          onClick={() => navigate("/maintenance/complaints")}
        >
          Complaints List
        </button>

        <button
          className={`menu-item ${isActive("/maintenance/work-orders") ? "active" : ""}`}
          onClick={() => navigate("/maintenance/work-orders")}
        >
          Work Orders
        </button>

        <button
          className={`menu-item ${isActive("/maintenance/technicians") ? "active" : ""}`}
          onClick={() => navigate("/maintenance/technicians")}
        >
          Technicians
        </button>

        <button
          className={`menu-item ${isActive("/maintenance/sla-risk") ? "active" : ""}`}
          onClick={() => navigate("/maintenance/sla-risk")}
        >
          SLA Risk
        </button>

        <button
          className={`menu-item ${isActive("/maintenance/reports") ? "active" : ""}`}
          onClick={() => navigate("/maintenance/reports")}
        >
          Maintenance Reports
        </button>
      </nav>

      <div className="sidebar-bottom">
        <button onClick={() => window.location.href='/'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'opacity 0.2s' }} onMouseOver={(e) => e.target.style.opacity = '0.8'} onMouseOut={(e) => e.target.style.opacity = '1'}>
          <MdArrowBack size={18} /> Back to Home
        </button>
      </div>
    </aside>
  );
}

export default MaintenanceSidebar;
