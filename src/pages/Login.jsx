import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react"

import { supabase } from "../supabase"
import ThemeToggle from "../components/ThemeToggle"

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [needsVerification, setNeedsVerification] =
    useState(false)

  useEffect(() => {
    const verificationComplete =
      new URLSearchParams(location.search).get("verified")

    if (verificationComplete === "1") {
      setMessage(
        "Email verified successfully. You can now access your Sportiva account."
      )

      window.history.replaceState(
        {},
        "",
        "/login"
      )
    }
  }, [location.search])

  async function handleLogin(event) {
    event.preventDefault()

    setLoading(true)
    setError("")
    setMessage("")
    setNeedsVerification(false)

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.")
      setLoading(false)
      return
    }

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

      if (loginError) {
        throw loginError
      }

      const user = data?.user

      if (!user) {
        throw new Error("We couldn't sign you in.")
      }

      /*
       * Extra protection in case Supabase's email confirmation
       * setting is changed later.
       */
      if (!user.email_confirmed_at) {
        await supabase.auth.signOut()

        setNeedsVerification(true)
        setError(
          "Please verify your email address before logging in."
        )
        return
      }

      navigate(
        location.state?.from?.pathname || "/dashboard",
        {
          replace: true,
        }
      )
    } catch (err) {
      console.error("Login error:", err)

      const messageText = String(err?.message || "")

      if (
        messageText.toLowerCase().includes("email not confirmed")
      ) {
        setNeedsVerification(true)
        setError(
          "Please verify your email address before logging in."
        )
      } else {
        setError(
          "Invalid email or password. Please try again."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setError(
        "Enter your email address first so we can resend the verification email."
      )
      return
    }

    setResending(true)
    setError("")
    setMessage("")

    try {
      const { error: resendError } =
        await supabase.auth.resend({
          type: "signup",
          email: cleanEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/login?verified=1`,
          },
        })

      if (resendError) {
        throw resendError
      }

      setMessage(
        "A new verification email has been sent. Check your inbox."
      )
    } catch (err) {
      console.error("Resend verification error:", err)

      setError(
        "We couldn't resend the verification email. Please try again later."
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      className="
        min-h-screen
        bg-[#F6F7F3]
        text-[#123B27]
        dark:bg-[#0B110E]
        dark:text-white
      "
    >
      <header
        className="
          flex h-[72px] items-center justify-between
          border-b border-black/[0.06]
          px-4 sm:px-6
          dark:border-white/[0.06]
        "
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123B27] text-[#B7E600]">
            <span className="text-xs font-black italic">
              S
            </span>
          </div>

          <span className="text-sm font-black tracking-[0.16em]">
            SPORTIVA
          </span>
        </div>

        <ThemeToggle />
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center px-4 py-10">
        <section className="w-full">
          <div className="mb-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 dark:text-white/25">
              Welcome back
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Log in to Sportiva
            </h1>

            <p className="mt-2 text-sm text-black/45 dark:text-white/40">
              Access your bookings and account.
            </p>
          </div>

          {message && (
            <div
              className="
                mb-5 flex items-start gap-2
                rounded-xl
                border border-emerald-500/15
                bg-emerald-500/[0.06]
                px-4 py-3
                text-sm text-emerald-600
                dark:text-emerald-400
              "
            >
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0"
              />

              <span>{message}</span>
            </div>
          )}

          {error && (
            <div
              className="
                mb-5 rounded-xl
                border border-red-500/15
                bg-red-500/[0.06]
                px-4 py-3
                text-sm text-red-600
                dark:text-red-400
              "
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/40 dark:text-white/35"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/25"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="
                    h-12 w-full rounded-xl
                    border border-black/[0.08]
                    bg-white
                    pl-11 pr-4
                    text-sm outline-none
                    focus:border-[#123B27]/30
                    focus:ring-2 focus:ring-[#123B27]/10
                    dark:border-white/[0.08]
                    dark:bg-white/[0.035]
                    dark:focus:border-[#B7E600]/30
                    dark:focus:ring-[#B7E600]/10
                  "
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/40 dark:text-white/35"
                >
                  Password
                </label>

                <Link
                  to="/reset-password"
                  className="text-[10px] font-bold text-[#123B27] dark:text-[#B7E600]"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/25"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="
                    h-12 w-full rounded-xl
                    border border-black/[0.08]
                    bg-white
                    pl-11 pr-12
                    text-sm outline-none
                    focus:border-[#123B27]/30
                    focus:ring-2 focus:ring-[#123B27]/10
                    dark:border-white/[0.08]
                    dark:bg-white/[0.035]
                    dark:focus:border-[#B7E600]/30
                    dark:focus:ring-[#B7E600]/10
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-black/35 dark:text-white/30"
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
              className="
                mt-2 flex h-12 w-full
                items-center justify-center gap-2
                rounded-xl
                bg-[#123B27]
                text-xs font-black uppercase
                tracking-[0.1em]
                text-white
                transition
                hover:bg-[#174b31]
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:bg-[#B7E600]
                dark:text-[#102818]
                dark:hover:bg-[#C5F20A]
              "
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in
                </>
              ) : (
                <>
                  Log in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {needsVerification && (
            <div
              className="
                mt-5 rounded-2xl
                border border-amber-500/15
                bg-amber-500/[0.05]
                p-4
              "
            >
              <p className="text-sm font-bold">
                Email verification required
              </p>

              <p className="mt-1 text-xs leading-5 text-black/45 dark:text-white/40">
                Check your inbox for the Sportiva verification
                email. If you didn't receive it, you can send
                another one.
              </p>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="
                  mt-4 inline-flex items-center gap-2
                  text-xs font-black uppercase
                  tracking-[0.1em]
                  text-[#123B27]
                  disabled:opacity-50
                  dark:text-[#B7E600]
                "
              >
                {resending && (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                )}

                {resending
                  ? "Sending..."
                  : "Resend verification email"}
              </button>
            </div>
          )}

          <p className="mt-7 text-center text-sm text-black/40 dark:text-white/35">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-[#123B27] dark:text-[#B7E600]"
            >
              Create one
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}

export default Login