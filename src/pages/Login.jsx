import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const from =
    location.state?.from && typeof location.state.from === "string"
      ? location.state.from
      : "/dashboard";

  const handleLogin = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) throw error;

      if (!data?.user) {
        throw new Error("Unable to sign in.");
      }

      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login error:", error);

      const message = String(error.message || "").toLowerCase();

      if (
        message.includes("invalid login credentials") ||
        message.includes("invalid credentials")
      ) {
        setErrorMessage(
          "Incorrect email or password. Please try again."
        );
      } else if (message.includes("email not confirmed")) {
        setErrorMessage(
          "Email confirmation is currently required by the Supabase project."
        );
      } else {
        setErrorMessage(
          error.message || "Unable to sign in."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage(
        "Enter your email address first, then choose Forgot password."
      );
      return;
    }

    try {
      setLoading(true);

      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo,
        }
      );

      if (error) throw error;

      setSuccessMessage(
        "Password reset instructions have been sent if this email is registered."
      );
    } catch (error) {
      console.error("Password reset error:", error);

      setErrorMessage(
        error.message || "Unable to send password reset instructions."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] px-4 py-8 text-[#17221d]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dfe9e2] bg-white shadow-[0_24px_80px_rgba(16,37,27,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-[#10251b] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="text-2xl font-black tracking-[1px]">
                SPORT<span className="text-[#55a96f]">IVA</span>
              </div>

              <div className="mt-2 text-[9px] font-extrabold tracking-[2px] text-[#81958a]">
                ART OF ACTIVE LIVING
              </div>
            </div>

            <div>
              <div className="mb-3 text-[9px] font-extrabold tracking-[1.8px] text-[#55a96f]">
                THE SPORTIVA
              </div>

              <h1 className="text-4xl font-black leading-tight">
                Welcome
                <br />
                back.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-[#aebdb4]">
                Manage your bookings, schedules and Sportiva
                membership from one account.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-9 lg:p-11">
            <div className="mb-8">
              <div className="text-[9px] font-extrabold tracking-[1.7px] text-[#4d8763]">
                MEMBER LOGIN
              </div>

              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Sign in
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#718078]">
                Enter your account details to continue.
              </p>
            </div>

            {successMessage && (
              <div className="mb-5 rounded-xl border border-[#cbe5d2] bg-[#f1faf4] px-4 py-3 text-xs font-semibold leading-5 text-[#28734a]">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 rounded-xl border border-[#f0cccc] bg-[#fff5f5] px-4 py-3 text-xs font-semibold leading-5 text-[#a04444]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-extrabold tracking-[0.6px] text-[#68776f]">
                  EMAIL ADDRESS
                </label>

                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9891]"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-11 w-full rounded-xl border border-[#dce4df] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#2d8151] focus:ring-4 focus:ring-[#2d8151]/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-extrabold tracking-[0.6px] text-[#68776f]">
                    PASSWORD
                  </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-extrabold text-[#28734a] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9891]"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="h-11 w-full rounded-xl border border-[#dce4df] bg-white pl-10 pr-11 text-sm outline-none transition focus:border-[#2d8151] focus:ring-4 focus:ring-[#2d8151]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77847c]"
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#176b3a] text-sm font-extrabold text-white transition hover:bg-[#12582f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#718078]">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-extrabold text-[#28734a] hover:underline"
              >
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;