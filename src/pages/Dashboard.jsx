import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  MoreVertical,
  RefreshCw,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import ThemeToggle from "../components/ThemeToggle"

function formatDate(dateString) {
  if (!dateString) return "—"

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  )
}

function formatTime(time) {
  if (!time) return "—"

  const [hour, minute] = time.split(":")
  const date = new Date()

  date.setHours(Number(hour), Number(minute), 0, 0)

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function getBookingDateTime(booking) {
  if (!booking?.booking_date || !booking?.start_time) {
    return null
  }

  return new Date(
    `${booking.booking_date}T${booking.start_time}`
  )
}

function isUpcomingBooking(booking) {
  const status = String(booking?.status || "").toLowerCase()

  if (status === "cancelled") {
    return false
  }

  const bookingDate = getBookingDateTime(booking)

  if (!bookingDate || Number.isNaN(bookingDate.getTime())) {
    return false
  }

  return bookingDate >= new Date()
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div
      className="
        rounded-2xl border border-black/[0.07]
        bg-white p-4
        shadow-[0_8px_30px_rgba(18,59,39,0.04)]
        dark:border-white/[0.07]
        dark:bg-white/[0.04]
      "
    >
      <div className="flex items-center justify-between">
        <div
          className="
            flex h-9 w-9 items-center justify-center
            rounded-xl bg-[#123B27]/[0.08]
            dark:bg-[#B7E600]/10
          "
        >
          <Icon
            size={18}
            className="text-[#123B27] dark:text-[#B7E600]"
          />
        </div>

        <span className="text-2xl font-black text-[#123B27] dark:text-white">
          {value}
        </span>
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-black/40 dark:text-white/35">
        {label}
      </p>
    </div>
  )
}

function StatusBadge({ status }) {
  const value = String(status || "pending").toLowerCase()

  const styles = {
    confirmed:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pending:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    cancelled:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full px-2.5 py-1
        text-[9px] font-bold uppercase tracking-[0.12em]
        ${styles[value] || "bg-black/5 text-black/50"}
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "Pending"}
    </span>
  )
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex w-full items-center gap-3
        rounded-xl px-3 py-2.5
        text-left text-sm font-medium
        transition
        ${
          danger
            ? "text-red-500 hover:bg-red-500/[0.07]"
            : "text-black/70 hover:bg-black/[0.05] dark:text-white/75 dark:hover:bg-white/[0.06]"
        }
      `}
    >
      <Icon size={17} />
      {label}
    </button>
  )
}

function Dashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [turfs, setTurfs] = useState([])
  const [bookings, setBookings] = useState([])
  const [announcement, setAnnouncement] = useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true)
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate("/login", { replace: true })
        return
      }

      const [
        profileResult,
        turfsResult,
        bookingsResult,
        announcementResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("turfs")
          .select("*")
          .eq("is_active", true)
          .order("created_at", {
            ascending: true,
          }),

        supabase
          .from("bookings")
          .select(`
            *,
            turfs (
              name,
              image_url
            )
          `)
          .eq("user_id", user.id)
          .order("booking_date", {
            ascending: true,
          })
          .order("start_time", {
            ascending: true,
          }),

        supabase
          .from("announcements")
          .select("*")
          .eq("is_active", true)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle(),
      ])

      if (profileResult.error) {
        console.error("Profile error:", profileResult.error)
      }

      if (turfsResult.error) {
        console.error("Turfs error:", turfsResult.error)
      }

      if (bookingsResult.error) {
        console.error("Bookings error:", bookingsResult.error)
      }

      if (announcementResult.error) {
        console.error(
          "Announcement error:",
          announcementResult.error
        )
      }

      setProfile(profileResult.data || null)
      setTurfs(turfsResult.data || [])
      setBookings(bookingsResult.data || [])
      setAnnouncement(announcementResult.data || null)
    } catch (error) {
      console.error("Dashboard error:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  const upcomingBookings = bookings
    .filter(isUpcomingBooking)
    .sort((a, b) => {
      const first = getBookingDateTime(a)?.getTime() || 0
      const second = getBookingDateTime(b)?.getTime() || 0

      return first - second
    })

  const confirmedBookings = bookings.filter(
    (booking) =>
      String(booking.status || "").toLowerCase() === "confirmed"
  )

  const nextBooking = upcomingBookings[0] || null

  const firstName =
    profile?.full_name?.trim()?.split(" ")[0] || "Player"

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
        <div className="flex items-center gap-3">
          <div
            className="
              h-5 w-5 animate-spin rounded-full
              border-2 border-[#123B27]/20
              border-t-[#123B27]
              dark:border-white/20
              dark:border-t-[#B7E600]
            "
          />

          <span className="text-sm font-medium">
            Loading Sportiva...
          </span>
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
        <div
          className="
            mx-auto flex h-[72px] max-w-7xl
            items-center justify-between
            px-4 sm:px-6 lg:px-8
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl
                bg-[#123B27]
                text-[#B7E600]
              "
            >
              <span className="text-sm font-black italic">
                S
              </span>
            </div>

            <div>
              <p className="text-[15px] font-black tracking-[0.16em]">
                SPORTIVA
              </p>

              <p className="hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-black/35 sm:block dark:text-white/30">
                Art of Active Living
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="Open menu"
                className="
                  flex h-11 w-11 items-center justify-center
                  rounded-full
                  border border-black/[0.08]
                  bg-white/80
                  text-[#123B27]
                  transition
                  hover:bg-black/[0.04]
                  dark:border-white/[0.08]
                  dark:bg-white/[0.06]
                  dark:text-white
                  dark:hover:bg-white/[0.1]
                "
              >
                {menuOpen ? (
                  <X size={19} />
                ) : (
                  <MoreVertical size={19} />
                )}
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40"
                    aria-label="Close menu"
                  />

                  <div
                    className="
                      absolute right-0 top-14 z-50
                      w-56 rounded-2xl
                      border border-black/[0.08]
                      bg-white p-2
                      shadow-[0_20px_60px_rgba(0,0,0,0.14)]
                      dark:border-white/[0.08]
                      dark:bg-[#101915]
                    "
                  >
                    <MenuItem
                      icon={CalendarDays}
                      label="My Bookings"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate("/bookings")
                      }}
                    />

                    <MenuItem
                      icon={UserRound}
                      label="Profile"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate("/profile")
                      }}
                    />

                    <MenuItem
                      icon={Settings}
                      label="Settings"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate("/profile")
                      }}
                    />

                    <div className="my-1 border-t border-black/[0.06] dark:border-white/[0.06]" />

                    <MenuItem
                      icon={RefreshCw}
                      label="Refresh dashboard"
                      onClick={() => {
                        setMenuOpen(false)
                        loadDashboard(true)
                      }}
                    />

                    <MenuItem
                      icon={LogOut}
                      label="Logout"
                      danger
                      onClick={() => {
                        setMenuOpen(false)
                        logout()
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section
          className="
            flex flex-col gap-5
            border-b border-black/[0.07]
            pb-6
            sm:flex-row
            sm:items-end
            sm:justify-between
            dark:border-white/[0.07]
          "
        >
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/30">
              Member Dashboard
            </p>

            <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Welcome, {firstName}.
            </h1>

            <p className="mt-2 text-sm text-black/50 dark:text-white/45">
              Everything you need for your next game.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/book")}
            className="
              inline-flex h-12
              items-center justify-center gap-2
              rounded-xl
              bg-[#123B27]
              px-6
              text-xs font-black uppercase
              tracking-[0.12em]
              text-white
              shadow-[0_10px_30px_rgba(18,59,39,0.18)]
              transition
              hover:-translate-y-0.5
              hover:bg-[#174b31]
              active:translate-y-0
              dark:bg-[#B7E600]
              dark:text-[#102818]
              dark:hover:bg-[#C5F20A]
            "
          >
            <CalendarDays size={17} />
            Book a Turf
          </button>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={CalendarDays}
            label="Total bookings"
            value={bookings.length}
          />

          <StatCard
            icon={CheckCircle2}
            label="Confirmed"
            value={confirmedBookings.length}
          />

          <StatCard
            icon={Clock3}
            label="Upcoming"
            value={upcomingBookings.length}
          />

          <StatCard
            icon={Users}
            label="Active turfs"
            value={turfs.length}
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_0.75fr]">
          <div
            className="
              rounded-2xl
              border border-black/[0.07]
              bg-white
              p-5
              shadow-[0_8px_30px_rgba(18,59,39,0.04)]
              dark:border-white/[0.07]
              dark:bg-white/[0.04]
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/40 dark:text-white/30">
                  Next booking
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  {nextBooking
                    ? "Your upcoming session"
                    : "No upcoming session"}
                </h2>
              </div>

              {nextBooking && (
                <StatusBadge status={nextBooking.status} />
              )}
            </div>

            {nextBooking ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-2xl font-black tracking-tight">
                    {nextBooking.turfs?.name || "Sportiva Turf"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-black/50 dark:text-white/45">
                    <span className="flex items-center gap-2">
                      <CalendarDays size={15} />
                      {formatDate(nextBooking.booking_date)}
                    </span>

                    <span className="flex items-center gap-2">
                      <Clock3 size={15} />
                      {formatTime(nextBooking.start_time)} –{" "}
                      {formatTime(nextBooking.end_time)}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 dark:text-white/25">
                    Total
                  </p>

                  <p className="mt-1 text-xl font-black">
                    ৳
                    {Number(
                      nextBooking.total_amount || 0
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-black/[0.025] p-4 dark:bg-white/[0.035]">
                <p className="text-sm text-black/45 dark:text-white/40">
                  No upcoming booking. When you're ready, use the
                  Book a Turf action above.
                </p>
              </div>
            )}
          </div>

          <div
            className="
              rounded-2xl
              bg-[#123B27]
              p-5
              text-white
              shadow-[0_12px_35px_rgba(18,59,39,0.15)]
            "
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#B7E600]" />

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                Sportiva notice
              </p>
            </div>

            {announcement ? (
              <>
                <h2 className="mt-4 text-lg font-bold">
                  {announcement.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  {announcement.message}
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-lg font-bold">
                  Everything is ready.
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  Your Sportiva dashboard is ready for your next
                  session.
                </p>
              </>
            )}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/40 dark:text-white/30">
                Facility
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Available turfs
              </h2>
            </div>

            <span className="text-xs text-black/35 dark:text-white/30">
              {turfs.length} active
            </span>
          </div>

          {turfs.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {turfs.slice(0, 3).map((turf) => (
                <div
                  key={turf.id}
                  className="
                    overflow-hidden
                    rounded-2xl
                    border border-black/[0.07]
                    bg-white
                    shadow-[0_8px_30px_rgba(18,59,39,0.04)]
                    dark:border-white/[0.07]
                    dark:bg-white/[0.04]
                  "
                >
                  {turf.image_url ? (
                    <img
                      src={turf.image_url}
                      alt={turf.name}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center bg-[#123B27] text-[#B7E600]">
                      <span className="text-3xl font-black italic">
                        S
                      </span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">
                          {turf.name}
                        </h3>

                        {turf.description && (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-black/40 dark:text-white/35">
                            {turf.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black">
                          ৳
                          {Number(
                            turf.price_per_hour || 0
                          ).toLocaleString()}
                        </p>

                        <p className="text-[9px] uppercase tracking-wider text-black/30 dark:text-white/25">
                          / hour
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="
                rounded-2xl border border-dashed
                border-black/10 p-8 text-center
                dark:border-white/10
              "
            >
              <p className="text-sm text-black/40 dark:text-white/35">
                No active turfs are available right now.
              </p>
            </div>
          )}
        </section>

        <footer
          className="
            mt-5 flex flex-col gap-2
            border-t border-black/[0.06]
            pt-4
            text-[9px] font-bold uppercase
            tracking-[0.12em]
            text-black/25
            sm:flex-row sm:items-center
            sm:justify-between
            dark:border-white/[0.06]
            dark:text-white/20
          "
        >
          <span>FIFA Quality Surface</span>
          <span>27,000+ SFT</span>
          <span>Day & Night Play</span>
        </footer>
      </main>

      {refreshing && (
        <div
          className="
            fixed bottom-5 left-1/2 z-50
            flex -translate-x-1/2 items-center gap-2
            rounded-full
            border border-black/[0.08]
            bg-white/95
            px-4 py-2.5
            text-xs font-semibold
            text-black/60
            shadow-xl
            dark:border-white/[0.08]
            dark:bg-[#101915]/95
            dark:text-white/65
          "
        >
          <RefreshCw size={14} className="animate-spin" />
          Updating dashboard
        </div>
      )}
    </div>
  )
}

export default Dashboard