import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  MoreVertical,
  RefreshCw,
  Tag,
  X,
  XCircle,
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
      year: "numeric",
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

function isUpcoming(booking) {
  const status = String(booking?.status || "").toLowerCase()

  if (status === "cancelled") {
    return false
  }

  const dateTime = getBookingDateTime(booking)

  if (!dateTime) {
    return false
  }

  return dateTime >= new Date()
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase()

  if (normalized === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={12} />
        Confirmed
      </span>
    )
  }

  if (normalized === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
        <XCircle size={12} />
        Cancelled
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
      <Clock3 size={12} />
      Pending
    </span>
  )
}

function PaymentBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase()

  if (
    normalized === "paid" ||
    normalized === "success" ||
    normalized === "completed"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={12} />
        Paid
      </span>
    )
  }

  if (
    normalized === "failed" ||
    normalized === "cancelled"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
        <XCircle size={12} />
        Failed
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
      <Clock3 size={12} />
      Pending
    </span>
  )
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="
          mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center
          rounded-xl
          bg-[#123B27]/[0.07]
          text-[#123B27]
          dark:bg-[#B7E600]/10
          dark:text-[#B7E600]
        "
      >
        <Icon size={16} />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/30 dark:text-white/25">
          {label}
        </p>

        <div className="mt-1 text-sm font-semibold">
          {children}
        </div>
      </div>
    </div>
  )
}

function BookingDetailsModal({ booking, onClose }) {
  if (!booking) return null

  const subtotal =
    booking.subtotal ??
    booking.original_amount ??
    booking.turf_price ??
    booking.total_amount ??
    0

  const rewardDiscount =
    booking.community_discount ??
    booking.reward_discount ??
    0

  const couponDiscount =
    booking.coupon_discount ??
    0

  const paymentStatus =
    booking.payment_status ||
    booking.payments?.[0]?.status ||
    "pending"

  return (
    <div
      className="
        fixed inset-0 z-[60]
        flex items-end justify-center
        bg-black/45 p-0 backdrop-blur-sm
        sm:items-center sm:p-5
      "
      onMouseDown={onClose}
    >
      <div
        className="
          w-full max-w-lg
          max-h-[90vh]
          overflow-y-auto
          rounded-t-3xl
          border border-black/[0.08]
          bg-[#F6F7F3]
          p-5
          shadow-[0_30px_80px_rgba(0,0,0,0.25)]
          dark:border-white/[0.08]
          dark:bg-[#101915]
          sm:rounded-3xl
        "
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/30 dark:text-white/25">
              Booking details
            </p>

            <h2 className="mt-1 text-xl font-black">
              {booking.turfs?.name || "Sportiva Turf"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking details"
            className="
              flex h-9 w-9 items-center justify-center
              rounded-xl
              bg-black/[0.04]
              text-black/50
              transition
              hover:bg-black/[0.08]
              dark:bg-white/[0.06]
              dark:text-white/50
              dark:hover:bg-white/[0.1]
            "
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <DetailRow icon={CalendarDays} label="Date">
            {formatDate(booking.booking_date)}
          </DetailRow>

          <DetailRow icon={Clock3} label="Time">
            {formatTime(booking.start_time)} –{" "}
            {formatTime(booking.end_time)}
          </DetailRow>

          <DetailRow icon={MapPin} label="Facility">
            The Sportiva
          </DetailRow>

          <DetailRow icon={CreditCard} label="Payment">
            <PaymentBadge status={paymentStatus} />
          </DetailRow>
        </div>

        <div
          className="
            mt-6 rounded-2xl
            border border-black/[0.07]
            bg-white p-4
            dark:border-white/[0.07]
            dark:bg-white/[0.04]
          "
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-black/45 dark:text-white/40">
              Subtotal
            </span>

            <span className="text-sm font-semibold">
              ৳{Number(subtotal).toLocaleString()}
            </span>
          </div>

          {Number(rewardDiscount) > 0 && (
            <div className="mt-3 flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-2 text-sm">
                <Tag size={14} />
                Community reward
              </span>

              <span className="text-sm font-semibold">
                −৳{Number(rewardDiscount).toLocaleString()}
              </span>
            </div>
          )}

          {Number(couponDiscount) > 0 && (
            <div className="mt-3 flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-2 text-sm">
                <Tag size={14} />
                Coupon
                {booking.coupon_code
                  ? ` (${booking.coupon_code})`
                  : ""}
              </span>

              <span className="text-sm font-semibold">
                −৳{Number(couponDiscount).toLocaleString()}
              </span>
            </div>
          )}

          <div className="mt-4 border-t border-black/[0.06] pt-4 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                Total
              </span>

              <span className="text-xl font-black">
                ৳
                {Number(
                  booking.total_amount || 0
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-[10px] text-black/30 dark:text-white/25">
          <span>Booking #{booking.id}</span>

          <StatusBadge status={booking.status} />
        </div>
      </div>
    </div>
  )
}

function BookingCard({ booking, onDetails }) {
  const upcoming = isUpcoming(booking)

  const paymentStatus =
    booking.payment_status ||
    booking.payments?.[0]?.status ||
    "pending"

  const status = String(
    booking.status || ""
  ).toLowerCase()

  return (
    <article
      className={`
        relative overflow-visible rounded-2xl
        border
        bg-white
        p-5
        transition
        dark:bg-white/[0.04]
        ${
          upcoming
            ? "border-[#123B27]/15 shadow-[0_8px_30px_rgba(18,59,39,0.05)] dark:border-[#B7E600]/15"
            : "border-black/[0.07] dark:border-white/[0.07]"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {upcoming && (
              <span className="rounded-full bg-[#123B27]/[0.07] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#123B27] dark:bg-[#B7E600]/10 dark:text-[#B7E600]">
                Upcoming
              </span>
            )}

            {!upcoming &&
              status !== "cancelled" && (
                <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-black/40 dark:bg-white/[0.05] dark:text-white/35">
                  Completed
                </span>
              )}
          </div>

          <h2 className="mt-2 truncate text-lg font-black">
            {booking.turfs?.name || "Sportiva Turf"}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onDetails(booking)}
          aria-label="View booking details"
          className="
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-xl
            text-black/40
            transition
            hover:bg-black/[0.04]
            hover:text-black/70
            dark:text-white/40
            dark:hover:bg-white/[0.06]
            dark:hover:text-white
          "
        >
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <CalendarDays
            size={17}
            className="shrink-0 text-[#123B27] dark:text-[#B7E600]"
          />

          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/25">
              Date
            </p>

            <p className="mt-0.5 text-sm font-semibold">
              {formatDate(booking.booking_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock3
            size={17}
            className="shrink-0 text-[#123B27] dark:text-[#B7E600]"
          />

          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/25">
              Time
            </p>

            <p className="mt-0.5 text-sm font-semibold">
              {formatTime(booking.start_time)} –{" "}
              {formatTime(booking.end_time)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CreditCard
            size={17}
            className="shrink-0 text-[#123B27] dark:text-[#B7E600]"
          />

          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/25">
              Amount
            </p>

            <p className="mt-0.5 text-sm font-black">
              ৳
              {Number(
                booking.total_amount || 0
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-black/[0.06] pt-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[10px] text-black/30 dark:text-white/25">
          Booking #{booking.id}
        </span>

        <div className="flex items-center gap-3">
          <PaymentBadge status={paymentStatus} />
          <StatusBadge status={booking.status} />
        </div>
      </div>
    </article>
  )
}

function Bookings() {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [selectedBooking, setSelectedBooking] = useState(null)

  async function loadBookings(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate("/login", { replace: true })
        return
      }

      const { data, error: bookingsError } =
        await supabase
          .from("bookings")
          .select(`
            *,
            turfs (
              name
            ),
            payments (
              id,
              transaction_id,
              amount,
              payment_method,
              status,
              created_at
            )
          `)
          .eq("user_id", user.id)
          .order("booking_date", {
            ascending: false,
          })
          .order("start_time", {
            ascending: false,
          })

      if (bookingsError) {
        throw bookingsError
      }

      const normalizedBookings = (data || []).map(
        (booking) => {
          const payment =
            booking.payments?.[0] || null

          return {
            ...booking,
            payment_status:
              payment?.status || "pending",
            payment_method:
              payment?.payment_method || null,
            transaction_id:
              payment?.transaction_id || null,
          }
        }
      )

      setBookings(normalizedBookings)
    } catch (err) {
      console.error("Bookings error:", err)
      setError(
        "We couldn't load your bookings. Please try again."
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter(isUpcoming)
        .sort(
          (a, b) =>
            getBookingDateTime(a) -
            getBookingDateTime(b)
        ),
    [bookings]
  )

  const pastBookings = useMemo(
    () =>
      bookings
        .filter(
          (booking) => !isUpcoming(booking)
        )
        .sort(
          (a, b) =>
            getBookingDateTime(b) -
            getBookingDateTime(a)
        ),
    [bookings]
  )

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
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 dark:text-white/25">
              Account
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              My bookings
            </h1>

            <p className="mt-2 text-sm text-black/45 dark:text-white/40">
              Your complete Sportiva reservation history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadBookings(true)}
            disabled={refreshing}
            aria-label="Refresh bookings"
            className="
              inline-flex h-10 w-10 items-center justify-center
              self-start rounded-xl
              border border-black/[0.08]
              bg-white
              text-black/50
              transition
              hover:bg-black/[0.04]
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:border-white/[0.08]
              dark:bg-white/[0.04]
              dark:text-white/50
              dark:hover:bg-white/[0.08]
              sm:self-auto
            "
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm">
              <Loader2
                size={19}
                className="animate-spin"
              />
              Loading bookings...
            </div>
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/30 dark:text-white/25">
                    Schedule
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    Upcoming
                  </h2>
                </div>

                <span className="text-xs text-black/35 dark:text-white/30">
                  {upcomingBookings.length}
                </span>
              </div>

              {upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.map(
                    (booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onDetails={
                          setSelectedBooking
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div
                  className="
                    rounded-2xl
                    border border-dashed
                    border-black/10
                    bg-white/40
                    px-6 py-10
                    text-center
                    dark:border-white/10
                    dark:bg-white/[0.02]
                  "
                >
                  <CalendarDays
                    size={25}
                    className="mx-auto text-black/20 dark:text-white/20"
                  />

                  <p className="mt-3 text-sm text-black/40 dark:text-white/35">
                    You don't have any upcoming sessions.
                  </p>
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/30 dark:text-white/25">
                    History
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    Previous bookings
                  </h2>
                </div>

                <span className="text-xs text-black/35 dark:text-white/30">
                  {pastBookings.length}
                </span>
              </div>

              {pastBookings.length > 0 ? (
                <div className="space-y-3">
                  {pastBookings.map(
                    (booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onDetails={
                          setSelectedBooking
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div
                  className="
                    rounded-2xl
                    border border-dashed
                    border-black/10
                    px-6 py-10
                    text-center
                    dark:border-white/10
                  "
                >
                  <p className="text-sm text-black/40 dark:text-white/35">
                    Your previous bookings will appear here.
                  </p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div
            className="
              rounded-2xl
              border border-dashed
              border-black/10
              bg-white/50
              px-6 py-16
              text-center
              dark:border-white/10
              dark:bg-white/[0.02]
            "
          >
            <CalendarDays
              size={30}
              className="mx-auto text-black/20 dark:text-white/20"
            />

            <h2 className="mt-4 text-lg font-bold">
              No bookings yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-black/40 dark:text-white/35">
              Your turf reservations will appear here once you
              make your first booking.
            </p>

            <button
              type="button"
              onClick={() => navigate("/book")}
              className="
                mt-6 h-11 rounded-xl
                bg-[#123B27]
                px-5
                text-xs font-black uppercase
                tracking-[0.1em]
                text-white
                transition
                hover:bg-[#174b31]
                dark:bg-[#B7E600]
                dark:text-[#102818]
                dark:hover:bg-[#C5F20A]
              "
            >
              Book a Turf
            </button>
          </div>
        )}
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
          <RefreshCw
            size={14}
            className="animate-spin"
          />
          Updating bookings
        </div>
      )}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  )
}

export default Bookings