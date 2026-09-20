import "./Header.css";

export default function Header({ title, subtitle, children }) {
  return (
    <header className="admin-header" id="admin-header">
      <div className="admin-header-left">
        <p className="admin-header-label">ADMIN PORTAL</p>
        <h1 className="admin-header-title">{title}</h1>
        {subtitle && <p className="admin-header-subtitle">{subtitle}</p>}
      </div>
      <div className="admin-header-right">{children}</div>
    </header>
  );
}
