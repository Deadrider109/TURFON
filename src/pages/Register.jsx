import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrorMessage("");
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const fullName = form.fullName.trim();
    const phone = form.phone.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!fullName || !phone || !email || !password || !confirmPassword) {
      setErrorMessage("Please complete all fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      /*
       * With Supabase Email Confirmation OFF, this returns an active
       * session immediately.
       *
       * Supabase Auth keeps email addresses unique, so the same email
       * cannot be used to create another account.
       */
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (error) {
        const message = String(error.message || "").toLowerCase();

        if (
          message.includes("already registered") ||
          message.includes("already exists") ||
          message.includes("user already exists") ||
          message.includes("duplicate")
        ) {
          throw new Error(
            "An account with this email already exists. Please log in instead."
          );
        }

        throw error;
      }

      /*
       * Confirmation is OFF, so a brand-new user should normally
       * receive a session immediately.
       */
      const user = data?.user;
      const session = data?.session;

      if (!user) {
        throw new Error("Registration could not be completed.");
      }

      /*
       * Create/update the public profile using the Auth user's UUID.
       * Upsert prevents duplicate profile rows for the same user ID.
       */
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: fullName,
            phone,
            email,
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      if (session) {
        navigate("/dashboard", { replace: true });
        return;
      }

      /*
       * This should only happen if Supabase is still configured
       * to require confirmation.
       */
      navigate("/login", {
        replace: true,
        state: {
          registered: true,
          email,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);

      setErrorMessage(
        error.message || "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] px-4 py-8 text-[#17221d]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#dfe9e2] bg-white shadow-[0_24px_80px_rgba(16,37,27,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
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
                JOIN THE SPORTIVA
              </div>

              <h1 className="max-w-sm text-4xl font-black leading-tight">
                Your game.
                <br />
                Your time.
                <br />
                Your turf.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-[#aebdb4]">
                Create your Sportiva account and book your preferred
                turf schedule in a few simple steps.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-9 lg:p-11">
            <div className="mb-8">
              <div className="text-[9px] font-extrabold tracking-[1.7px] text-[#4d8763]">
                CREATE ACCOUNT
              </div>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#17221d]">
                Welcome to Sportiva
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#718078]">
                Register once and manage all your turf bookings
                from your account.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-xl border border-[#f0cccc] bg-[#fff5f5] px-4 py-3 text-xs font-semibold leading-5 text-[#a04444]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-extrabold tracking-[0.6px] text-[#68776f]">
                  FULL NAME
                </label>

                <div className="relative">
                  <UserRound
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9891]"
                  />

                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      updateField("fullName", e.target.value)
                    }
                    placeholder="Your full name"
                    autoComplete="name"
                    className="h-11 w-full rounded-xl border border-[#dce4df] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#2d8151] focus:ring-4 focus:ring-[#2d8151]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-extrabold tracking-[0.6px] text-[#68776f]">
                  PHONE NUMBER
                </label>

                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9891]"
                  />

                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      updateField("phone", e.target.value)
                    }
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    className="h-11 w-full rounded-xl border border-[#dce4df] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#2d8151] focus:ring-4 focus:ring-[#2d8151]/10"
                  />
                </div>
              </div>

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
                    value={form.email}
                    onChange={(e) =>
                      updateField("email", e.target.value)
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-11 w-full rounded-xl border border-[#dce4df] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#2d8151] focus:ring-4 focus:ring-[#2d8151]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-extrabold tracking-[0.6px] text-[#68776f]">
                  PASSWORD
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9891]"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      updateField("password", e.target.value)
                    }
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
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

              <div>
                <label className="mb-2 block text-[10px] font-extrabold tracking-[0.6px] text-[#68776f]">
                  CONFIRM PASSWORD
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9891]"
                  />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      updateField(
                        "confirmPassword",
                        e.target.value
                      )
                    }
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-[#dce4df] bg-white pl-10 pr-11 text-sm outline-none transition focus:border-[#2d8151] focus:ring-4 focus:ring-[#2d8151]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77847c]"
                  >
                    {showConfirmPassword ? (
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
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#718078]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-extrabold text-[#28734a] hover:underline"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;