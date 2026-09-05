import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  ShieldCheck,
  Tag,
  Trophy,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import ThemeToggle from "../components/ThemeToggle";

function getLocalDate() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(dateString) {
  if (!dateString) return "";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    }
  );
}

function formatTime(time) {
  if (!time) return "";

  const [hour, minute] = time.split(":");
  const date = new Date();

  date.setHours(Number(hour), Number(minute), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isPastSlot(date, startTime) {
  if (!date || !startTime || date !== getLocalDate()) {
    return false;
  }

  const now = new Date();
  const [hour, minute] = startTime.split(":");

  const slotStart = new Date();

  slotStart.setHours(
    Number(hour),
    Number(minute),
    0,
    0
  );

  return slotStart <= now;
}

function TurfCard({ turf, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-2xl
        border text-left transition-all duration-200
        ${
          selected
            ? "border-[#B7E600] ring-2 ring-[#B7E600]/20"
            : "border-black/[0.07] hover:border-[#123B27]/20 dark:border-white/[0.07] dark:hover:border-white/20"
        }
        bg-white dark:bg-white/[0.04]
      `}
    >
      {turf.image_url ? (
        <img
          src={turf.image_url}
          alt={turf.name}
          className="h-36 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-36 items-center justify-center bg-[#123B27] text-[#B7E600]">
          <span className="text-4xl font-black italic">S</span>
        </div>
      )}

      {selected && (
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#B7E600] text-[#123B27] shadow-lg">
          <Check size={17} strokeWidth={3} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#123B27] dark:text-white">
              {turf.name}
            </h3>

            {turf.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-black/40 dark:text-white/35">
                {turf.description}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="font-black text-[#123B27] dark:text-white">
              ৳{Number(turf.price_per_hour || 0).toLocaleString()}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/25">
              / hour
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

function TimeSlot({ slot, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        rounded-xl border px-4 py-3 text-left transition
        ${
          disabled
            ? "cursor-not-allowed border-black/[0.05] bg-black/[0.025] opacity-40 dark:border-white/[0.04] dark:bg-white/[0.02]"
            : selected
              ? "border-[#123B27] bg-[#123B27] text-white shadow-[0_8px_20px_rgba(18,59,39,0.16)] dark:border-[#B7E600] dark:bg-[#B7E600] dark:text-[#102818]"
              : "border-black/[0.07] bg-white hover:border-[#123B27]/30 hover:bg-black/[0.02] dark:border-white/[0.07] dark:bg-white/[0.04] dark:hover:border-white/20"
        }
      `}
    >
      <div className="flex items-center gap-2">
        <Clock3 size={15} />
        <span className="text-sm font-semibold">
          {formatTime(slot.start_time)}
        </span>
      </div>

      <p
        className={`mt-1 text-[10px] ${
          selected
            ? "text-white/60 dark:text-[#102818]/60"
            : "text-black/35 dark:text-white/30"
        }`}
      >
        until {formatTime(slot.end_time)}
      </p>
    </button>
  );
}

const EMPTY_PRICING = {
  subtotal: 0,
  community_offer_id: null,
  community_offer_title: null,
  community_discount: 0,
  coupon_id: null,
  coupon_code: null,
  coupon_discount: 0,
  final_amount: 0,
  message: "No discount applied",
};

function Book() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [turfs, setTurfs] = useState([]);
  const [slots, setSlots] = useState([]);

  const [selectedTurf, setSelectedTurf] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");

  const [pricing, setPricing] = useState(EMPTY_PRICING);

  const selectedPrice = useMemo(
    () => Number(selectedTurf?.price_per_hour || 0),
    [selectedTurf]
  );

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      if (!currentUser.email_confirmed_at) {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
        return;
      }

      setUser(currentUser);

      const { data, error: turfError } = await supabase
        .from("turfs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (turfError) throw turfError;

      setTurfs(data || []);

      if (data?.length) {
        setSelectedTurf(data[0]);
      }
    } catch (err) {
      console.error("Turf loading error:", err);
      setError(
        "We couldn't load the Sportiva turfs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots() {
    if (!selectedTurf || !selectedDate) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot(null);
    setError("");
    setPricing(EMPTY_PRICING);

    try {
      const { data, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("turf_id", selectedTurf.id)
        .eq("slot_date", selectedDate)
        .order("start_time", { ascending: true });

      if (slotsError) throw slotsError;

      setSlots(data || []);
    } catch (err) {
      console.error("Slot loading error:", err);
      setSlots([]);
      setError(
        "We couldn't load the available time slots."
      );
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadSlots();
  }, [selectedTurf, selectedDate]);

  async function calculatePrice(code = "") {
    if (!user || !selectedTurf) return;

    setCalculatingPrice(true);
    setCouponMessage("");

    try {
      const { data, error: priceError } = await supabase.rpc(
        "calculate_booking_price",
        {
          member_id: user.id,
          turf_price: selectedPrice,
          coupon_code_input: code?.trim() || null,
        }
      );

      if (priceError) throw priceError;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result) {
        throw new Error("Unable to calculate the booking price.");
      }

      const nextPricing = {
        subtotal: Number(result.subtotal || 0),
        community_offer_id:
          result.community_offer_id || null,
        community_offer_title:
          result.community_offer_title || null,
        community_discount:
          Number(result.community_discount || 0),
        coupon_id: result.coupon_id || null,
        coupon_code: result.coupon_code || null,
        coupon_discount:
          Number(result.coupon_discount || 0),
        final_amount:
          Number(result.final_amount || 0),
        message:
          result.message || "No discount applied",
      };

      setPricing(nextPricing);

      if (
        code?.trim() &&
        result.coupon_id &&
        Number(result.coupon_discount || 0) > 0
      ) {
        setCouponApplied(true);
        setCouponMessage(
          `Coupon ${result.coupon_code} applied successfully.`
        );
      } else if (code?.trim()) {
        setCouponApplied(false);
        setCouponMessage(
          result.message || "This coupon could not be applied."
        );
      } else {
        setCouponApplied(false);
      }
    } catch (err) {
      console.error("Price calculation error:", err);
      setCouponApplied(false);
      setPricing(EMPTY_PRICING);
      setCouponMessage(
        "We couldn't validate the discount right now."
      );
    } finally {
      setCalculatingPrice(false);
    }
  }

  useEffect(() => {
    if (!user || !selectedTurf) return;
    calculatePrice("");
  }, [user, selectedTurf]);

  useEffect(() => {
    if (!user || !selectedTurf || !selectedSlot) return;
    calculatePrice(couponInput);
  }, [selectedSlot]);

  function handleCouponApply() {
    const code = couponInput.trim();

    if (!code) {
      setCouponMessage("Enter a coupon code first.");
      setCouponApplied(false);
      return;
    }

    calculatePrice(code);
  }

  function handleCouponRemove() {
    setCouponInput("");
    setCouponApplied(false);
    setCouponMessage("");
    calculatePrice("");
  }

  async function handleBooking() {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!selectedTurf || !selectedSlot) {
      setError("Please select a turf and a time slot.");
      return;
    }

    if (
      !selectedSlot.is_available ||
      isPastSlot(selectedDate, selectedSlot.start_time)
    ) {
      setError(
        "This time slot is no longer available. Please choose another slot."
      );
      await loadSlots();
      return;
    }

    setBooking(true);
    setError("");

    try {
      const { data, error: bookingError } =
        await supabase.rpc("create_booking", {
          member_id: user.id,
          selected_slot_id: selectedSlot.id,
          coupon_code_input:
            couponApplied && couponInput.trim()
              ? couponInput.trim()
              : null,
        });

      if (bookingError) throw bookingError;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result) {
        throw new Error(
          "The booking could not be completed."
        );
      }

      setPricing({
        subtotal: Number(result.subtotal || 0),
        community_offer_id:
          result.community_offer_id || null,
        community_offer_title:
          result.community_offer_title || null,
        community_discount:
          Number(result.community_discount || 0),
        coupon_id: result.coupon_id || null,
        coupon_code: result.coupon_code || null,
        coupon_discount:
          Number(result.coupon_discount || 0),
        final_amount:
          Number(result.final_amount || 0),
        message:
          result.message || "Booking created successfully.",
      });

      setSlots((current) =>
        current.map((slot) =>
          slot.id === selectedSlot.id
            ? { ...slot, is_available: false }
            : slot
        )
      );

      setSuccess(true);
    } catch (err) {
      console.error("Booking error:", err);

      const message = String(
        err?.message || ""
      ).toLowerCase();

      if (
        message.includes("no longer available") ||
        message.includes("already been booked") ||
        message.includes("already booked")
      ) {
        setError(
          "This slot is no longer available. Please choose another slot."
        );
        await loadSlots();
      } else if (
        message.includes("already passed") ||
        message.includes("past")
      ) {
        setError(
          "This time slot has already passed. Please choose another slot."
        );
        await loadSlots();
      } else {
        setError(
          err?.message ||
            "Something went wrong while creating your booking."
        );
      }
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7F3] text-[#123B27] dark:bg-[#0B110E] dark:text-white">
        <div className="flex items-center gap-3">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">
            Preparing your booking...
          </span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F6F7F3] text-[#123B27] dark:bg-[#0B110E] dark:text-white">
        <header className="border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B27] text-[#B7E600]">
                <span className="text-sm font-black italic">S</span>
              </div>

              <p className="text-[15px] font-black tracking-[0.16em]">
                SPORTIVA
              </p>
            </div>

            <ThemeToggle />
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={42} strokeWidth={1.8} />
            </div>

            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/30">
              Booking request received
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Booking submitted.
            </h1>

            <p className="mt-3 text-sm leading-6 text-black/50 dark:text-white/45">
              Your Sportiva booking has been created and is
              currently pending confirmation.
            </p>

            <div className="mt-6 rounded-2xl border border-black/[0.07] bg-white p-5 text-left dark:border-white/[0.07] dark:bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/40 dark:text-white/35">
                  Turf
                </span>
                <span className="text-sm font-bold">
                  {selectedTurf?.name}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-black/40 dark:text-white/35">
                  Date
                </span>
                <span className="text-sm font-bold">
                  {formatDate(selectedDate)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-black/40 dark:text-white/35">
                  Time
                </span>
                <span className="text-sm font-bold">
                  {formatTime(selectedSlot?.start_time)} –{" "}
                  {formatTime(selectedSlot?.end_time)}
                </span>
              </div>

              <div className="my-4 border-t border-black/[0.06] dark:border-white/[0.06]" />

              <div className="flex items-center justify-between">
                <span className="text-xs text-black/40 dark:text-white/35">
                  Subtotal
                </span>
                <span className="text-sm font-semibold">
                  ৳{pricing.subtotal.toLocaleString()}
                </span>
              </div>

              {pricing.community_discount > 0 && (
                <div className="mt-2 flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="text-xs font-semibold">
                    {pricing.community_offer_title ||
                      "Member reward"}
                  </span>
                  <span className="text-sm font-bold">
                    −৳{pricing.community_discount.toLocaleString()}
                  </span>
                </div>
              )}

              {pricing.coupon_discount > 0 && (
                <div className="mt-2 flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="text-xs font-semibold">
                    Coupon
                    {pricing.coupon_code
                      ? ` (${pricing.coupon_code})`
                      : ""}
                  </span>
                  <span className="text-sm font-bold">
                    −৳{pricing.coupon_discount.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="mt-4 border-t border-black/[0.06] pt-4 dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-black/40 dark:text-white/35">
                    Total payable
                  </span>
                  <span className="text-lg font-black">
                    ৳{pricing.final_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-xs leading-5 text-amber-700 dark:text-amber-300">
              Payment integration will be connected to this
              booking flow. Until then, the booking remains
              pending admin confirmation.
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-6 h-12 w-full rounded-xl bg-[#123B27] text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#174b31] dark:bg-[#B7E600] dark:text-[#102818]"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F3] text-[#123B27] dark:bg-[#0B110E] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#F6F7F3]/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0B110E]/90">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-black/60 transition hover:text-[#123B27] dark:text-white/55 dark:hover:text-white"
          >
            <ArrowLeft size={17} />
            Dashboard
          </button>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123B27] text-[#B7E600]">
              <span className="text-xs font-black italic">S</span>
            </div>

            <span className="text-sm font-black tracking-[0.16em]">
              SPORTIVA
            </span>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <section className="mb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/30">
            Turf Reservation
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Book your game.
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-black/50 dark:text-white/45">
            Choose your preferred turf, date and playing time.
          </p>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section>
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35 dark:text-white/30">
                  01
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  Select your turf
                </h2>
              </div>

              {turfs.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {turfs.map((turf) => (
                    <TurfCard
                      key={turf.id}
                      turf={turf}
                      selected={selectedTurf?.id === turf.id}
                      onClick={() => {
                        setSelectedTurf(turf);
                        setSelectedSlot(null);
                        setCouponApplied(false);
                        setCouponMessage("");
                        setPricing(EMPTY_PRICING);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center dark:border-white/10">
                  <p className="text-sm text-black/45 dark:text-white/40">
                    No active turfs are available.
                  </p>
                </div>
              )}
            </section>

            <section>
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35 dark:text-white/30">
                  02
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  Choose a date
                </h2>
              </div>

              <div className="relative flex items-center rounded-2xl border border-black/[0.07] bg-white px-4 dark:border-white/[0.07] dark:bg-white/[0.04]">
                <CalendarDays
                  size={18}
                  className="text-[#123B27] dark:text-[#B7E600]"
                />

                <input
                  type="date"
                  value={selectedDate}
                  min={getLocalDate()}
                  onChange={(event) =>
                    setSelectedDate(event.target.value)
                  }
                  className="h-14 w-full bg-transparent px-3 text-sm font-semibold outline-none [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </section>

            <section>
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35 dark:text-white/30">
                  03
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  Select a playing time
                </h2>
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center rounded-2xl border border-black/[0.07] bg-white p-10 dark:border-white/[0.07] dark:bg-white/[0.04]">
                  <Loader2
                    size={20}
                    className="animate-spin text-[#123B27] dark:text-[#B7E600]"
                  />
                </div>
              ) : slots.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {slots.map((slot) => {
                    const unavailable =
                      !slot.is_available ||
                      isPastSlot(
                        selectedDate,
                        slot.start_time
                      );

                    return (
                      <TimeSlot
                        key={slot.id}
                        slot={slot}
                        selected={selectedSlot?.id === slot.id}
                        disabled={unavailable}
                        onClick={() =>
                          !unavailable &&
                          setSelectedSlot(slot)
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center dark:border-white/10">
                  <Clock3
                    size={22}
                    className="mx-auto text-black/25 dark:text-white/20"
                  />

                  <p className="mt-3 text-sm font-semibold">
                    No slots available
                  </p>

                  <p className="mt-1 text-xs text-black/40 dark:text-white/35">
                    Try another date or turf.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside>
            <div className="sticky top-[96px] overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_15px_50px_rgba(18,59,39,0.07)] dark:border-white/[0.07] dark:bg-white/[0.04]">
              <div className="bg-[#123B27] p-5 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Booking summary
                </p>
                <h2 className="mt-2 text-xl font-black">
                  Your session
                </h2>
              </div>

              <div className="p-5">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={17}
                      className="mt-0.5 shrink-0 text-[#123B27] dark:text-[#B7E600]"
                    />

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-black/30 dark:text-white/25">
                        Turf
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {selectedTurf?.name || "Select a turf"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarDays
                      size={17}
                      className="mt-0.5 shrink-0 text-[#123B27] dark:text-[#B7E600]"
                    />

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-black/30 dark:text-white/25">
                        Date
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {formatDate(selectedDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock3
                      size={17}
                      className="mt-0.5 shrink-0 text-[#123B27] dark:text-[#B7E600]"
                    />

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-black/30 dark:text-white/25">
                        Time
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {selectedSlot
                          ? `${formatTime(
                              selectedSlot.start_time
                            )} – ${formatTime(
                              selectedSlot.end_time
                            )}`
                          : "Select a time"}
                      </p>
                    </div>
                  </div>
                </div>

                {pricing.community_discount > 0 && (
                  <div className="mt-5 rounded-xl border border-[#B7E600]/30 bg-[#B7E600]/10 p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#B7E600] text-[#123B27]">
                        <Trophy size={17} />
                      </div>

                      <div>
                        <p className="text-xs font-black">
                          Reward unlocked
                        </p>

                        <p className="mt-0.5 text-[10px] leading-4 text-black/50 dark:text-white/45">
                          {pricing.community_offer_title ||
                            "Your member reward has been applied automatically."}
                        </p>

                        <p className="mt-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                          −৳
                          {pricing.community_discount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Tag
                      size={14}
                      className="text-[#123B27] dark:text-[#B7E600]"
                    />
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/40 dark:text-white/30">
                      Coupon code
                    </p>
                  </div>

                  {!couponApplied ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(event) => {
                          setCouponInput(
                            event.target.value.toUpperCase()
                          );
                          setCouponMessage("");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleCouponApply();
                          }
                        }}
                        placeholder="ENTER CODE"
                        className="min-w-0 flex-1 h-11 rounded-xl border border-black/[0.08] bg-black/[0.02] px-3 text-xs font-bold uppercase outline-none focus:border-[#123B27]/30 dark:border-white/[0.08] dark:bg-white/[0.04] dark:focus:border-[#B7E600]/40"
                      />

                      <button
                        type="button"
                        onClick={handleCouponApply}
                        disabled={
                          calculatingPrice ||
                          !couponInput.trim()
                        }
                        className="h-11 shrink-0 rounded-xl bg-[#123B27] px-4 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-[#174b31] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#B7E600] dark:text-[#102818]"
                      >
                        {calculatingPrice ? (
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Check
                          size={15}
                          className="text-emerald-500"
                        />
                        <span className="text-xs font-black">
                          {pricing.coupon_code}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCouponRemove}
                        className="rounded-lg p-1.5 text-black/40 transition hover:bg-black/[0.05] hover:text-black dark:text-white/35 dark:hover:bg-white/[0.06] dark:hover:text-white"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}

                  {couponMessage && (
                    <p
                      className={`mt-2 text-[10px] leading-4 ${
                        couponApplied
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      {couponMessage}
                    </p>
                  )}
                </div>

                <div className="my-5 border-t border-black/[0.07] dark:border-white/[0.07]" />

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-black/40 dark:text-white/35">
                      Subtotal
                    </span>
                    <span className="text-sm font-semibold">
                      ৳{pricing.subtotal.toLocaleString()}
                    </span>
                  </div>

                  {pricing.community_discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <Trophy size={12} />
                        Member reward
                      </span>

                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        −৳
                        {pricing.community_discount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {pricing.coupon_discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <Tag size={12} />
                        Coupon
                      </span>

                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        −৳
                        {pricing.coupon_discount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-black/[0.06] pt-3 dark:border-white/[0.06]">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-black/30 dark:text-white/25">
                          Total payable
                        </p>

                        <p className="mt-1 text-2xl font-black">
                          ৳
                          {pricing.final_amount.toLocaleString()}
                        </p>
                      </div>

                      <span className="text-[10px] text-black/30 dark:text-white/25">
                        / 1 hour
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    booking ||
                    calculatingPrice ||
                    !selectedTurf ||
                    !selectedSlot
                  }
                  onClick={handleBooking}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123B27] text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#174b31] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#B7E600] dark:text-[#102818] dark:hover:bg-[#C5F20A]"
                >
                  {booking ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Confirm Booking
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-start gap-2">
                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />

                  <p className="text-[10px] leading-4 text-black/35 dark:text-white/30">
                    Your price is calculated securely on the
                    Sportiva database before the booking is created.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Book;