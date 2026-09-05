import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  LockKeyhole,
  Activity,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError("Please enter your User ID and password.");
      return;
    }

    setLoading(true);

    try {
      // Find the hidden email associated with this admin User ID
      const { data: email, error: lookupError } =
        await supabase.rpc("get_admin_email", {
          login_username: cleanUsername,
        });

      if (lookupError) {
        console.error(lookupError);
        throw new Error("Unable to verify User ID.");
      }

      if (!email) {
        throw new Error("Invalid User ID or password.");
      }

      // Authenticate through Supabase Auth
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        throw new Error("Invalid User ID or password.");
      }

      const user = data?.user;

      if (!user) {
        throw new Error("Unable to authenticate administrator.");
      }

      // Verify email
      if (!user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error(
          "Please verify the administrator account email first."
        );
      }

      // Final admin verification
      const { data: adminUser, error: adminError } =
        await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (adminError) {
        console.error(adminError);
        await supabase.auth.signOut();
        throw new Error("Unable to verify administrator access.");
      }

      if (!adminUser) {
        await supabase.auth.signOut();
        throw new Error("This account is not an administrator.");
      }

      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);

      setError(
        err.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sportiva-admin-login">

      {/* Background */}
      <div className="admin-glow admin-glow-one" />
      <div className="admin-glow admin-glow-two" />
      <div className="admin-grid" />

      {/* Back */}
      <button
        className="admin-back-button"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={17} />
        <span>Back to Sportiva</span>
      </button>

      <main className="admin-login-wrapper">

        {/* Brand */}
        <div className="admin-brand">
          <div className="admin-brand-mark">
            <Activity size={25} strokeWidth={2.4} />
          </div>

          <div>
            <div className="admin-brand-name">
              SPORTIVA
            </div>

            <div className="admin-brand-tag">
              SPORTS & TURF MANAGEMENT
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="admin-login-card">

          <div className="admin-login-header">

            <div className="admin-security-icon">
              <ShieldCheck size={27} />
            </div>

            <div>
              <p className="admin-eyebrow">
                OWNER PORTAL
              </p>

              <h1>Admin Login</h1>

              <p className="admin-description">
                Sign in to manage your Sportiva facility.
              </p>
            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="admin-error-box">
              <div className="admin-error-dot" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="admin-login-form"
          >

            {/* User ID */}
            <div className="admin-input-group">

              <label htmlFor="admin-username">
                USER ID
              </label>

              <input
                id="admin-username"
                type="text"
                placeholder="Enter your User ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />

            </div>

            {/* Password */}
            <div className="admin-input-group">

              <label htmlFor="admin-password">
                PASSWORD
              </label>

              <div className="admin-password-wrapper">

                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* Login */}
            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-spinner" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LockKeyhole size={18} />
                  Enter Admin Portal
                </>
              )}
            </button>

          </form>

          {/* Security */}
          <div className="admin-security-footer">

            <ShieldCheck size={16} />

            <div>
              <strong>Restricted Access</strong>

              <span>
                Authorized Sportiva administrators only
              </span>
            </div>

          </div>

        </div>

        <div className="admin-login-bottom">
          SPORTIVA MANAGEMENT SYSTEM
          <span>•</span>
          SECURE ADMINISTRATION
        </div>

      </main>
    </div>
  );
}