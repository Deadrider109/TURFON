import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import ThemeToggle from "../components/ThemeToggle"

function Profile() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function loadProfile() {
    setLoading(true)
    setError("")

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        navigate("/login", { replace: true })
        return
      }

      setUser(currentUser)

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      setProfile(data || null)
      setFullName(data?.full_name || "")
      setPhone(data?.phone || "")
      setAddress(data?.address || "")
    } catch (err) {
      console.error("Profile error:", err)
      setError("We couldn't load your profile.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  async function handleSave(event) {
    event.preventDefault()

    setSaving(true)
    setMessage("")
    setError("")

    const cleanName = fullName.trim()
    const cleanPhone = phone.trim()
    const cleanAddress = address.trim()

    if (!cleanName) {
      setError("Please enter your full name.")
      setSaving(false)
      return
    }

    if (!cleanPhone) {
      setError("Please enter your phone number.")
      setSaving(false)
      return
    }

    if (cleanPhone.length < 7) {
      setError("Please enter a valid phone number.")
      setSaving(false)
      return
    }

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        navigate("/login", { replace: true })
        return
      }

      const { data, error: updateError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: currentUser.id,
            full_name: cleanName,
            phone: cleanPhone,
            email: currentUser.email || null,
            address: cleanAddress || null,
          },
          {
            onConflict: "id",
          }
        )
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      setProfile(data)
      setFullName(data.full_name || "")
      setPhone(data.phone || "")
      setAddress(data.address || "")

      setMessage("Profile updated successfully.")
    } catch (err) {
      console.error("Profile update error:", err)
      setError(
        err?.message ||
          "We couldn't save your changes. Please try again."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordReset() {
    setMessage("")
    setError("")

    if (!user?.email) {
      setError(
        "No email address is associated with this account."
      )
      return
    }

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          user.email,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        )

      if (resetError) {
        throw resetError
      }

      setMessage(
        "Password reset instructions have been sent to your email."
      )
    } catch (err) {
      console.error("Password reset error:", err)
      setError(
        "We couldn't send the password reset email. Please try again."
      )
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    setError("")

    try {
      const { error: logoutError } =
        await supabase.auth.signOut()

      if (logoutError) {
        throw logoutError
      }

      navigate("/login", { replace: true })
    } catch (err) {
      console.error("Logout error:", err)
      setError("We couldn't log you out. Please try again.")
      setLoggingOut(false)
    }
  }

  function formatCreatedDate(dateString) {
    if (!dateString) return "—"

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return "—"
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div
        className="
          flex min-h-screen items-center justify-center
          bg-[#F6F7F3]
          text-[#123B27]
          dark:bg-[#0B110E]
          dark:text-white
        "
      >
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span
            className="
              h-5 w-5 animate-spin rounded-full
              border-2 border-[#123B27]/20
              border-t-[#123B27]
              dark:border-white/20
              dark:border-t-[#B7E600]
            "
          />
          Loading profile...
        </div>
      </div>
    )
  }

  return (
    <div
      className="
        min-h-screen
        bg-[#F6F7F3]
        text-[#123B27]
        transition-colors duration-300
        dark:bg-[#0B110E]
        dark:text-white
      "
    >
      <header
        className="
          sticky top-0 z-30
          border-b border-black/[0.06]
          bg-[#F6F7F3]/90
          backdrop-blur-xl
          dark:border-white/[0.06]
          dark:bg-[#0B110E]/90
        "
      >
        <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="
              flex items-center gap-2
              text-sm font-semibold
              text-black/55
              transition
              hover:text-[#123B27]
              dark:text-white/55
              dark:hover:text-white
            "
          >
            <ArrowLeft size={17} />
            Dashboard
          </button>

          <div className="hidden items-center gap-3 sm:flex">
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
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 dark:text-white/25">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
            Profile & settings
          </h1>

          <p className="mt-2 text-sm text-black/45 dark:text-white/40">
            Manage your Sportiva account information.
          </p>
        </div>

        {message && (
          <div
            className="
              mb-5 flex items-center gap-2
              rounded-xl
              border border-emerald-500/15
              bg-emerald-500/[0.06]
              px-4 py-3
              text-sm text-emerald-600
              dark:text-emerald-400
            "
          >
            <Check size={16} />
            {message}
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

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section
            className="
              rounded-2xl
              border border-black/[0.07]
              bg-white
              p-5
              dark:border-white/[0.07]
              dark:bg-white/[0.04]
              sm:p-6
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-11 w-11 items-center justify-center
                  rounded-xl
                  bg-[#123B27]
                  text-[#B7E600]
                "
              >
                <UserRound size={19} />
              </div>

              <div>
                <h2 className="text-base font-black">
                  Personal information
                </h2>

                <p className="mt-0.5 text-xs text-black/40 dark:text-white/35">
                  Keep your booking information up to date.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSave}
              className="mt-6 space-y-5"
            >
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
                    className="
                      pointer-events-none
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      text-black/30
                      dark:text-white/25
                    "
                  />

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    autoComplete="name"
                    maxLength={100}
                    className="
                      h-12 w-full rounded-xl
                      border border-black/[0.08]
                      bg-[#F9FAF7]
                      pl-11 pr-4
                      text-sm font-medium
                      outline-none
                      transition
                      focus:border-[#123B27]/30
                      focus:ring-2
                      focus:ring-[#123B27]/10
                      dark:border-white/[0.08]
                      dark:bg-white/[0.035]
                      dark:focus:border-[#B7E600]/30
                      dark:focus:ring-[#B7E600]/10
                    "
                    placeholder="Your full name"
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
                    className="
                      pointer-events-none
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      text-black/25
                      dark:text-white/20
                    "
                  />

                  <input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="
                      h-12 w-full rounded-xl
                      border border-black/[0.06]
                      bg-black/[0.025]
                      pl-11 pr-4
                      text-sm
                      text-black/40
                      outline-none
                      dark:border-white/[0.06]
                      dark:bg-white/[0.02]
                      dark:text-white/30
                    "
                  />
                </div>

                <p className="mt-2 text-[10px] text-black/30 dark:text-white/25">
                  Your login email cannot be changed here.
                </p>
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
                    className="
                      pointer-events-none
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      text-black/30
                      dark:text-white/25
                    "
                  />

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    autoComplete="tel"
                    maxLength={30}
                    className="
                      h-12 w-full rounded-xl
                      border border-black/[0.08]
                      bg-[#F9FAF7]
                      pl-11 pr-4
                      text-sm font-medium
                      outline-none
                      transition
                      focus:border-[#123B27]/30
                      focus:ring-2
                      focus:ring-[#123B27]/10
                      dark:border-white/[0.08]
                      dark:bg-white/[0.035]
                      dark:focus:border-[#B7E600]/30
                      dark:focus:ring-[#B7E600]/10
                    "
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/40 dark:text-white/35"
                >
                  Address
                </label>

                <div className="relative">
                  <MapPin
                    size={16}
                    className="
                      pointer-events-none
                      absolute left-4 top-4
                      text-black/30
                      dark:text-white/25
                    "
                  />

                  <textarea
                    id="address"
                    value={address}
                    onChange={(event) =>
                      setAddress(event.target.value)
                    }
                    rows={3}
                    maxLength={300}
                    className="
                      w-full resize-none rounded-xl
                      border border-black/[0.08]
                      bg-[#F9FAF7]
                      py-3 pl-11 pr-4
                      text-sm font-medium
                      outline-none
                      transition
                      focus:border-[#123B27]/30
                      focus:ring-2
                      focus:ring-[#123B27]/10
                      dark:border-white/[0.08]
                      dark:bg-white/[0.035]
                      dark:focus:border-[#B7E600]/30
                      dark:focus:ring-[#B7E600]/10
                    "
                    placeholder="Your address"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="
                  inline-flex h-11 w-full
                  items-center justify-center gap-2
                  rounded-xl
                  bg-[#123B27]
                  px-5
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
                  sm:w-auto
                "
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-[#102818]/30 dark:border-t-[#102818]" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save changes
                  </>
                )}
              </button>
            </form>
          </section>

          <aside className="space-y-5">
            <section
              className="
                rounded-2xl
                border border-black/[0.07]
                bg-white
                p-5
                dark:border-white/[0.07]
                dark:bg-white/[0.04]
              "
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/30 dark:text-white/25">
                Account
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.05]">
                    <CalendarDays
                      size={15}
                      className="text-black/45 dark:text-white/45"
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/25">
                      Member since
                    </p>

                    <p className="mt-0.5 text-sm font-semibold">
                      {formatCreatedDate(
                        user?.created_at
                      )}
                    </p>
                  </div>
                </div>

                {profile?.email && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.05]">
                      <Mail
                        size={15}
                        className="text-black/45 dark:text-white/45"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/25">
                        Account email
                      </p>

                      <p className="mt-0.5 truncate text-sm font-semibold">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section
              className="
                rounded-2xl
                border border-black/[0.07]
                bg-white
                p-5
                dark:border-white/[0.07]
                dark:bg-white/[0.04]
              "
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.05]">
                  <LockKeyhole
                    size={17}
                    className="text-black/50 dark:text-white/50"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-black">
                    Security
                  </h2>

                  <p className="mt-0.5 text-[10px] text-black/35 dark:text-white/30">
                    Manage your password.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePasswordReset}
                className="
                  mt-5 flex w-full items-center justify-between
                  rounded-xl
                  border border-black/[0.07]
                  px-4 py-3
                  text-left
                  transition
                  hover:bg-black/[0.035]
                  dark:border-white/[0.07]
                  dark:hover:bg-white/[0.05]
                "
              >
                <span className="text-xs font-semibold">
                  Change password
                </span>

                <span className="text-[10px] text-black/35 dark:text-white/30">
                  Email
                </span>
              </button>
            </section>

            <section
              className="
                rounded-2xl
                border border-red-500/10
                bg-red-500/[0.025]
                p-5
                dark:border-red-400/10
                dark:bg-red-400/[0.025]
              "
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600/50 dark:text-red-400/40">
                Session
              </p>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="
                  mt-4 flex w-full items-center justify-center gap-2
                  rounded-xl
                  border border-red-500/15
                  bg-white
                  px-4 py-3
                  text-xs font-bold
                  text-red-600
                  transition
                  hover:bg-red-500/[0.05]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:border-red-400/15
                  dark:bg-white/[0.03]
                  dark:text-red-400
                  dark:hover:bg-red-400/[0.05]
                "
              >
                <LogOut size={15} />

                {loggingOut
                  ? "Signing out..."
                  : "Sign out"}
              </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default Profile