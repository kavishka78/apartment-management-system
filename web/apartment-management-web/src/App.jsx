import "./App.css";
import apartmentHero from "./assets/apartment-hero.jpg";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import PaymentDashboard from "./pages/payment/PaymentDashboard";
import Invoices from "./pages/payment/Invoices";
import GenerateInvoice from "./pages/payment/GenerateInvoice";
import Payments from "./pages/payment/Payments";
import OverdueAccounts from "./pages/payment/OverdueAccounts";
import CollectionReports from "./pages/payment/CollectionReports";


function App() {
  return (
    <div className="app">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">A</span>
          <span>ApartmentHub</span>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#apartments">Apartments</a>
          <a href="#services">Services</a>
          <a href="#facilities">Facilities</a>
          <a href="#about">About</a>
        </div>

        <button className="login-btn">Login</button>
      </nav>

      <main>

        {/* Hero Section */}
        <section className="hero" id="home">

          <div className="hero-content">
            <p className="hero-label">SMART APARTMENT LIVING</p>

            <h1>
              Everything you need for your
              <span> apartment, in one place.</span>
            </h1>

            <p className="hero-description">
              Manage payments, maintenance requests, facilities and visitors
              effortlessly with our smart apartment management platform.
            </p>

            <div className="hero-buttons">
              <button className="primary-btn">Get Started</button>
              <button className="secondary-btn">Resident Login</button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="building-card">
              <img
                src={apartmentHero}
                alt="Modern apartment building"
                className="hero-image"
              />
            </div>
          </div>

        </section>

        {/* Services Section */}
        <section className="services" id="services">

          <div className="section-heading">
            <p className="section-label">OUR SERVICES</p>

            <h2>Everything for better apartment living</h2>

            <p className="section-description">
              One simple platform to manage your apartment, payments,
              maintenance, facilities and everyday living.
            </p>
          </div>

          <div className="service-grid">

            <div className="service-card">
              <div className="service-icon">01</div>

              <h3>Apartment Management</h3>

              <p>
                Manage apartment details, residents, occupancy and move-in or
                move-out processes easily.
              </p>

              <a href="#apartments">Learn more →</a>
            </div>

            <div className="service-card">
              <div className="service-icon">02</div>

              <h3>Maintenance Requests</h3>

              <p>
                Submit maintenance requests, follow repair progress and stay
                updated until the issue is resolved.
              </p>

              <a href="#maintenance">Learn more →</a>
            </div>

            <div className="service-card">
              <div className="service-icon">03</div>

              <h3>Payments & Billing</h3>

              <p>
                View monthly invoices, make payments, track payment history
                and access receipts in one place.
              </p>

              <a href="#payments">Learn more →</a>
            </div>

            <div className="service-card">
              <div className="service-icon">04</div>

              <h3>Facilities & Bookings</h3>

              <p>
                Reserve shared facilities, manage visitors and simplify
                parking and access requests.
              </p>

              <a href="#facilities">Learn more →</a>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}

function RootApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />

        <Route
          path="/payments"
          element={<PaymentDashboard />}
        />

        <Route
          path="/payments/invoices"
          element={<Invoices />}
        />

        <Route
          path="/payments/generate"
          element={<GenerateInvoice />}
        />

        <Route
          path="/payments/list"
          element={<Payments />}
        />

        <Route
          path="/payments/overdue"
          element={<OverdueAccounts />}
        />

        <Route
        path="/payments/reports"
        element={<CollectionReports />}
        />
        
      </Routes>
    </BrowserRouter>
  );
}

export default RootApp;