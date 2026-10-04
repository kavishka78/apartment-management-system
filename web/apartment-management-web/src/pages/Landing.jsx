import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {MdApartment, MdArrowForward, MdBuild, MdCheckCircle, MdMeetingRoom, MdNotificationsActive, MdPayment,} from "react-icons/md";
import "./Landing.css";
import Footer from "../components/Footer";

export default function Landing() {
  const [isOverHero, setIsOverHero] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const updateNavbar = () => {
      const hero = document.getElementById("home");
      setIsOverHero(!hero || window.scrollY < hero.offsetTop + hero.offsetHeight - 80);
    };

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });
    window.addEventListener("resize", updateNavbar);
    return () => {
      window.removeEventListener("scroll", updateNavbar);
      window.removeEventListener("resize", updateNavbar);
    };
  }, []);

  return (
    <div className="app">
      {/* Navbar */}
      <nav className={"navbar" + (isOverHero ? " navbar--hero" : "")}>
        <div className="logo">
          <img src="/logo.png" alt="ApartmentHub" className="logo-img" />
          <span>ApartmentHub</span>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#apartments">Architecture</a>
          <a href="#services">Modules</a>
          <a href="#facilities">Workflows</a>
        </div>

        <button className="login-btn" onClick={() => navigate('/login')}>Open Dashboard</button>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="hero" id="home">
          <div className="hero-backdrop" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
              alt=""
              className="hero-image"
            />
          </div>

          <div className="hero-content">
            <p className="hero-label">APARTMENT MANAGEMENT SYSTEM</p>

            <h1>
              AI-Powered<br />
              Management<br />
              <span>for modern properties</span>
            </h1>

            <p className="hero-description">
              Streamline operations, automate triaging, and gain deep insights across apartments, maintenance, billing, and facilities.
            </p>

            <div className="hero-buttons">
              <Link className="primary-btn" to="/admin">Open Dashboard <MdArrowForward /></Link>
              
            </div>

            <div className="hero-trust">
              <span><MdCheckCircle /> Built for Property Managers</span>
              <span><MdCheckCircle /> Powered by Agentic AI</span>
            </div>
          </div>
        </section>

        <section className="home-overview" id="apartments">
          <div className="overview-inner">
            <div className="overview-intro">
              <p className="section-label">CORE ARCHITECTURE</p>
              <h2>Intelligent automation at every step.</h2>
              <p>
                The Apartment Management System uses specialized AI Agents to handle complex workflows, reducing manual overhead and ensuring residents receive lightning-fast service through their dedicated mobile app.
              </p>
            </div>

            <div className="overview-stats" aria-label="Agentic AI highlights">
              <div className="stat-item">
                <div className="stat-icon"><MdApartment /></div>
                <div className="stat-heading">SMART RESIDENT ALLOCATION</div>
                <p>AI analyzes resident requirements and apartment availability to recommend suitable units for manager approval.</p>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><MdBuild /></div>
                <div className="stat-heading">INTELLIGENT MAINTENANCE TRIAGE</div>
                <p>AI classifies maintenance complaints, evaluates urgency and SLA risk, and recommends the best available technician for manager approval.</p>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><MdNotificationsActive /></div>
                <div className="stat-heading">PAYMENT & COLLECTIONS INTELLIGENCE</div>
                <p>AI analyzes outstanding balances and payment history to identify overdue-risk residents and recommend appropriate collection actions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="services" id="services">
          <div className="services-inner">
            <div className="services-left">
              <p className="section-label">SYSTEM MODULES</p>
              <h2>Four Pillars of Management</h2>
              <p className="section-description">
                Our comprehensive suite covers every aspect of property operations, backed by specialized Agentic AI.
              </p>
            </div>

            <div className="service-grid">
              <div className="service-card">
                <div className="service-icon"><MdApartment /></div>
                <h3>1. Apartment & Resident</h3>
                <p>Manage buildings, owners, occupancy, and move-ins.</p>
                <button onClick={() => navigate('/admin')} style={{ marginTop: '15px', padding: '10px 16px', background: '#17212b', color: '#fff', borderRadius: '50px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', width: '100%', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseOver={(e) => e.target.style.background='#000'} onMouseOut={(e) => e.target.style.background='#17212b'}>Resident & Unit Allocation Agent <MdArrowForward size={14} /></button>
              </div>

              <div className="service-card">
                <div className="service-icon"><MdBuild /></div>
                <h3>2. Maintenance & Complaints</h3>
                <p>Track SLA risks, work orders, technician workloads, and repairs.</p>
                <button onClick={() => navigate('/maintenance')} style={{ marginTop: '15px', padding: '10px 16px', background: '#17212b', color: '#fff', borderRadius: '50px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', width: '100%', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseOver={(e) => e.target.style.background='#000'} onMouseOut={(e) => e.target.style.background='#17212b'}>Maintenance Triage Agent <MdArrowForward size={14} /></button>
              </div>

              <div className="service-card">
                <div className="service-icon"><MdPayment /></div>
                <h3>3. Fees & Payments</h3>
                <p>Generate monthly invoices, track overdue accounts, and manage receipts.</p>
                <button onClick={() => navigate('/payments')} style={{ marginTop: '15px', padding: '10px 16px', background: '#17212b', color: '#fff', borderRadius: '50px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', width: '100%', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseOver={(e) => e.target.style.background='#000'} onMouseOut={(e) => e.target.style.background='#17212b'}>Billing Analysis Agent <MdArrowForward size={14} /></button>
              </div>

              <div className="service-card">
                <div className="service-icon"><MdMeetingRoom /></div>
                <h3>4. Facilities & Visitors</h3>
                <p>Manage pool/gym bookings, QR visitor access, and parking lots.</p>
                <button onClick={() => navigate('/admin/facilities')} style={{ marginTop: '15px', padding: '10px 16px', background: '#17212b', color: '#fff', borderRadius: '50px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', width: '100%', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseOver={(e) => e.target.style.background='#000'} onMouseOut={(e) => e.target.style.background='#17212b'}>Facility & Access Planning Agent <MdArrowForward size={14} /></button>
              </div>
            </div>
          </div>
        </section>

        <section className="resident-journey" id="facilities">
          <div className="journey-intro">
            <p className="section-label">ADMIN WORKFLOW</p>
            <h2>Command center for property staff.</h2>
            <p>While residents use the mobile app, this web portal gives your management team complete control over daily operations.</p>
          </div>

          <div className="journey-grid">
            <article className="journey-card">
              <div className="journey-icon"><MdBuild /></div>
              <p className="journey-number">01</p>
              <h3>Approve Triage</h3>
              <p>Review AI-recommended technician assignments for incoming resident complaints and dispatch them.</p>
              <Link to="/maintenance/work-orders">View Work Orders <MdArrowForward /></Link>
            </article>

            <article className="journey-card">
              <div className="journey-icon"><MdPayment /></div>
              <p className="journey-number">02</p>
              <h3>Monitor Collections</h3>
              <p>Let the AI analyze overdue accounts while you review financial reports and send custom reminders.</p>
              <Link to="/payments/reports">View Reports <MdArrowForward /></Link>
            </article>

            <article className="journey-card">
              <div className="journey-icon"><MdMeetingRoom /></div>
              <p className="journey-number">03</p>
              <h3>Streamline Facilities</h3>
              <p>Manage facility bookings, visitor requests, and parking with smarter availability checks and access validation.</p>
              <Link to="/facilities">View Facilities <MdArrowForward /></Link>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
