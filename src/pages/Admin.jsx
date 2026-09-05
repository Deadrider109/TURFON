import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  Edit3,
  Gift,
  LayoutDashboard,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  TicketPercent,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "./Admin.css";

const NAVIGATION = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "turfs",
    label: "Turfs",
    icon: Trophy,
  },
  {
    id: "slots",
    label: "Time Slots",
    icon: CalendarDays,
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: ClipboardList,
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
  },
  {
    id: "rewards",
    label: "Rewards",
    icon: Gift,
  },
  {
    id: "coupons",
    label: "Coupons",
    icon: TicketPercent,
  },
  {
    id: "announcements",
    label: "Announcements",
    icon: Megaphone,
  },
];

const EMPTY_TURF = {
  name: "",
  description: "",
  price_per_hour: "",
  image_url: "",
};

const EMPTY_SLOT = {
  turf_id: "",
  slot_date: "",
  start_time: "",
  end_time: "",
  is_available: true,
};

const EMPTY_COUPON = {
  code: "",
  title: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  min_booking_amount: "0",
  max_discount_amount: "",
  usage_limit: "",
  per_user_limit: "1",
  starts_at: "",
  expires_at: "",
  is_active: true,
};

const EMPTY_ANNOUNCEMENT = {
  title: "",
  message: "",
};

function formatDate(date) {
  if (!date) return "—";

  const value = new Date(`${date}T00:00:00`);

  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(value) {
  if (!value) return "—";

  const parts = String(value).split(":");
  const hour = Number(parts[0]);
  const minute = parts[1] || "00";

  if (!Number.isFinite(hour)) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function formatInputDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);

  return local.toISOString().slice(0, 16);
}

function toISOStringOrNull(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function generateCouponCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "SPORTIVA-";

  for (let index = 0; index < 6; index += 1) {
    code +=
      characters[
        Math.floor(
          Math.random() * characters.length
        )
      ];
  }

  return code;
}

function StatusBadge({ type = "neutral", children }) {
  return (
    <span className={`admin-status ${type}`}>
      {children}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">
        <Icon size={18} />
      </div>

      <div className="admin-stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function Modal({
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
}) {
  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`admin-modal ${
          wide ? "admin-modal-wide" : ""
        }`}
      >
        <div className="admin-modal-header">
          <div>
            <span>{eyebrow}</span>
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default function Admin() {
  const [activeSection, setActiveSection] =
    useState("overview");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const [turfs, setTurfs] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [coupons, setCoupons] = useState([]);
  const [couponUsages, setCouponUsages] = useState([]);

  const [memberRewards, setMemberRewards] = useState([]);
  const [rewardCheckpoints, setRewardCheckpoints] =
    useState([]);
  const [communityOffers, setCommunityOffers] =
    useState([]);
  const [rewardTransactions, setRewardTransactions] =
    useState([]);
  const [rewardRedemptions, setRewardRedemptions] =
    useState([]);

  const [rewardSection, setRewardSection] =
    useState("members");

  const [turfSearch, setTurfSearch] = useState("");
  const [slotSearch, setSlotSearch] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotTurf, setSlotTurf] = useState("all");

  const [bookingSearch, setBookingSearch] =
    useState("");
  const [bookingStatus, setBookingStatus] =
    useState("all");

  const [userSearch, setUserSearch] = useState("");
  const [couponSearch, setCouponSearch] =
    useState("");

  const [showTurfModal, setShowTurfModal] =
    useState(false);
  const [editingTurf, setEditingTurf] = useState(null);
  const [turfForm, setTurfForm] =
    useState(EMPTY_TURF);

  const [showSlotModal, setShowSlotModal] =
    useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] =
    useState(EMPTY_SLOT);

  const [showCouponModal, setShowCouponModal] =
    useState(false);
  const [editingCoupon, setEditingCoupon] =
    useState(null);
  const [couponForm, setCouponForm] =
    useState(EMPTY_COUPON);

  const [showAnnouncementModal, setShowAnnouncementModal] =
    useState(false);
  const [announcementForm, setAnnouncementForm] =
    useState(EMPTY_ANNOUNCEMENT);

  const [showPointsModal, setShowPointsModal] =
    useState(false);
  const [selectedMember, setSelectedMember] =
    useState(null);
  const [pointsAmount, setPointsAmount] =
    useState("");
  const [pointsReason, setPointsReason] =
    useState("");

  const [saving, setSaving] = useState(false);

  function notify(text) {
    setMessage(text);

    window.clearTimeout(notify.timeout);

    notify.timeout = window.setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  async function loadData(options = {}) {
    const isRefresh = Boolean(options.refresh);

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const results = await Promise.all([
        supabase
          .from("turfs")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("time_slots")
          .select("*, turfs(name)")
          .order("slot_date", {
            ascending: true,
          })
          .order("start_time", {
            ascending: true,
          }),

        supabase
          .from("bookings")
          .select(
            "*, turfs(name), profiles(full_name, phone, email)"
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("profiles")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("announcements")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("coupons")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("coupon_usages")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("member_rewards")
          .select("*")
          .order("points", {
            ascending: false,
          }),

        supabase
          .from("reward_checkpoints")
          .select("*")
          .order("points_required", {
            ascending: true,
          }),

        supabase
          .from("community_offers")
          .select("*")
          .order("required_points", {
            ascending: true,
          }),

        supabase
          .from("reward_transactions")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .limit(200),

        supabase
          .from("reward_redemptions")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .limit(200),
      ]);

      const [
        turfsResult,
        slotsResult,
        bookingsResult,
        usersResult,
        announcementsResult,
        couponsResult,
        usagesResult,
        rewardsResult,
        checkpointsResult,
        offersResult,
        transactionsResult,
        redemptionsResult,
      ] = results;

      if (!turfsResult.error) {
        setTurfs(turfsResult.data || []);
      }

      if (!slotsResult.error) {
        setSlots(slotsResult.data || []);
      }

      if (!bookingsResult.error) {
        setBookings(bookingsResult.data || []);
      }

      if (!usersResult.error) {
        setUsers(usersResult.data || []);
      }

      if (!announcementsResult.error) {
        setAnnouncements(
          announcementsResult.data || []
        );
      }

      if (!couponsResult.error) {
        setCoupons(couponsResult.data || []);
      } else {
        console.error(
          "Coupons:",
          couponsResult.error
        );
      }

      if (!usagesResult.error) {
        setCouponUsages(usagesResult.data || []);
      }

      if (!rewardsResult.error) {
        setMemberRewards(
          rewardsResult.data || []
        );
      }

      if (!checkpointsResult.error) {
        setRewardCheckpoints(
          checkpointsResult.data || []
        );
      }

      if (!offersResult.error) {
        setCommunityOffers(
          offersResult.data || []
        );
      }

      if (!transactionsResult.error) {
        setRewardTransactions(
          transactionsResult.data || []
        );
      }

      if (!redemptionsResult.error) {
        setRewardRedemptions(
          redemptionsResult.data || []
        );
      }
    } catch (error) {
      console.error(error);
      notify(
        error.message ||
          "Unable to load admin dashboard."
      );
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("sportiva-admin-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => loadData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "time_slots",
        },
        () => loadData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coupons",
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ============================================================
  // TURFS
  // ============================================================

  function createTurf() {
    setEditingTurf(null);
    setTurfForm(EMPTY_TURF);
    setShowTurfModal(true);
  }

  function editTurf(turf) {
    setEditingTurf(turf);

    setTurfForm({
      name: turf.name || "",
      description: turf.description || "",
      price_per_hour:
        turf.price_per_hour ?? "",
      image_url: turf.image_url || "",
    });

    setShowTurfModal(true);
  }

  async function saveTurf(event) {
    event.preventDefault();

    if (!turfForm.name.trim()) {
      notify("Turf name is required.");
      return;
    }

    if (
      !turfForm.price_per_hour ||
      Number(turfForm.price_per_hour) <= 0
    ) {
      notify("Enter a valid price.");
      return;
    }

    setSaving(true);

    const payload = {
      name: turfForm.name.trim(),
      description:
        turfForm.description.trim() || null,
      price_per_hour: Number(
        turfForm.price_per_hour
      ),
      image_url:
        turfForm.image_url.trim() || null,
    };

    const result = editingTurf
      ? await supabase
          .from("turfs")
          .update(payload)
          .eq("id", editingTurf.id)
      : await supabase.from("turfs").insert([
          {
            ...payload,
            is_active: true,
          },
        ]);

    setSaving(false);

    if (result.error) {
      notify(result.error.message);
      return;
    }

    setShowTurfModal(false);
    setEditingTurf(null);
    setTurfForm(EMPTY_TURF);

    notify(
      editingTurf
        ? "Turf updated."
        : "Turf created."
    );

    await loadData();
  }

  async function toggleTurf(turf) {
    const { error } = await supabase
      .from("turfs")
      .update({
        is_active: !turf.is_active,
      })
      .eq("id", turf.id);

    if (error) {
      notify(error.message);
      return;
    }

    notify(
      turf.is_active
        ? "Turf disabled."
        : "Turf activated."
    );

    await loadData();
  }

  async function deleteTurf(turf) {
    if (
      !window.confirm(
        `Delete "${turf.name}"?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("turfs")
      .delete()
      .eq("id", turf.id);

    if (error) {
      notify(error.message);
      return;
    }

    notify("Turf deleted.");
    await loadData();
  }

  // ============================================================
  // SLOTS
  // ============================================================

  function createSlot() {
    setEditingSlot(null);

    setSlotForm({
      ...EMPTY_SLOT,
      turf_id: turfs[0]?.id
        ? String(turfs[0].id)
        : "",
      slot_date: new Date()
        .toISOString()
        .slice(0, 10),
    });

    setShowSlotModal(true);
  }

  function editSlot(slot) {
    setEditingSlot(slot);

    setSlotForm({
      turf_id: String(
        slot.turf_id || ""
      ),
      slot_date: slot.slot_date || "",
      start_time: String(
        slot.start_time || ""
      ).slice(0, 5),
      end_time: String(
        slot.end_time || ""
      ).slice(0, 5),
      is_available:
        slot.is_available ?? true,
    });

    setShowSlotModal(true);
  }

  async function saveSlot(event) {
    event.preventDefault();

    if (
      !slotForm.turf_id ||
      !slotForm.slot_date ||
      !slotForm.start_time ||
      !slotForm.end_time
    ) {
      notify("Complete all slot fields.");
      return;
    }

    if (
      slotForm.end_time <=
      slotForm.start_time
    ) {
      notify("End time must be after start time.");
      return;
    }

    setSaving(true);

    const payload = {
      turf_id: Number(slotForm.turf_id),
      slot_date: slotForm.slot_date,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      is_available: Boolean(
        slotForm.is_available
      ),
    };

    const result = editingSlot
      ? await supabase
          .from("time_slots")
          .update(payload)
          .eq("id", editingSlot.id)
      : await supabase
          .from("time_slots")
          .insert([payload]);

    setSaving(false);

    if (result.error) {
      notify(result.error.message);
      return;
    }

    setShowSlotModal(false);
    setEditingSlot(null);
    setSlotForm(EMPTY_SLOT);

    notify(
      editingSlot
        ? "Time slot updated."
        : "Time slot created."
    );

    await loadData();
  }

  async function toggleSlot(slot) {
    const { error } = await supabase
      .from("time_slots")
      .update({
        is_available: !slot.is_available,
      })
      .eq("id", slot.id);

    if (error) {
      notify(error.message);
      return;
    }

    notify(
      slot.is_available
        ? "Slot disabled."
        : "Slot enabled."
    );

    await loadData();
  }

  async function deleteSlot(slot) {
    if (
      !window.confirm(
        "Delete this time slot?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("time_slots")
      .delete()
      .eq("id", slot.id);

    if (error) {
      notify(error.message);
      return;
    }

    notify("Time slot deleted.");
    await loadData();
  }

  // ============================================================
  // BOOKINGS
  // ============================================================

  async function setBookingStatus(
    booking,
    status
  ) {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", booking.id);

    if (error) {
      notify(error.message);
      return;
    }

    notify(
      status === "confirmed"
        ? "Booking confirmed."
        : "Booking cancelled."
    );

    await loadData();
  }

  // ============================================================
  // COUPONS
  // ============================================================

  function createCoupon() {
    setEditingCoupon(null);

    setCouponForm({
      ...EMPTY_COUPON,
      code: generateCouponCode(),
    });

    setShowCouponModal(true);
  }

  function editCoupon(coupon) {
    setEditingCoupon(coupon);

    setCouponForm({
      code: coupon.code || "",
      title: coupon.title || "",
      description: coupon.description || "",
      discount_type:
        coupon.discount_type ||
        "percentage",
      discount_value:
        coupon.discount_value ?? "",
      min_booking_amount:
        coupon.min_booking_amount ?? "0",
      max_discount_amount:
        coupon.max_discount_amount ?? "",
      usage_limit:
        coupon.usage_limit ?? "",
      per_user_limit:
        coupon.per_user_limit ?? "1",
      starts_at: formatInputDateTime(
        coupon.starts_at
      ),
      expires_at: formatInputDateTime(
        coupon.expires_at
      ),
      is_active:
        coupon.is_active ?? true,
    });

    setShowCouponModal(true);
  }

  async function saveCoupon(event) {
    event.preventDefault();

    const code = couponForm.code
      .trim()
      .toUpperCase();

    const discountValue = Number(
      couponForm.discount_value
    );

    if (!code) {
      notify("Coupon code is required.");
      return;
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      notify("Enter a valid discount.");
      return;
    }

    if (
      couponForm.discount_type ===
        "percentage" &&
      discountValue > 100
    ) {
      notify(
        "Percentage discount cannot exceed 100%."
      );
      return;
    }

    if (
      couponForm.starts_at &&
      couponForm.expires_at &&
      new Date(couponForm.expires_at) <=
        new Date(couponForm.starts_at)
    ) {
      notify(
        "Expiry must be after the start date."
      );
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      code,
      title:
        couponForm.title.trim() || code,
      description:
        couponForm.description.trim() ||
        null,
      discount_type:
        couponForm.discount_type,
      discount_value: discountValue,
      min_booking_amount: Number(
        couponForm.min_booking_amount || 0
      ),
      max_discount_amount:
        couponForm.discount_type ===
          "percentage" &&
        couponForm.max_discount_amount
          ? Number(
              couponForm.max_discount_amount
            )
          : null,
      usage_limit: couponForm.usage_limit
        ? Number(couponForm.usage_limit)
        : null,
      per_user_limit: Number(
        couponForm.per_user_limit || 1
      ),
      starts_at: toISOStringOrNull(
        couponForm.starts_at
      ),
      expires_at: toISOStringOrNull(
        couponForm.expires_at
      ),
      is_active: Boolean(
        couponForm.is_active
      ),
    };

    const result = editingCoupon
      ? await supabase
          .from("coupons")
          .update(payload)
          .eq("id", editingCoupon.id)
      : await supabase.from("coupons").insert([
          {
            ...payload,
            created_by: user?.id || null,
          },
        ]);

    setSaving(false);

    if (result.error) {
      const text =
        result.error.message?.toLowerCase() ||
        "";

      if (
        text.includes("duplicate") ||
        text.includes("unique")
      ) {
        notify(
          "That coupon code already exists."
        );
      } else {
        notify(result.error.message);
      }

      return;
    }

    setShowCouponModal(false);
    setEditingCoupon(null);
    setCouponForm(EMPTY_COUPON);

    notify(
      editingCoupon
        ? "Coupon updated."
        : "Coupon created."
    );

    await loadData();
  }

  async function toggleCoupon(coupon) {
    const { error } = await supabase
      .from("coupons")
      .update({
        is_active: !coupon.is_active,
      })
      .eq("id", coupon.id);

    if (error) {
      notify(error.message);
      return;
    }

    notify(
      coupon.is_active
        ? "Coupon disabled."
        : "Coupon activated."
    );

    await loadData();
  }

  async function deleteCoupon(coupon) {
    if (
      !window.confirm(
        `Delete "${coupon.code}"?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", coupon.id);

    if (error) {
      notify(error.message);
      return;
    }

    notify("Coupon deleted.");
    await loadData();
  }

  async function copyCoupon(code) {
    try {
      await navigator.clipboard.writeText(code);
      notify(`${code} copied.`);
    } catch {
      notify("Could not copy coupon.");
    }
  }

  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================

  async function createAnnouncement(event) {
    event.preventDefault();

    if (!announcementForm.title.trim()) {
      notify("Announcement title is required.");
      return;
    }

    const { error } = await supabase
      .from("announcements")
      .insert([
        {
          title:
            announcementForm.title.trim(),
          message:
            announcementForm.message.trim() ||
            null,
          is_active: true,
        },
      ]);

    if (error) {
      notify(error.message);
      return;
    }

    setShowAnnouncementModal(false);
    setAnnouncementForm(
      EMPTY_ANNOUNCEMENT
    );

    notify("Announcement published.");
    await loadData();
  }

  async function toggleAnnouncement(
    announcement
  ) {
    const { error } = await supabase
      .from("announcements")
      .update({
        is_active: !announcement.is_active,
      })
      .eq("id", announcement.id);

    if (error) {
      notify(error.message);
      return;
    }

    notify(
      announcement.is_active
        ? "Announcement disabled."
        : "Announcement activated."
    );

    await loadData();
  }

  async function deleteAnnouncement(
    announcement
  ) {
    if (
      !window.confirm(
        "Delete this announcement?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id);

    if (error) {
      notify(error.message);
      return;
    }

    notify("Announcement deleted.");
    await loadData();
  }

  // ============================================================
  // REWARDS
  // ============================================================

  function openPoints(member) {
    setSelectedMember(member);
    setPointsAmount("");
    setPointsReason("");
    setShowPointsModal(true);
  }

  async function adjustPoints(mode) {
    if (!selectedMember) return;

    const amount = Number(pointsAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      notify("Enter a valid points amount.");
      return;
    }

    setSaving(true);

    const current = Number(
      selectedMember.points || 0
    );

    const lifetime = Number(
      selectedMember.lifetime_points || 0
    );

    const delta =
      mode === "add" ? amount : -amount;

    const nextPoints = Math.max(
      0,
      current + delta
    );

    const nextLifetime =
      mode === "add"
        ? lifetime + amount
        : lifetime;

    const { error: updateError } =
      await supabase
        .from("member_rewards")
        .upsert(
          {
            user_id:
              selectedMember.user_id,
            points: nextPoints,
            lifetime_points: nextLifetime,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

    if (updateError) {
      setSaving(false);
      notify(updateError.message);
      return;
    }

    const { error: transactionError } =
      await supabase
        .from("reward_transactions")
        .insert([
          {
            user_id:
              selectedMember.user_id,
            points: delta,
            type:
              mode === "add"
                ? "admin_adjustment"
                : "admin_deduction",
            description:
              pointsReason.trim() ||
              (mode === "add"
                ? "Admin points adjustment"
                : "Admin points deduction"),
          },
        ]);

    setSaving(false);

    if (transactionError) {
      notify(transactionError.message);
      return;
    }

    setShowPointsModal(false);
    setSelectedMember(null);

    notify(
      mode === "add"
        ? `${amount} points added.`
        : `${amount} points deducted.`
    );

    await loadData();
  }

  // ============================================================
  // FILTERS
  // ============================================================

  const filteredTurfs = useMemo(() => {
    const query = turfSearch
      .trim()
      .toLowerCase();

    if (!query) return turfs;

    return turfs.filter((turf) =>
      `${turf.name} ${
        turf.description || ""
      }`
        .toLowerCase()
        .includes(query)
    );
  }, [turfs, turfSearch]);

  const filteredSlots = useMemo(() => {
    const query = slotSearch
      .trim()
      .toLowerCase();

    return slots.filter((slot) => {
      const matchesTurf =
        slotTurf === "all" ||
        String(slot.turf_id) ===
          String(slotTurf);

      const matchesDate =
        !slotDate ||
        slot.slot_date === slotDate;

      const matchesSearch =
        !query ||
        slot.turfs?.name
          ?.toLowerCase()
          .includes(query);

      return (
        matchesTurf &&
        matchesDate &&
        matchesSearch
      );
    });
  }, [
    slots,
    slotSearch,
    slotDate,
    slotTurf,
  ]);

  const filteredBookings = useMemo(() => {
    const query = bookingSearch
      .trim()
      .toLowerCase();

    return bookings.filter((booking) => {
      const statusMatch =
        bookingStatus === "all" ||
        booking.status === bookingStatus;

      const text =
        `${booking.profiles?.full_name || ""} ${
          booking.profiles?.email || ""
        } ${
          booking.profiles?.phone || ""
        } ${
          booking.turfs?.name || ""
        }`.toLowerCase();

      return (
        statusMatch &&
        (!query || text.includes(query))
      );
    });
  }, [
    bookings,
    bookingSearch,
    bookingStatus,
  ]);

  const filteredUsers = useMemo(() => {
    const query = userSearch
      .trim()
      .toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      `${user.full_name || ""} ${
        user.email || ""
      } ${user.phone || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [users, userSearch]);

  const filteredCoupons = useMemo(() => {
    const query = couponSearch
      .trim()
      .toLowerCase();

    if (!query) return coupons;

    return coupons.filter((coupon) =>
      `${coupon.code || ""} ${
        coupon.title || ""
      } ${coupon.description || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [coupons, couponSearch]);

  // ============================================================
  // STATS
  // ============================================================

  const activeTurfs = turfs.filter(
    (turf) => turf.is_active
  ).length;

  const activeCoupons = coupons.filter(
    (coupon) => coupon.is_active
  ).length;

  const pendingBookings = bookings.filter(
    (booking) => booking.status === "pending"
  );

  const confirmedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "confirmed"
    );

  const revenue = confirmedBookings.reduce(
    (sum, booking) =>
      sum +
      Number(booking.total_amount || 0),
    0
  );

  const currentPoints =
    memberRewards.reduce(
      (sum, member) =>
        sum + Number(member.points || 0),
      0
    );

  const navTitle =
    NAVIGATION.find(
      (item) => item.id === activeSection
    )?.label || "Overview";

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-mark">
          S
        </div>

        <div className="admin-loading-copy">
          <strong>
            SPORTIVA ADMIN
          </strong>

          <span>
            Preparing your control center
          </span>
        </div>

        <div className="admin-loading-line">
          <div />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="admin-sidebar">

        <div className="admin-brand">
          <div className="admin-brand-mark">
            S
          </div>

          <div className="admin-brand-copy">
            <strong>SPORTIVA</strong>
            <span>ADMIN CONTROL</span>
          </div>
        </div>

        <div className="admin-nav-label">
          MANAGEMENT
        </div>

        <nav className="admin-nav">

          {NAVIGATION.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={
                  activeSection === item.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveSection(item.id)
                }
              >
                <Icon size={17} />

                <span>{item.label}</span>

                {item.id === "bookings" &&
                  pendingBookings.length > 0 && (
                    <b>
                      {pendingBookings.length}
                    </b>
                  )}

                {item.id === "coupons" &&
                  activeCoupons > 0 && (
                    <b>
                      {activeCoupons}
                    </b>
                  )}

              </button>
            );
          })}

        </nav>

        <div className="admin-sidebar-bottom">

          <div className="admin-secure">
            <ShieldCheck size={15} />

            <div>
              <strong>
                SECURE ACCESS
              </strong>

              <span>
                Sportiva Admin
              </span>
            </div>
          </div>

        </div>

      </aside>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="admin-main">

        <header className="admin-header">

          <div>
            <span className="admin-header-label">
              THE SPORTIVA
            </span>

            <h1>{navTitle}</h1>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() =>
              loadData({ refresh: true })
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "admin-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </header>

        {message && (
          <div className="admin-toast">
            <Check size={15} />

            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ======================================================
            OVERVIEW
        ====================================================== */}

        {activeSection === "overview" && (
          <section className="admin-content">

            <div className="admin-welcome-panel">

              <div>
                <span>
                  FACILITY OPERATIONS
                </span>

                <h2>
                  Welcome to the
                  <br />
                  Sportiva control center.
                </h2>

                <p>
                  Manage your facility,
                  bookings, promotions and
                  customer experience from
                  one place.
                </p>
              </div>

              <div className="admin-live-pill">
                <span />
                LIVE SYSTEM
              </div>

            </div>

            <div className="admin-stat-grid">

              <StatCard
                icon={Trophy}
                label="Active Turfs"
                value={activeTurfs}
                detail={`${turfs.length} total facilities`}
              />

              <StatCard
                icon={ClipboardList}
                label="Bookings"
                value={bookings.length}
                detail={`${pendingBookings.length} awaiting action`}
              />

              <StatCard
                icon={Activity}
                label="Revenue"
                value={`৳${revenue.toLocaleString()}`}
                detail="Confirmed bookings"
              />

              <StatCard
                icon={Users}
                label="Members"
                value={users.length}
                detail="Registered customers"
              />

            </div>

            <div className="admin-overview-grid">

              <div className="admin-panel">

                <div className="admin-panel-header">

                  <div>
                    <span>BOOKING STATUS</span>
                    <h3>
                      Today's overview
                    </h3>
                  </div>

                  <ClipboardList size={18} />

                </div>

                <div className="admin-overview-list">

                  <div>
                    <span>
                      Pending
                    </span>

                    <strong>
                      {pendingBookings.length}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Confirmed
                    </span>

                    <strong>
                      {confirmedBookings.length}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cancelled
                    </span>

                    <strong>
                      {
                        bookings.filter(
                          (item) =>
                            item.status ===
                            "cancelled"
                        ).length
                      }
                    </strong>
                  </div>

                </div>

              </div>

              <div className="admin-panel">

                <div className="admin-panel-header">

                  <div>
                    <span>PROMOTIONS</span>
                    <h3>
                      Coupon system
                    </h3>
                  </div>

                  <TicketPercent
                    size={18}
                  />

                </div>

                <div className="admin-promotion-summary">

                  <strong>
                    {activeCoupons}
                  </strong>

                  <span>
                    active promotional codes
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        "coupons"
                      )
                    }
                  >
                    Manage coupons
                    <ChevronRight
                      size={14}
                    />
                  </button>

                </div>

              </div>

            </div>

            <div className="admin-recent-panel">

              <div className="admin-panel-header">

                <div>
                  <span>RECENT ACTIVITY</span>
                  <h3>
                    Latest bookings
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      "bookings"
                    )
                  }
                >
                  View all
                  <ChevronRight
                    size={14}
                  />
                </button>

              </div>

              <div className="admin-mini-list">

                {bookings
                  .slice(0, 6)
                  .map((booking) => (
                    <div
                      className="admin-mini-row"
                      key={booking.id}
                    >

                      <div className="admin-mini-person">

                        <div>
                          {booking.profiles
                            ?.full_name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "U"}
                        </div>

                        <span>
                          {
                            booking.profiles
                              ?.full_name ||
                            "Unknown User"
                          }
                        </span>

                      </div>

                      <span>
                        {booking.turfs?.name ||
                          "Turf"}
                      </span>

                      <strong>
                        ৳
                        {Number(
                          booking.total_amount ||
                            0
                        ).toLocaleString()}
                      </strong>

                      <StatusBadge
                        type={
                          booking.status ===
                          "confirmed"
                            ? "success"
                            : booking.status ===
                              "pending"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {booking.status}
                      </StatusBadge>

                    </div>
                  ))}

                {bookings.length === 0 && (
                  <div className="admin-empty-small">
                    No bookings yet.
                  </div>
                )}

              </div>

            </div>

          </section>
        )}

        {/* ======================================================
            TURFS
        ====================================================== */}

        {activeSection === "turfs" && (
          <section className="admin-content">

            <div className="admin-page-title-row">

              <div>
                <span>FACILITY MANAGEMENT</span>
                <h2>Turfs</h2>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={createTurf}
              >
                <Plus size={16} />
                Add Turf
              </button>

            </div>

            <div className="admin-toolbar">

              <div className="admin-search-box">
                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search turfs..."
                  value={turfSearch}
                  onChange={(event) =>
                    setTurfSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <span>
                {filteredTurfs.length} facilities
              </span>

            </div>

            <div className="admin-turf-grid">

              {filteredTurfs.map((turf) => (
                <article
                  className="admin-turf-card"
                  key={turf.id}
                >

                  <div className="admin-turf-visual">

                    {turf.image_url ? (
                      <img
                        src={turf.image_url}
                        alt={turf.name}
                      />
                    ) : (
                      <div className="admin-turf-placeholder">
                        <Trophy size={28} />
                      </div>
                    )}

                    <span
                      className={
                        turf.is_active
                          ? "active"
                          : ""
                      }
                    >
                      {turf.is_active
                        ? "ACTIVE"
                        : "DISABLED"}
                    </span>

                  </div>

                  <div className="admin-turf-card-body">

                    <div>
                      <small>
                        SPORTIVA FACILITY
                      </small>

                      <h3>
                        {turf.name}
                      </h3>

                      <p>
                        {turf.description ||
                          "No description provided."}
                      </p>
                    </div>

                    <div className="admin-turf-price">
                      <strong>
                        ৳
                        {Number(
                          turf.price_per_hour
                        ).toLocaleString()}
                      </strong>

                      <span>/ hour</span>
                    </div>

                    <div className="admin-inline-actions">

                      <button
                        type="button"
                        onClick={() =>
                          editTurf(turf)
                        }
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleTurf(turf)
                        }
                      >
                        {turf.is_active ? (
                          <X size={14} />
                        ) : (
                          <Check size={14} />
                        )}

                        {turf.is_active
                          ? "Disable"
                          : "Enable"}
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          deleteTurf(turf)
                        }
                      >
                        <Trash2 size={14} />
                      </button>

                    </div>

                  </div>

                </article>
              ))}

            </div>

            {filteredTurfs.length === 0 && (
              <div className="admin-empty">
                <Trophy size={28} />
                <strong>
                  No turfs found.
                </strong>
                <span>
                  Add a facility to start
                  accepting bookings.
                </span>
              </div>
            )}

          </section>
        )}

        {/* ======================================================
            TIME SLOTS
        ====================================================== */}

        {activeSection === "slots" && (
          <section className="admin-content">

            <div className="admin-page-title-row">

              <div>
                <span>
                  AVAILABILITY MANAGEMENT
                </span>

                <h2>
                  Time Slots
                </h2>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={createSlot}
              >
                <Plus size={16} />
                Add Slot
              </button>

            </div>

            <div className="admin-toolbar admin-toolbar-grid">

              <div className="admin-search-box">
                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search turf..."
                  value={slotSearch}
                  onChange={(event) =>
                    setSlotSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={slotTurf}
                onChange={(event) =>
                  setSlotTurf(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All turfs
                </option>

                {turfs.map((turf) => (
                  <option
                    key={turf.id}
                    value={turf.id}
                  >
                    {turf.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={slotDate}
                onChange={(event) =>
                  setSlotDate(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                className="admin-clear-button"
                onClick={() => {
                  setSlotSearch("");
                  setSlotTurf("all");
                  setSlotDate("");
                }}
              >
                Clear
              </button>

            </div>

            <div className="admin-table-card">

              <div className="admin-table-scroll">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Turf</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredSlots.map((slot) => (
                      <tr key={slot.id}>

                        <td>
                          <strong>
                            {slot.turfs?.name ||
                              "Unknown Turf"}
                          </strong>
                        </td>

                        <td>
                          {formatDate(
                            slot.slot_date
                          )}
                        </td>

                        <td>
                          <div className="admin-time-value">
                            <Clock3
                              size={14}
                            />

                            {formatTime(
                              slot.start_time
                            )}

                            <span>
                              —
                            </span>

                            {formatTime(
                              slot.end_time
                            )}
                          </div>
                        </td>

                        <td>
                          <StatusBadge
                            type={
                              slot.is_available
                                ? "success"
                                : "neutral"
                            }
                          >
                            {slot.is_available
                              ? "Available"
                              : "Disabled"}
                          </StatusBadge>
                        </td>

                        <td>
                          <div className="admin-row-actions">

                            <button
                              type="button"
                              onClick={() =>
                                editSlot(
                                  slot
                                )
                              }
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleSlot(
                                  slot
                                )
                              }
                            >
                              {slot.is_available ? (
                                <X size={14} />
                              ) : (
                                <Check
                                  size={14}
                                />
                              )}
                            </button>

                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                deleteSlot(
                                  slot
                                )
                              }
                            >
                              <Trash2 size={14} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

              {filteredSlots.length === 0 && (
                <div className="admin-table-empty">
                  No slots match your filters.
                </div>
              )}

            </div>

          </section>
        )}

        {/* ======================================================
            BOOKINGS
        ====================================================== */}

        {activeSection === "bookings" && (
          <section className="admin-content">

            <div className="admin-page-title-row">

              <div>
                <span>
                  RESERVATION MANAGEMENT
                </span>

                <h2>
                  Bookings
                </h2>
              </div>

              <span className="admin-page-counter">
                {bookings.length} TOTAL
              </span>

            </div>

            <div className="admin-toolbar">

              <div className="admin-search-box">
                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search customer or turf..."
                  value={bookingSearch}
                  onChange={(event) =>
                    setBookingSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={bookingStatus}
                onChange={(event) =>
                  setBookingStatus(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All statuses
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="confirmed">
                  Confirmed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>

            </div>

            <div className="admin-table-card">

              <div className="admin-table-scroll">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Turf</th>
                      <th>Schedule</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredBookings.map(
                      (booking) => (
                        <tr key={booking.id}>

                          <td>
                            <div className="admin-person">

                              <div>
                                {booking
                                  .profiles
                                  ?.full_name
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "U"}
                              </div>

                              <section>
                                <strong>
                                  {booking
                                    .profiles
                                    ?.full_name ||
                                    "Unknown User"}
                                </strong>

                                <small>
                                  {booking
                                    .profiles
                                    ?.email ||
                                    booking
                                      .profiles
                                      ?.phone ||
                                    "No contact"}
                                </small>
                              </section>

                            </div>
                          </td>

                          <td>
                            {booking
                              .turfs?.name ||
                              "Unknown Turf"}
                          </td>

                          <td>
                            <div className="admin-schedule">

                              <strong>
                                {formatDate(
                                  booking.booking_date
                                )}
                              </strong>

                              <small>
                                {formatTime(
                                  booking.start_time
                                )}{" "}
                                —{" "}
                                {formatTime(
                                  booking.end_time
                                )}
                              </small>

                            </div>
                          </td>

                          <td>
                            <strong>
                              ৳
                              {Number(
                                booking.total_amount ||
                                  0
                              ).toLocaleString()}
                            </strong>
                          </td>

                          <td>

                            <StatusBadge
                              type={
                                booking.status ===
                                "confirmed"
                                  ? "success"
                                  : booking.status ===
                                    "pending"
                                  ? "warning"
                                  : "danger"
                              }
                            >
                              {booking.status}
                            </StatusBadge>

                          </td>

                          <td>

                            {booking.status ===
                            "pending" ? (
                              <div className="admin-row-actions">

                                <button
                                  type="button"
                                  className="success"
                                  onClick={() =>
                                    setBookingStatus(
                                      booking,
                                      "confirmed"
                                    )
                                  }
                                  title="Confirm booking"
                                >
                                  <Check size={14} />
                                </button>

                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() =>
                                    setBookingStatus(
                                      booking,
                                      "cancelled"
                                    )
                                  }
                                  title="Cancel booking"
                                >
                                  <X size={14} />
                                </button>

                              </div>
                            ) : (
                              <span className="admin-muted">
                                {formatDateTime(
                                  booking.created_at
                                )}
                              </span>
                            )}

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {filteredBookings.length ===
                0 && (
                <div className="admin-table-empty">
                  No bookings found.
                </div>
              )}

            </div>

          </section>
        )}

        {/* ======================================================
            USERS
        ====================================================== */}

        {activeSection === "users" && (
          <section className="admin-content">

            <div className="admin-page-title-row">

              <div>
                <span>
                  CUSTOMER MANAGEMENT
                </span>

                <h2>Users</h2>
              </div>

              <span className="admin-page-counter">
                {users.length} MEMBERS
              </span>

            </div>

            <div className="admin-toolbar">

              <div className="admin-search-box">
                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search member..."
                  value={userSearch}
                  onChange={(event) =>
                    setUserSearch(
                      event.target.value
                    )
                  }
                />
              </div>

            </div>

            <div className="admin-table-card">

              <div className="admin-table-scroll">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Joined</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredUsers.map(
                      (user) => (
                        <tr key={user.id}>

                          <td>
                            <div className="admin-person">

                              <div>
                                {user.full_name
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "U"}
                              </div>

                              <section>
                                <strong>
                                  {user.full_name ||
                                    "Unnamed"}
                                </strong>

                                <small>
                                  ID:{" "}
                                  {user.id.slice(
                                    0,
                                    8
                                  )}
                                </small>
                              </section>

                            </div>
                          </td>

                          <td>
                            {user.phone || "—"}
                          </td>

                          <td>
                            {user.email || "—"}
                          </td>

                          <td>
                            {formatDateTime(
                              user.created_at
                            )}
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>
        )}

        {/* ======================================================
            REWARDS
        ====================================================== */}

        {activeSection === "rewards" && (
          <section className="admin-content">

            <div className="admin-page-title-row">

              <div>
                <span>
                  CUSTOMER LOYALTY
                </span>

                <h2>
                  Sportiva Rewards
                </h2>
              </div>

            </div>

            <div className="admin-stat-grid">

              <StatCard
                icon={Users}
                label="Reward Members"
                value={memberRewards.length}
                detail="Active reward accounts"
              />

              <StatCard
                icon={Gift}
                label="Current Points"
                value={currentPoints.toLocaleString()}
                detail="Customer balance"
              />

              <StatCard
                icon={Trophy}
                label="Milestones"
                value={
                  rewardCheckpoints.length
                }
                detail="Configured checkpoints"
              />

              <StatCard
                icon={Gift}
                label="Reward Offers"
                value={
                  communityOffers.filter(
                    (item) =>
                      item.is_active
                  ).length
                }
                detail="Active redemption offers"
              />

            </div>

            <div className="admin-segmented-tabs">

              <button
                type="button"
                className={
                  rewardSection === "members"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setRewardSection(
                    "members"
                  )
                }
              >
                Members
              </button>

              <button
                type="button"
                className={
                  rewardSection === "milestones"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setRewardSection(
                    "milestones"
                  )
                }
              >
                Milestones
              </button>

              <button
                type="button"
                className={
                  rewardSection === "offers"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setRewardSection(
                    "offers"
                  )
                }
              >
                Offers
              </button>

              <button
                type="button"
                className={
                  rewardSection === "history"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setRewardSection(
                    "history"
                  )
                }
              >
                History
              </button>

            </div>

            {rewardSection ===
              "members" && (
              <div className="admin-table-card">

                <div className="admin-toolbar embedded">

                  <div className="admin-search-box">
                    <Search size={16} />

                    <input
                      type="text"
                      placeholder="Search reward members..."
                      onChange={(event) => {
                        // Visual search is intentionally
                        // kept simple in this clean panel.
                        void event;
                      }}
                    />
                  </div>

                </div>

                <div className="admin-table-scroll">

                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Points</th>
                        <th>Lifetime</th>
                        <th>Updated</th>
                        <th />
                      </tr>
                    </thead>

                    <tbody>

                      {memberRewards.map(
                        (member) => {
                          const user =
                            users.find(
                              (item) =>
                                item.id ===
                                member.user_id
                            );

                          return (
                            <tr
                              key={
                                member.user_id
                              }
                            >

                              <td>
                                <div className="admin-person">

                                  <div>
                                    {user
                                      ?.full_name
                                      ?.charAt(0)
                                      ?.toUpperCase() ||
                                      "U"}
                                  </div>

                                  <section>
                                    <strong>
                                      {user
                                        ?.full_name ||
                                        "Unknown Member"}
                                    </strong>

                                    <small>
                                      {user?.email ||
                                        member.user_id.slice(
                                          0,
                                          8
                                        )}
                                    </small>
                                  </section>

                                </div>
                              </td>

                              <td>
                                <strong>
                                  {Number(
                                    member.points ||
                                      0
                                  ).toLocaleString()}
                                </strong>
                              </td>

                              <td>
                                {Number(
                                  member.lifetime_points ||
                                    0
                                ).toLocaleString()}
                              </td>

                              <td>
                                {formatDateTime(
                                  member.updated_at
                                )}
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="admin-small-button"
                                  onClick={() =>
                                    openPoints(
                                      member
                                    )
                                  }
                                >
                                  <Edit3
                                    size={14}
                                  />
                                  Adjust
                                </button>
                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

            {rewardSection ===
              "milestones" && (
              <div className="admin-card-grid">

                {rewardCheckpoints.map(
                  (item) => (
                    <div
                      className="admin-reward-box"
                      key={item.id}
                    >
                      <span>
                        {
                          item.points_required
                        }{" "}
                        POINTS
                      </span>

                      <strong>
                        {item.title}
                      </strong>

                      <p>
                        {item.description ||
                          "No description."}
                      </p>

                      <StatusBadge
                        type={
                          item.is_active
                            ? "success"
                            : "neutral"
                        }
                      >
                        {item.is_active
                          ? "Active"
                          : "Disabled"}
                      </StatusBadge>
                    </div>
                  )
                )}

              </div>
            )}

            {rewardSection ===
              "offers" && (
              <div className="admin-card-grid">

                {communityOffers.map(
                  (offer) => (
                    <div
                      className="admin-reward-box"
                      key={offer.id}
                    >

                      <span>
                        {offer.required_points}{" "}
                        POINTS
                      </span>

                      <strong>
                        {offer.title}
                      </strong>

                      <p>
                        {offer.description ||
                          offer.benefit ||
                          "Reward benefit"}
                      </p>

                      {Number(
                        offer.discount_value ||
                          0
                      ) > 0 && (
                        <small>
                          {offer.discount_type ===
                          "percentage"
                            ? `${offer.discount_value}% discount`
                            : `৳${Number(
                                offer.discount_value
                              ).toLocaleString()} discount`}
                        </small>
                      )}

                      <StatusBadge
                        type={
                          offer.is_active
                            ? "success"
                            : "neutral"
                        }
                      >
                        {offer.is_active
                          ? "Active"
                          : "Disabled"}
                      </StatusBadge>

                    </div>
                  )
                )}

              </div>
            )}

            {rewardSection ===
              "history" && (
              <div className="admin-overview-grid">

                <div className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <span>
                        POINT ACTIVITY
                      </span>

                      <h3>
                        Transactions
                      </h3>
                    </div>
                  </div>

                  <div className="admin-history-list">

                    {rewardTransactions
                      .slice(0, 20)
                      .map((item) => (
                        <div
                          className="admin-history-row"
                          key={item.id}
                        >
                          <div>
                            <strong>
                              {item.type ||
                                "Transaction"}
                            </strong>

                            <small>
                              {item.description ||
                                "Reward activity"}
                            </small>
                          </div>

                          <b
                            className={
                              Number(
                                item.points
                              ) >= 0
                                ? "positive"
                                : "negative"
                            }
                          >
                            {Number(
                              item.points
                            ) >= 0
                              ? "+"
                              : ""}
                            {item.points}
                          </b>
                        </div>
                      ))}

                  </div>

                </div>

                <div className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <span>
                        REDEMPTIONS
                      </span>

                      <h3>
                        Recent redemptions
                      </h3>
                    </div>
                  </div>

                  <div className="admin-history-list">

                    {rewardRedemptions
                      .slice(0, 20)
                      .map((item) => (
                        <div
                          className="admin-history-row"
                          key={item.id}
                        >
                          <div>
                            <strong>
                              Reward redeemed
                            </strong>

                            <small>
                              {item.status ||
                                "Processed"}
                            </small>
                          </div>

                          <b className="negative">
                            -
                            {item.points_used ||
                              0}
                          </b>
                        </div>
                      ))}

                  </div>

                </div>

              </div>
            )}

          </section>
        )}

        {/* ======================================================
            COUPONS
        ====================================================== */}

        {activeSection === "coupons" && (
          <section className="admin-content">

            <div className="admin-page-title-row">

              <div>
                <span>
                  PROMOTION MANAGEMENT
                </span>

                <h2>
                  Coupons
                </h2>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={createCoupon}
              >
                <Plus size={16} />
                Create Coupon
              </button>

            </div>

            <div className="admin-stat-grid">

              <StatCard
                icon={TicketPercent}
                label="Total Coupons"
                value={coupons.length}
                detail="Created codes"
              />

              <StatCard
                icon={Check}
                label="Active"
                value={activeCoupons}
                detail="Currently enabled"
              />

              <StatCard
                icon={Activity}
                label="Redemptions"
                value={
                  couponUsages.length
                }
                detail="Recorded uses"
              />

              <StatCard
                icon={Settings2}
                label="Usage Limit"
                value={
                  coupons.filter(
                    (item) =>
                      item.usage_limit
                  ).length
                }
                detail="Limited campaigns"
              />

            </div>

            <div className="admin-toolbar">

              <div className="admin-search-box">
                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search coupon code..."
                  value={couponSearch}
                  onChange={(event) =>
                    setCouponSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <span>
                {filteredCoupons.length} coupons
              </span>

            </div>

            <div className="admin-table-card">

              <div className="admin-table-scroll">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Coupon</th>
                      <th>Discount</th>
                      <th>Usage</th>
                      <th>Validity</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>

                    {filteredCoupons.map(
                      (coupon) => {
                        const usage =
                          couponUsages.filter(
                            (item) =>
                              String(
                                item.coupon_id
                              ) ===
                              String(coupon.id)
                          ).length;

                        const now =
                          Date.now();

                        const scheduled =
                          coupon.starts_at &&
                          now <
                            new Date(
                              coupon.starts_at
                            ).getTime();

                        const expired =
                          coupon.expires_at &&
                          now >
                            new Date(
                              coupon.expires_at
                            ).getTime();

                        return (
                          <tr
                            key={coupon.id}
                          >

                            <td>

                              <div className="admin-coupon">

                                <div>
                                  <TicketPercent
                                    size={16}
                                  />
                                </div>

                                <section>
                                  <strong>
                                    {coupon.code}
                                  </strong>

                                  <small>
                                    {coupon.title ||
                                      "Sportiva promotion"}
                                  </small>
                                </section>

                                <button
                                  type="button"
                                  onClick={() =>
                                    copyCoupon(
                                      coupon.code
                                    )
                                  }
                                  title="Copy code"
                                >
                                  <ClipboardList
                                    size={13}
                                  />
                                </button>

                              </div>

                            </td>

                            <td>
                              <strong>
                                {coupon.discount_type ===
                                "percentage"
                                  ? `${Number(
                                      coupon.discount_value
                                    )}% OFF`
                                  : `৳${Number(
                                      coupon.discount_value
                                    ).toLocaleString()} OFF`}
                              </strong>
                            </td>

                            <td>
                              <strong>
                                {usage}
                              </strong>

                              <span className="admin-muted">
                                {coupon.usage_limit
                                  ? ` / ${coupon.usage_limit}`
                                  : " / unlimited"}
                              </span>
                            </td>

                            <td>
                              <div className="admin-validity">
                                <span>
                                  {coupon.starts_at
                                    ? formatDateTime(
                                        coupon.starts_at
                                      )
                                    : "Immediately"}
                                </span>

                                <span>
                                  →
                                </span>

                                <span>
                                  {coupon.expires_at
                                    ? formatDateTime(
                                        coupon.expires_at
                                      )
                                    : "No expiry"}
                                </span>
                              </div>
                            </td>

                            <td>

                              {!coupon.is_active ? (
                                <StatusBadge type="neutral">
                                  Inactive
                                </StatusBadge>
                              ) : scheduled ? (
                                <StatusBadge type="info">
                                  Scheduled
                                </StatusBadge>
                              ) : expired ? (
                                <StatusBadge type="danger">
                                  Expired
                                </StatusBadge>
                              ) : (
                                <StatusBadge type="success">
                                  Active
                                </StatusBadge>
                              )}

                            </td>

                            <td>

                              <div className="admin-row-actions">

                                <button
                                  type="button"
                                  onClick={() =>
                                    editCoupon(
                                      coupon
                                    )
                                  }
                                >
                                  <Edit3 size={14} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleCoupon(
                                      coupon
                                    )
                                  }
                                >
                                  {coupon.is_active ? (
                                    <X size={14} />
                                  ) : (
                                    <Check
                                      size={14}
                                    />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() =>
                                    deleteCoupon(
                                      coupon
                                    )
                                  }
                                >
                                  <Trash2
                                    size={14}
                                  />
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {filteredCoupons.length ===
                0 && (
                <div className="admin-empty">
                  <TicketPercent size={28} />
                  <strong>
                    No coupons found.
                  </strong>
                  <span>
                    Create a promotional code
                    to start.
                  </span>
                </div>
              )}

            </div>

          </section>
        )}

        {/* ======================================================
            ANNOUNCEMENTS
        ====================================================== */}

        {activeSection ===
          "announcements" && (
          <section className="admin-content">

            <div className="admin-page-title-row">

              <div>
                <span>
                  CUSTOMER COMMUNICATION
                </span>

                <h2>
                  Announcements
                </h2>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={() =>
                  setShowAnnouncementModal(
                    true
                  )
                }
              >
                <Plus size={16} />
                New Announcement
              </button>

            </div>

            <div className="admin-list-card">

              {announcements.map(
                (announcement) => (
                  <div
                    className="admin-list-item"
                    key={announcement.id}
                  >

                    <div className="admin-list-leading">

                      <div className="admin-list-icon">
                        <Megaphone
                          size={17}
                        />
                      </div>

                      <div>
                        <strong>
                          {announcement.title}
                        </strong>

                        <p>
                          {announcement.message ||
                            "No message"}
                        </p>

                        <small>
                          {formatDateTime(
                            announcement.created_at
                          )}
                        </small>
                      </div>

                    </div>

                    <div className="admin-list-trailing">

                      <StatusBadge
                        type={
                          announcement.is_active
                            ? "success"
                            : "neutral"
                        }
                      >
                        {announcement.is_active
                          ? "Active"
                          : "Disabled"}
                      </StatusBadge>

                      <button
                        type="button"
                        onClick={() =>
                          toggleAnnouncement(
                            announcement
                          )
                        }
                      >
                        {announcement.is_active ? (
                          <X size={14} />
                        ) : (
                          <Check size={14} />
                        )}
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          deleteAnnouncement(
                            announcement
                          )
                        }
                      >
                        <Trash2 size={14} />
                      </button>

                    </div>

                  </div>
                )
              )}

              {announcements.length ===
                0 && (
                <div className="admin-empty">
                  <Megaphone size={27} />
                  <strong>
                    No announcements yet.
                  </strong>
                  <span>
                    Publish your first customer
                    update.
                  </span>
                </div>
              )}

            </div>

          </section>
        )}

      </main>

      {/* ========================================================
          TURF MODAL
      ======================================================== */}

      {showTurfModal && (
        <Modal
          eyebrow="FACILITY MANAGEMENT"
          title={
            editingTurf
              ? "Edit Turf"
              : "Add Turf"
          }
          onClose={() =>
            setShowTurfModal(false)
          }
        >
          <form
            className="admin-modal-form"
            onSubmit={saveTurf}
          >

            <label>
              Turf Name

              <input
                type="text"
                value={turfForm.name}
                onChange={(event) =>
                  setTurfForm(
                    (current) => ({
                      ...current,
                      name: event.target.value,
                    })
                  )
                }
                placeholder="Sportiva Main Turf"
                required
              />
            </label>

            <label>
              Description

              <textarea
                rows="4"
                value={
                  turfForm.description
                }
                onChange={(event) =>
                  setTurfForm(
                    (current) => ({
                      ...current,
                      description:
                        event.target.value,
                    })
                  )
                }
              />
            </label>

            <div className="admin-form-grid">

              <label>
                Price / Hour

                <input
                  type="number"
                  min="1"
                  value={
                    turfForm.price_per_hour
                  }
                  onChange={(event) =>
                    setTurfForm(
                      (current) => ({
                        ...current,
                        price_per_hour:
                          event.target.value,
                      })
                    )
                  }
                  required
                />
              </label>

              <label>
                Image URL

                <input
                  type="url"
                  value={
                    turfForm.image_url
                  }
                  onChange={(event) =>
                    setTurfForm(
                      (current) => ({
                        ...current,
                        image_url:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="https://..."
                />
              </label>

            </div>

            <div className="admin-modal-actions">

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() =>
                  setShowTurfModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingTurf
                  ? "Save Changes"
                  : "Create Turf"}
              </button>

            </div>

          </form>
        </Modal>
      )}

      {/* ========================================================
          SLOT MODAL
      ======================================================== */}

      {showSlotModal && (
        <Modal
          eyebrow="AVAILABILITY MANAGEMENT"
          title={
            editingSlot
              ? "Edit Time Slot"
              : "Add Time Slot"
          }
          onClose={() =>
            setShowSlotModal(false)
          }
        >
          <form
            className="admin-modal-form"
            onSubmit={saveSlot}
          >

            <div className="admin-form-grid">

              <label>
                Turf

                <select
                  value={slotForm.turf_id}
                  onChange={(event) =>
                    setSlotForm(
                      (current) => ({
                        ...current,
                        turf_id:
                          event.target.value,
                      })
                    )
                  }
                  required
                >
                  <option value="">
                    Select turf
                  </option>

                  {turfs.map((turf) => (
                    <option
                      key={turf.id}
                      value={turf.id}
                    >
                      {turf.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date

                <input
                  type="date"
                  value={
                    slotForm.slot_date
                  }
                  onChange={(event) =>
                    setSlotForm(
                      (current) => ({
                        ...current,
                        slot_date:
                          event.target.value,
                      })
                    )
                  }
                  required
                />
              </label>

              <label>
                Start Time

                <input
                  type="time"
                  value={
                    slotForm.start_time
                  }
                  onChange={(event) =>
                    setSlotForm(
                      (current) => ({
                        ...current,
                        start_time:
                          event.target.value,
                      })
                    )
                  }
                  required
                />
              </label>

              <label>
                End Time

                <input
                  type="time"
                  value={
                    slotForm.end_time
                  }
                  onChange={(event) =>
                    setSlotForm(
                      (current) => ({
                        ...current,
                        end_time:
                          event.target.value,
                      })
                    )
                  }
                  required
                />
              </label>

            </div>

            <label className="admin-check-row">

              <input
                type="checkbox"
                checked={
                  slotForm.is_available
                }
                onChange={(event) =>
                  setSlotForm(
                    (current) => ({
                      ...current,
                      is_available:
                        event.target.checked,
                    })
                  )
                }
              />

              <span>
                Available for customer booking
              </span>

            </label>

            <div className="admin-modal-actions">

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() =>
                  setShowSlotModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingSlot
                  ? "Save Changes"
                  : "Create Slot"}
              </button>

            </div>

          </form>
        </Modal>
      )}

      {/* ========================================================
          COUPON MODAL
      ======================================================== */}

      {showCouponModal && (
        <Modal
          wide
          eyebrow="PROMOTION MANAGEMENT"
          title={
            editingCoupon
              ? "Edit Coupon"
              : "Create Coupon"
          }
          onClose={() =>
            setShowCouponModal(false)
          }
        >
          <form
            className="admin-modal-form"
            onSubmit={saveCoupon}
          >

            <div className="admin-form-grid">

              <label className="full">
                Coupon Code

                <div className="admin-code-input">

                  <input
                    type="text"
                    value={
                      couponForm.code
                    }
                    onChange={(event) =>
                      setCouponForm(
                        (current) => ({
                          ...current,
                          code:
                            event.target.value.toUpperCase(),
                        })
                      )
                    }
                    placeholder="SPORTIVA-XXXXXX"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setCouponForm(
                        (current) => ({
                          ...current,
                          code:
                            generateCouponCode(),
                        })
                      )
                    }
                  >
                    Generate
                  </button>

                </div>

              </label>

              <label>
                Title

                <input
                  type="text"
                  value={
                    couponForm.title
                  }
                  onChange={(event) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        title:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Weekend Special"
                />
              </label>

              <label>
                Discount Type

                <select
                  value={
                    couponForm.discount_type
                  }
                  onChange={(event) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        discount_type:
                          event.target.value,
                      })
                    )
                  }
                >
                  <option value="percentage">
                    Percentage
                  </option>

                  <option value="fixed">
                    Fixed Amount
                  </option>
                </select>
              </label>

              <label>
                Discount Value

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    couponForm.discount_value
                  }
                  onChange={(event) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        discount_value:
                          event.target.value,
                      })
                    )
                  }
                  required
                />
              </label>

              <label>
                Minimum Booking

                <input
                  type="number"
                  min="0"
                  value={
                    couponForm.min_booking_amount
                  }
                  onChange={(event) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        min_booking_amount:
                          event.target.value,
                      })
                    )
                  }
                />
              </label>

              <label>
                Maximum Discount

                <input
                  type="number"
                  min="0"
                  value={
                    couponForm.max_discount_amount
                  }
                  onChange={(event) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        max_discount_amount:
                          event.target.value,
                      })
                    )
                  }
                  disabled={
                    couponForm.discount_type !==
                    "percentage"
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                Total Usage Limit

                <input
                  type="number"
                  min="1"
                  value={
                    couponForm.usage_limit
                  }
                  onChange={(event) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        usage_limit:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Unlimited"
                />
              </label>

              <label>
                Per User Limit

                <input
                  type="number"
                  min="1"
                  value={
                    couponForm.per_user_limit
                  }
                  onChange={(event) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        per_user_limit:
                          event.target.value,
                      })
                    )
                  }
                />
              </label>

              <label>
                Starts At

                <input
                  type="datetime-local"
                  value={
                    couponForm.starts_at
                  }
                  onChange={(event) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        starts_at:
                          event.target.value,
                      })
                    )
                  }
                />
              </label>

              <label>
                Expires At

                <input
                  type="datetime-local"
                  value={
                    couponForm.expires_at
                  }
                  onChange={(event) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        expires_at:
                          event.target.value,
                      })
                    )
                  }
                />
              </label>

              <label className="full">
                Description

                <textarea
                  rows="3"
                  value={
                    couponForm.description
                  }
                  onChange={(event) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Describe the promotion..."
                />
              </label>

            </div>

            <label className="admin-check-row">

              <input
                type="checkbox"
                checked={
                  couponForm.is_active
                }
                onChange={(event) =>
                  setCouponForm(
                    (current) => ({
                      ...current,
                      is_active:
                        event.target.checked,
                    })
                  )
                }
              />

              <span>
                Coupon is active
              </span>

            </label>

            <div className="admin-modal-actions">

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() =>
                  setShowCouponModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingCoupon
                  ? "Save Changes"
                  : "Create Coupon"}
              </button>

            </div>

          </form>
        </Modal>
      )}

      {/* ========================================================
          ANNOUNCEMENT MODAL
      ======================================================== */}

      {showAnnouncementModal && (
        <Modal
          eyebrow="CUSTOMER COMMUNICATION"
          title="New Announcement"
          onClose={() =>
            setShowAnnouncementModal(
              false
            )
          }
        >
          <form
            className="admin-modal-form"
            onSubmit={
              createAnnouncement
            }
          >

            <label>
              Title

              <input
                type="text"
                value={
                  announcementForm.title
                }
                onChange={(event) =>
                  setAnnouncementForm(
                    (current) => ({
                      ...current,
                      title:
                        event.target.value,
                    })
                  )
                }
                placeholder="Weekend promotion"
                required
              />
            </label>

            <label>
              Message

              <textarea
                rows="5"
                value={
                  announcementForm.message
                }
                onChange={(event) =>
                  setAnnouncementForm(
                    (current) => ({
                      ...current,
                      message:
                        event.target.value,
                    })
                  )
                }
                placeholder="Write the customer-facing message..."
              />
            </label>

            <div className="admin-modal-actions">

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() =>
                  setShowAnnouncementModal(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
              >
                <Megaphone size={15} />
                Publish
              </button>

            </div>

          </form>
        </Modal>
      )}

      {/* ========================================================
          POINTS MODAL
      ======================================================== */}

      {showPointsModal &&
        selectedMember && (
          <Modal
            eyebrow="REWARDS MANAGEMENT"
            title="Adjust Member Points"
            onClose={() =>
              setShowPointsModal(
                false
              )
            }
          >
            <div className="admin-selected-member">

              <div>
                {users
                  .find(
                    (user) =>
                      user.id ===
                      selectedMember.user_id
                  )
                  ?.full_name?.charAt(0)
                  ?.toUpperCase() || "U"}
              </div>

              <section>
                <strong>
                  {
                    users.find(
                      (user) =>
                        user.id ===
                        selectedMember.user_id
                    )?.full_name
                  }
                </strong>

                <span>
                  Current balance:{" "}
                  {selectedMember.points ||
                    0}{" "}
                  points
                </span>
              </section>

            </div>

            <div className="admin-modal-form">

              <label>
                Points

                <input
                  type="number"
                  min="1"
                  value={pointsAmount}
                  onChange={(event) =>
                    setPointsAmount(
                      event.target.value
                    )
                  }
                  placeholder="10"
                />
              </label>

              <label>
                Reason

                <textarea
                  rows="3"
                  value={pointsReason}
                  onChange={(event) =>
                    setPointsReason(
                      event.target.value
                    )
                  }
                  placeholder="Reason for adjustment..."
                />
              </label>

              <div className="admin-modal-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    setShowPointsModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    adjustPoints("remove")
                  }
                  disabled={saving}
                >
                  Deduct
                </button>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() =>
                    adjustPoints("add")
                  }
                  disabled={saving}
                >
                  Add Points
                </button>

              </div>

            </div>
          </Modal>
        )}

    </div>
  );
}