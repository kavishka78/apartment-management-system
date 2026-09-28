import { useCallback, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";
import "./Login.css";

export default function Login() {
  const { currentUser, authLoading, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = useCallback(
    async (credential) => {
      setError("");
      const result = await loginWithGoogle(credential);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.role === "SuperAdmin") navigate("/super-admin", { replace: true }); else if (result.role === "Technician") navigate("/technician/work-orders", { replace: true }); else navigate("/admin", { replace: true });
    },
    [loginWithGoogle, navigate]
  );

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
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">AH</div>
        <h1>Sign in to ApartmentHub</h1>
        <p className="login-sub">Platform owners and apartment administrators</p>

        {error && <div className="login-error">{error}</div>}

        <label>
          Email
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />
        </label>

        <button type="submit" className="login-btn" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <div className="login-divider"><span>or</span></div>
        <GoogleSignInButton onCredential={handleGoogle} onError={setError} />

        <div className="login-demo">
          <strong>Demo accounts</strong>
          <span>Super admin: owner@apartmenthub.io / owner123</span>
          <span>Apartment admin: nimal.f@lotusgrand.lk / admin123</span>
        </div>
      </form>
    </div>
  );
}
