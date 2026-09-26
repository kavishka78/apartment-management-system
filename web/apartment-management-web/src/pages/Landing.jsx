import { Link } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link className="landing-brand" to="/">
          <span className="landing-brand-mark">A</span>
          <span>Apartment Hub</span>
        </Link>
        <Link className="landing-nav-link" to="/admin">
          Admin portal <span aria-hidden="true">-&gt;</span>
        </Link>
      </nav>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="landing-eyebrow">One calm place to run the building</p>
          <h1>Make every part of apartment life easier to manage.</h1>
          <p className="landing-intro">
            Keep facilities, visitors, bookings, approvals, and payments moving
            from one clear workspace.
          </p>
          <div className="landing-actions">
            <Link className="landing-button landing-button-primary" to="/admin">
              Open admin dashboard <span aria-hidden="true">-&gt;</span>
            </Link>
            <Link className="landing-button landing-button-secondary" to="/payments">
              View payments
            </Link>
          </div>
        </div>

        <div className="landing-preview" aria-label="Apartment management overview">
          <div className="landing-preview-topline">
            <span>Operations overview</span>
            <span className="landing-status"><i /> Live workspace</span>
          </div>
          <div className="landing-preview-title">Everything in view</div>
          <div className="landing-preview-grid">
            <div><strong>24</strong><span>Facilities</span></div>
            <div><strong>86%</strong><span>Occupancy</span></div>
            <div><strong>12</strong><span>Open requests</span></div>
          </div>
          <div className="landing-preview-chart">
            <span style={{ height: "42%" }} />
            <span style={{ height: "68%" }} />
            <span style={{ height: "54%" }} />
            <span style={{ height: "82%" }} />
            <span style={{ height: "64%" }} />
            <span style={{ height: "94%" }} />
            <span style={{ height: "76%" }} />
          </div>
          <div className="landing-preview-footer"><span>Monthly activity</span><strong>+18.4%</strong></div>
        </div>
      </section>

      <section className="landing-features" aria-label="Workspace capabilities">
        <article><span>01</span><h2>See the whole building</h2><p>Understand activity at a glance with focused operational summaries.</p></article>
        <article><span>02</span><h2>Move work forward</h2><p>Review visitors, facilities, and approvals without losing context.</p></article>
        <article><span>03</span><h2>Keep payments clear</h2><p>Reach invoices, collections, and overdue accounts from one place.</p></article>
      </section>
    </main>
  );
}