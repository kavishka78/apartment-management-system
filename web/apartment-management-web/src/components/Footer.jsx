import './Footer.css';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="website-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="footer-logo" aria-label="ApartmentHub home">
            <img src="/logo.png" alt="ApartmentHub Logo" className="logo-img" />
            <span>ApartmentHub</span>
          </Link>
          <p>
            A simpler way to manage the moments that make an apartment feel like home.
            Stay connected to your building, your requests and your community.
          </p>
        </div>

        <div className="footer-links-area">
          <div className="footer-link-group">
            <h3>Explore</h3>
            <a href="#home">Home</a>
            <a href="#apartments">Apartments</a>
            <a href="#services">Services</a>
            <a href="#facilities">Facilities</a>
          </div>

          <div className="footer-link-group">
            <h3>Resident portal</h3>
            <Link to="/maintenance">Maintenance</Link>
            <Link to="/payments">Payments & billing</Link>
            <Link to="/payments/invoices">Invoices</Link>
            <a href="#about">About ApartmentHub</a>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
