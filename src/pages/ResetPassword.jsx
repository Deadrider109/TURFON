import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"

function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (session) {
        setReady(true)
      }

      setCheckingSession(false)
    }

    checkRecoverySession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true)
        setCheckingSession(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    noSpaces: !/\s/.test(password),
  }

  const passwordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special &&
    passwordRules.noSpaces

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword

  const handleUpdatePassword = async (e) => {
    e.preventDefault()

    if (loading) return

    setError("")

    if (!passwordValid) {
      setError("Please create a stronger password.")
      return
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      setError(
        "We couldn't update your password. Please request a new reset link."
      )
      return
    }

    setSuccess(true)
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9F5] px-5">

        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#123B27]">
            <span className="text-2xl font-black italic text-[#B7E600]">
              S
            </span>
          </div>

          <p className="mt-5 text-[9px] font-black tracking-[0.25em] text-[#667085]">
            VERIFYING RESET SESSION
          </p>

        </div>

      </main>
    )
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9F5] px-5">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-[28px] border border-[#E6EAE3] bg-white p-8 text-center shadow-[0_25px_70px_rgba(18,59,39,0.08)]"
        >

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={25} />
          </div>

          <p className="mt-6 text-[9px] font-black tracking-[0.25em] text-red-500">
            RESET LINK INVALID
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#111111]">
            Link expired.
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#667085]">
            This password reset link is no longer valid. Please return
            to login and request a new password reset link.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#123B27] text-[10px] font-black tracking-[0.25em] text-white transition hover:bg-[#174D32]"
          >
            BACK TO LOGIN
            <ArrowRight size={16} />
          </button>

        </motion.div>

      </main>
    )
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9F5] px-5">

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-[28px] border border-[#E6EAE3] bg-white p-8 text-center shadow-[0_25px_70px_rgba(18,59,39,0.08)] sm:p-10"
        >

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0F8E9] text-[#123B27]">
            <CheckCircle2 size={30} />
          </div>

          <p className="mt-7 text-[9px] font-black tracking-[0.25em] text-[#123B27]">
            PASSWORD UPDATED
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#111111]">
            You're all set.
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#667085]">
            Your Sportiva password has been updated successfully.
            You can now sign in with your new password.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#123B27] text-[10px] font-black tracking-[0.25em] text-white transition hover:bg-[#174D32]"
          >
            RETURN TO SPORTIVA
            <ArrowRight size={16} />
          </button>

        </motion.div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F9F5] px-5 py-10">

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full rounded-[28px] border border-[#E6EAE3] bg-white p-7 shadow-[0_25px_70px_rgba(18,59,39,0.08)] sm:p-9"
        >

          {/* LOGO */}

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123B27]">
              <span className="text-2xl font-black italic text-[#B7E600]">
                S
              </span>
            </div>

            <div>

              <div className="text-xl font-black tracking-[0.2em] text-[#123B27]">
                SPORTIVA
              </div>

              <div className="text-[8px] font-bold tracking-[0.3em] text-[#6B7280]">
                ART OF ACTIVE LIVING
              </div>

            </div>

          </div>

          {/* HEADER */}

          <div className="mt-10">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F5EA] text-[#123B27]">
              <Lock size={23} />
            </div>

            <p className="mt-6 text-[9px] font-black tracking-[0.25em] text-[#123B27]">
              ACCOUNT RECOVERY
            </p>

            <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.03em] text-[#111111]">
              Create a
              <br />
              <span className="text-[#123B27]">
                new password.
              </span>
            </h1>

            <p className="mt-5 text-sm leading-6 text-[#667085]">
              Choose a strong password to secure your Sportiva account.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4"
            >

              <p className="text-xs leading-5 text-red-500">
                {error}
              </p>

            </motion.div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleUpdatePassword}
            className="mt-7 space-y-5"
          >

            {/* PASSWORD */}

            <div>

              <label className="mb-2 block text-[9px] font-black tracking-[0.2em] text-[#667085]">
                NEW PASSWORD
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                  autoComplete="new-password"
                  placeholder="Create a new password"
                  required
                  className="h-14 w-full rounded-2xl border border-[#E4E7EC] bg-white pl-12 pr-12 text-sm font-medium text-[#111111] outline-none transition-all placeholder:text-[#98A2B3] hover:border-[#C8D0C3] focus:border-[#123B27] focus:ring-4 focus:ring-[#123B27]/5"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#98A2B3] transition hover:bg-[#F2F4F0] hover:text-[#123B27]"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div>

              <label className="mb-2 block text-[9px] font-black tracking-[0.2em] text-[#667085]">
                CONFIRM PASSWORD
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setError("")
                  }}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  required
                  className="h-14 w-full rounded-2xl border border-[#E4E7EC] bg-white pl-12 pr-12 text-sm font-medium text-[#111111] outline-none transition-all placeholder:text-[#98A2B3] hover:border-[#C8D0C3] focus:border-[#123B27] focus:ring-4 focus:ring-[#123B27]/5"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#98A2B3] transition hover:bg-[#F2F4F0] hover:text-[#123B27]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>

            {/* PASSWORD RULES */}

            <div className="rounded-2xl border border-[#E7EBE4] bg-[#F8FAF7] p-4">

              <p className="mb-3 text-[8px] font-black tracking-[0.2em] text-[#667085]">
                PASSWORD REQUIREMENTS
              </p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2">

                <PasswordRule
                  valid={passwordRules.length}
                  label="8+ CHARACTERS"
                />

                <PasswordRule
                  valid={passwordRules.uppercase}
                  label="UPPERCASE"
                />

                <PasswordRule
                  valid={passwordRules.lowercase}
                  label="LOWERCASE"
                />

                <PasswordRule
                  valid={passwordRules.number}
                  label="NUMBER"
                />

                <PasswordRule
                  valid={passwordRules.special}
                  label="SPECIAL CHARACTER"
                />

                <PasswordRule
                  valid={passwordRules.noSpaces}
                  label="NO SPACES"
                />

              </div>

            </div>

            {/* MATCH STATUS */}

            {confirmPassword.length > 0 && (
              <div
                className={`rounded-xl px-4 py-3 ${
                  passwordsMatch
                    ? "bg-[#F0F8E9] text-[#38751F]"
                    : "bg-red-50 text-red-500"
                }`}
              >

                <p className="text-[9px] font-black tracking-[0.15em]">
                  {passwordsMatch
                    ? "PASSWORDS MATCH"
                    : "PASSWORDS DO NOT MATCH"}
                </p>

              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading || !passwordValid || !passwordsMatch}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#123B27] text-[10px] font-black tracking-[0.25em] text-white shadow-[0_15px_35px_rgba(18,59,39,0.16)] transition-all hover:bg-[#174D32] disabled:cursor-not-allowed disabled:opacity-40"
            >

              {loading
                ? "UPDATING PASSWORD..."
                : "UPDATE PASSWORD"}

              {!loading && (
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}

            </button>

          </form>

          {/* SECURITY */}

          <div className="mt-7 flex items-center justify-center gap-2">

            <ShieldCheck
              size={14}
              className="text-[#123B27]"
            />

            <p className="text-[8px] font-bold tracking-[0.15em] text-[#98A2B3]">
              SECURE SPORTIVA ACCOUNT RECOVERY
            </p>

          </div>

        </motion.div>

      </div>

    </main>
  )
}

/* ============================================================
   PASSWORD RULE
============================================================ */

function PasswordRule({ valid, label }) {
  return (
    <div className="flex items-center gap-2">

      <div
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          valid
            ? "bg-[#123B27] text-white"
            : "border border-[#D0D5DD] bg-white"
        }`}
      >
        {valid && (
          <CheckCircle2 size={10} />
        )}
      </div>

      <span
        className={`text-[8px] font-bold tracking-[0.08em] ${
          valid
            ? "text-[#123B27]"
            : "text-[#98A2B3]"
        }`}
      >
        {label}
      </span>

    </div>
  )
}

export default ResetPassword