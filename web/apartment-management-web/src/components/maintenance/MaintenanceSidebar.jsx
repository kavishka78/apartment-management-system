import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { MdArrowBack, MdClose, MdMenu } from 'react-icons/md';
import './MaintenanceSidebar.css';
import './MaintenanceResponsive.css';

function MaintenanceSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const navigateTo = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  useEffect(() => {
    document.body.classList.add('maintenance-page-active');
    return () => document.body.classList.remove('maintenance-page-active');
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('maintenance-menu-open');

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('maintenance-menu-open');
    };
  }, [isOpen]);

  return (
    <>
      <header className="maintenance-mobile-header">
        <div className="maintenance-mobile-brand">
          <img src="/logo.png" alt="ApartmentHub Logo" className="maintenance-mobile-logo" />
          <span>ApartmentHub</span>
        </div>
        <button
          type="button"
          className="maintenance-menu-toggle"
          aria-label="Open maintenance navigation"
          aria-expanded={isOpen}
          aria-controls="maintenance-navigation"
          onClick={() => setIsOpen(true)}
        >
          <span>Menu</span>
          <MdMenu size={25} aria-hidden="true" />
        </button>
      </header>

      {isOpen && (
        <button
          type="button"
          className="maintenance-menu-backdrop"
          aria-label="Close maintenance navigation"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside id="maintenance-navigation" className={`maintenance-sidebar ${isOpen ? 'maintenance-sidebar-open' : ''}`}>
        <div className="maintenance-sidebar-mobile-heading">
          <span>Navigation</span>
          <button type="button" aria-label="Close maintenance navigation" onClick={() => setIsOpen(false)}>
            <MdClose size={23} aria-hidden="true" />
          </button>
        </div>

        <div className="maintenance-logo">
          <img src="/logo.png" alt="ApartmentHub Logo" className="logo-img" />
          <span>ApartmentHub</span>
        </div>

        <p className="maintenance-menu-label">MAINTENANCE MANAGEMENT</p>

        <nav className="maintenance-menu">
          <button
            className={`maintenance-menu-item ${isActive("/maintenance") ? "active" : ""}`}
            onClick={() => navigateTo("/maintenance")}
          >
            Maintenance Dashboard
          </button>

          <button
            className={`maintenance-menu-item ${isActive("/maintenance/complaints") ? "active" : ""}`}
            onClick={() => navigateTo("/maintenance/complaints")}
          >
            Complaints List
          </button>

          <button
            className={`maintenance-menu-item ${isActive("/maintenance/work-orders") ? "active" : ""}`}
            onClick={() => navigateTo("/maintenance/work-orders")}
          >
            Work Orders
          </button>

          <button
            className={`maintenance-menu-item ${isActive("/maintenance/technicians") ? "active" : ""}`}
            onClick={() => navigateTo("/maintenance/technicians")}
          >
            Technicians
          </button>

          <button
            className={`maintenance-menu-item ${isActive("/maintenance/sla-risk") ? "active" : ""}`}
            onClick={() => navigateTo("/maintenance/sla-risk")}
          >
            SLA Risk
          </button>

          <button
            className={`maintenance-menu-item ${isActive("/maintenance/reports") ? "active" : ""}`}
            onClick={() => navigateTo("/maintenance/reports")}
          >
            Maintenance Reports
          </button>
        </nav>

        <div className="maintenance-sidebar-bottom">
          <button onClick={() => window.location.href='/'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'opacity 0.2s' }} onMouseOver={(e) => e.target.style.opacity = '0.8'} onMouseOut={(e) => e.target.style.opacity = '1'}>
            <MdArrowBack size={18} /> Back to Home
          </button>
        </div>
      </aside>
    </>
  );
}

export default MaintenanceSidebar;
