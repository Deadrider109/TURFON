import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react"

import { supabase } from "../supabase"
import ThemeToggle from "../components/ThemeToggle"

function Register() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleRegister(event) {
    event.preventDefault()

    setError("")

    const cleanName = fullName.trim()
    const cleanPhone = phone.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanName || !cleanPhone || !cleanEmail || !password) {
      setError("Please complete all required fields.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)

    try {
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login?verified=1`,
            data: {
              full_name: cleanName,
              phone: cleanPhone,
            },
          },
        })

      if (signupError) {
        throw signupError
      }

      /*
       * If Supabase returns a session here, email confirmation
       * is probably disabled in the Supabase project.
       *
       * When confirmation is enabled, session should normally
       * be null until the user verifies their email.
       */
      if (data?.session) {
        const user = data.session.user

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              full_name: cleanName,
              phone: cleanPhone,
              email: cleanEmail,
            },
            {
              onConflict: "id",
            }
          )

        if (profileError) {
          console.error("Profile creation error:", profileError)
        }

        navigate("/dashboard", { replace: true })
        return
      }

      setSuccess(true)
    } catch (err) {
      console.error("Registration error:", err)

      const message = String(err?.message || "")

      if (message.toLowerCase().includes("already registered")) {
        setError(
          "An account with this email already exists. Please log in instead."
        )
      } else {
        setError(
          message || "We couldn't create your account. Please try again."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
            px-4
            dark:border-white/[0.06]
          "
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123B27] text-[#B7E600]">
              <span className="text-xs font-black italic">S</span>
            </div>

            <span className="text-sm font-black tracking-[0.16em]">
              SPORTIVA
            </span>
          </div>

          <ThemeToggle />
        </header>

        <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Mail size={28} />
            </div>

            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 dark:text-white/25">
              Almost there
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Verify your email
            </h1>

            <p className="mt-3 text-sm leading-6 text-black/45 dark:text-white/40">
              We've sent a verification link to
            </p>

            <p className="mt-1 break-all text-sm font-bold">
              {email.trim().toLowerCase()}
            </p>

            <div
              className="
                mt-7 rounded-2xl
                border border-black/[0.07]
                bg-white
                p-5 text-left
                dark:border-white/[0.07]
                dark:bg-white/[0.04]
              "
            >
              <div className="flex gap-3">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-[#123B27] dark:text-[#B7E600]"
                />

                <div>
                  <p className="text-sm font-bold">
                    Check your inbox
                  </p>

                  <p className="mt-1 text-xs leading-5 text-black/40 dark:text-white/35">
                    Click the verification link in the email.
                    After verification, you'll be able to log in
                    to Sportiva.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="
                mt-6 inline-flex items-center gap-2
                text-xs font-black uppercase
                tracking-[0.12em]
                text-[#123B27]
                dark:text-[#B7E600]
              "
            >
              Go to login
              <ArrowRight size={14} />
            </Link>
          </div>
        </main>
      </div>
    )
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
            <span className="text-xs font-black italic">S</span>
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
              Join Sportiva
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-black/45 dark:text-white/40">
              Book your next session at Sportiva.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/40 dark:text-white/35"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/25"
                />

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
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
              <label
                htmlFor="phone"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/40 dark:text-white/35"
              >
                Phone number
              </label>

              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/25"
                />

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  autoComplete="tel"
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
              <label
                htmlFor="password"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/40 dark:text-white/35"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/25"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
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
                  onClick={() => setShowPassword((value) => !value)}
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
                  Creating account
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-black/40 dark:text-white/35">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-[#123B27] dark:text-[#B7E600]"
            >
              Log in
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}

export default Register