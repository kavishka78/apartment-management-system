import { useCallback, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { MdLockOutline, MdOutlinePersonOutline, MdKey, MdVisibility, MdVisibilityOff, MdBarChart, MdSecurity } from "react-icons/md";
import "./Login.css";

export default function Login() {
  const { currentUser, authLoading, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = useCallback(async (credential) => {
    setSubmitting(true);
    setError("");
    const result = await loginWithGoogle(credential);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.role === "SuperAdmin") navigate("/super-admin", { replace: true });
    else if (result.role === "Technician") navigate("/technician/work-orders", { replace: true });
    else navigate("/admin", { replace: true });
  }, [loginWithGoogle, navigate]);

  if (authLoading) return null;

  if (currentUser) {
    return <Navigate to={currentUser.role === "SuperAdmin" ? "/super-admin" : currentUser.role === "Technician" ? "/technician/work-orders" : "/admin"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.role === "SuperAdmin") navigate("/super-admin", { replace: true }); else if (result.role === "Technician") navigate("/technician/work-orders", { replace: true }); else navigate("/admin", { replace: true });
  };

  return (
    <div className="login-container">
      {/* Left Side: Image & Branding */}
      <div className="login-hero">
        <div className="hero-content">
          <p className="hero-kicker">YOUR APARTMENT, CLEARLY ORGANIZED</p>
          <h1 className="hero-title">
            Welcome back to a<br/>
            smarter living<br/>
            experience.
          </h1>
          
          <div className="hero-badges">
            <span className="badge"><MdBarChart size={16} color="#3b82f6" /> Smart reports</span>
            <span className="badge"><MdSecurity size={16} color="#10b981" /> Secure access</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="login-form-side">
        <div className="form-wrapper">
          <div className="form-icon-header">
            <MdLockOutline size={22} />
          </div>
          
          <h2>Welcome back</h2>
          <p className="form-subtitle">Sign in to continue to your dashboard.</p>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="input-group">
              <label>Username or email</label>
              <div className="input-with-icon">
                <MdOutlinePersonOutline className="input-icon" size={18} />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <MdKey className="input-icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="google-sign-in">
            <div className="login-divider"><span>or continue with</span></div>
            <GoogleSignInButton onCredential={handleGoogle} onError={setError} />
          </div>

          <div className="demo-info">
            <p style={{ fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Demo accounts</p>
            <p>Super admin: owner@apartmenthub.io / owner123</p>
            <p>Apartment admin: nimal.f@lotusgrand.lk / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
