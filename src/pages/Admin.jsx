import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  Edit3,
  Eye,
  Gift,
  LayoutDashboard,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  TicketPercent,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "./Admin.css";

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

const EMPTY_ANNOUNCEMENT = {
  title: "",
  message: "",
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

const EMPTY_MILESTONE = {
  title: "",
  description: "",
  points_required: "",
  is_active: true,
};

const EMPTY_OFFER = {
  title: "",
  description: "",
  required_points: "",
  benefit: "",
  discount_type: "percentage",
  discount_value: "",
  is_active: true,
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
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

  const [hourString, minuteString] = String(value).split(":");
  const hour = Number(hourString);

  if (!Number.isFinite(hour)) return value;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minuteString || "00"} ${period}`;
}

function toDateTimeInput(value) {
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
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "SPORTIVA-";

  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

function StatusBadge({ children, type = "default" }) {
  return (
    <span className={`admin-status-badge ${type}`}>
      {children}
    </span>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("overview");
  const [rewardTab, setRewardTab] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [turfs, setTurfs] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [memberRewards, setMemberRewards] = useState([]);
  const [rewardTransactions, setRewardTransactions] = useState([]);
  const [rewardRedemptions, setRewardRedemptions] = useState([]);
  const [rewardCheckpoints, setRewardCheckpoints] = useState([]);
  const [communityOffers, setCommunityOffers] = useState([]);

  const [coupons, setCoupons] = useState([]);
  const [couponUsages, setCouponUsages] = useState([]);

  const [showTurfForm, setShowTurfForm] = useState(false);
  const [editingTurf, setEditingTurf] = useState(null);
  const [turfForm, setTurfForm] = useState(EMPTY_TURF);

  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState(EMPTY_SLOT);

  const [showAnnouncementForm, setShowAnnouncementForm] =
    useState(false);
  const [announcementForm, setAnnouncementForm] =
    useState(EMPTY_ANNOUNCEMENT);

  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON);

  const [showMilestoneForm, setShowMilestoneForm] =
    useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneForm, setMilestoneForm] =
    useState(EMPTY_MILESTONE);

  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState(EMPTY_OFFER);

  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedRewardMember, setSelectedRewardMember] =
    useState(null);
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsReason, setPointsReason] = useState("");

  const [turfFilter, setTurfFilter] = useState("all");
  const [slotDateFilter, setSlotDateFilter] = useState("");
  const [slotSearch, setSlotSearch] = useState("");

  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] =
    useState("all");

  const [userSearch, setUserSearch] = useState("");
  const [couponSearch, setCouponSearch] = useState("");
  const [rewardSearch, setRewardSearch] = useState("");

  const [saving, setSaving] = useState(false);

  function showMessage(text) {
    setMessage(text);

    window.clearTimeout(showMessage.timeoutId);

    showMessage.timeoutId = window.setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  async function loadData() {
    setLoading(true);

    try {
      const [
        turfsResult,
        slotsResult,
        bookingsResult,
        profilesResult,
        announcementsResult,
        memberRewardsResult,
        rewardTransactionsResult,
        rewardRedemptionsResult,
        checkpointsResult,
        offersResult,
        couponsResult,
        couponUsagesResult,
      ] = await Promise.all([
        supabase
          .from("turfs")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("time_slots")
          .select("*, turfs(name)")
          .order("slot_date", { ascending: true })
          .order("start_time", { ascending: true }),

        supabase
          .from("bookings")
          .select(
            "*, turfs(name), profiles(full_name, phone, email)"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("member_rewards")
          .select("*")
          .order("points", { ascending: false }),

        supabase
          .from("reward_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),

        supabase
          .from("reward_redemptions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),

        supabase
          .from("reward_checkpoints")
          .select("*")
          .order("points_required", { ascending: true }),

        supabase
          .from("community_offers")
          .select("*")
          .order("required_points", { ascending: true }),

        supabase
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("coupon_usages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      if (!turfsResult.error) {
        setTurfs(turfsResult.data || []);
      }

      if (!slotsResult.error) {
        setSlots(slotsResult.data || []);
      }

      if (!bookingsResult.error) {
        setBookings(bookingsResult.data || []);
      }

      if (!profilesResult.error) {
        setUsers(profilesResult.data || []);
      }

      if (!announcementsResult.error) {
        setAnnouncements(announcementsResult.data || []);
      }

      if (!memberRewardsResult.error) {
        setMemberRewards(memberRewardsResult.data || []);
      }

      if (!rewardTransactionsResult.error) {
        setRewardTransactions(
          rewardTransactionsResult.data || []
        );
      }

      if (!rewardRedemptionsResult.error) {
        setRewardRedemptions(
          rewardRedemptionsResult.data || []
        );
      }

      if (!checkpointsResult.error) {
        setRewardCheckpoints(
          checkpointsResult.data || []
        );
      }

      if (!offersResult.error) {
        setCommunityOffers(offersResult.data || []);
      }

      if (!couponsResult.error) {
        setCoupons(couponsResult.data || []);
      } else {
        console.error(
          "Coupons load error:",
          couponsResult.error
        );
      }

      if (!couponUsagesResult.error) {
        setCouponUsages(couponUsagesResult.data || []);
      }

      const errors = [
        turfsResult.error,
        slotsResult.error,
        bookingsResult.error,
        profilesResult.error,
        announcementsResult.error,
        memberRewardsResult.error,
        rewardTransactionsResult.error,
        rewardRedemptionsResult.error,
        checkpointsResult.error,
        offersResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error("Admin data errors:", errors);
      }
    } catch (error) {
      console.error("Admin load error:", error);
      showMessage(error.message || "Failed to load admin data.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("sportiva-admin-live")
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
          table: "member_rewards",
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

  function openCreateTurf() {
    setEditingTurf(null);
    setTurfForm(EMPTY_TURF);
    setShowTurfForm(true);
  }

  function openEditTurf(turf) {
    setEditingTurf(turf);

    setTurfForm({
      name: turf.name || "",
      description: turf.description || "",
      price_per_hour:
        turf.price_per_hour === null ||
        turf.price_per_hour === undefined
          ? ""
          : String(turf.price_per_hour),
      image_url: turf.image_url || "",
    });

    setShowTurfForm(true);
  }

  async function saveTurf(event) {
    event.preventDefault();

    if (!turfForm.name.trim()) {
      showMessage("Turf name is required.");
      return;
    }

    if (
      !turfForm.price_per_hour ||
      Number(turfForm.price_per_hour) <= 0
    ) {
      showMessage("Enter a valid turf price.");
      return;
    }

    setSaving(true);

    const payload = {
      name: turfForm.name.trim(),
      description: turfForm.description.trim() || null,
      price_per_hour: Number(turfForm.price_per_hour),
      image_url: turfForm.image_url.trim() || null,
    };

    let result;

    if (editingTurf) {
      result = await supabase
        .from("turfs")
        .update(payload)
        .eq("id", editingTurf.id);
    } else {
      result = await supabase
        .from("turfs")
        .insert([
          {
            ...payload,
            is_active: true,
          },
        ]);
    }

    setSaving(false);

    if (result.error) {
      showMessage(result.error.message);
      return;
    }

    setShowTurfForm(false);
    setEditingTurf(null);
    setTurfForm(EMPTY_TURF);

    showMessage(
      editingTurf
        ? "Turf updated successfully."
        : "Turf created successfully."
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
      showMessage(error.message);
      return;
    }

    showMessage(
      turf.is_active
        ? "Turf disabled."
        : "Turf activated."
    );

    await loadData();
  }

  async function deleteTurf(turf) {
    if (
      !window.confirm(
        `Delete "${turf.name}"? Existing bookings may be affected.`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("turfs")
      .delete()
      .eq("id", turf.id);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage("Turf deleted.");
    await loadData();
  }

  // ============================================================
  // TIME SLOTS
  // ============================================================

  function openCreateSlot() {
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

    setShowSlotForm(true);
  }

  function openEditSlot(slot) {
    setEditingSlot(slot);

    setSlotForm({
      turf_id: String(slot.turf_id || ""),
      slot_date: slot.slot_date || "",
      start_time: String(slot.start_time || "").slice(
        0,
        5
      ),
      end_time: String(slot.end_time || "").slice(
        0,
        5
      ),
      is_available: slot.is_available ?? true,
    });

    setShowSlotForm(true);
  }

  async function saveSlot(event) {
    event.preventDefault();

    if (!slotForm.turf_id || !slotForm.slot_date) {
      showMessage("Turf and date are required.");
      return;
    }

    if (!slotForm.start_time || !slotForm.end_time) {
      showMessage("Start and end time are required.");
      return;
    }

    if (slotForm.end_time <= slotForm.start_time) {
      showMessage("End time must be after start time.");
      return;
    }

    setSaving(true);

    const payload = {
      turf_id: Number(slotForm.turf_id),
      slot_date: slotForm.slot_date,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      is_available: Boolean(slotForm.is_available),
    };

    let result;

    if (editingSlot) {
      result = await supabase
        .from("time_slots")
        .update(payload)
        .eq("id", editingSlot.id);
    } else {
      result = await supabase
        .from("time_slots")
        .insert([payload]);
    }

    setSaving(false);

    if (result.error) {
      showMessage(result.error.message);
      return;
    }

    setShowSlotForm(false);
    setEditingSlot(null);
    setSlotForm(EMPTY_SLOT);

    showMessage(
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
      showMessage(error.message);
      return;
    }

    showMessage(
      slot.is_available
        ? "Time slot disabled."
        : "Time slot enabled."
    );

    await loadData();
  }

  async function deleteSlot(slot) {
    if (!window.confirm("Delete this time slot?")) {
      return;
    }

    const { error } = await supabase
      .from("time_slots")
      .delete()
      .eq("id", slot.id);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage("Time slot deleted.");
    await loadData();
  }

  // ============================================================
  // BOOKINGS
  // ============================================================

  async function updateBookingStatus(booking, status) {
    const { error } = await supabase
      .from("bookings")
      .update({
        status,
      })
      .eq("id", booking.id);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage(
      status === "confirmed"
        ? "Booking confirmed."
        : "Booking cancelled."
    );

    await loadData();
  }

  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================

  async function createAnnouncement(event) {
    event.preventDefault();

    if (!announcementForm.title.trim()) {
      showMessage("Announcement title is required.");
      return;
    }

    const { error } = await supabase
      .from("announcements")
      .insert([
        {
          title: announcementForm.title.trim(),
          message:
            announcementForm.message.trim() || null,
          is_active: true,
        },
      ]);

    if (error) {
      showMessage(error.message);
      return;
    }

    setAnnouncementForm(EMPTY_ANNOUNCEMENT);
    setShowAnnouncementForm(false);

    showMessage("Announcement published.");
    await loadData();
  }

  async function toggleAnnouncement(announcement) {
    const { error } = await supabase
      .from("announcements")
      .update({
        is_active: !announcement.is_active,
      })
      .eq("id", announcement.id);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage(
      announcement.is_active
        ? "Announcement disabled."
        : "Announcement activated."
    );

    await loadData();
  }

  async function deleteAnnouncement(announcement) {
    if (
      !window.confirm("Delete this announcement?")
    ) {
      return;
    }

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage("Announcement deleted.");
    await loadData();
  }

  // ============================================================
  // COUPONS
  // ============================================================

  function openCreateCoupon() {
    setEditingCoupon(null);

    setCouponForm({
      ...EMPTY_COUPON,
      code: generateCouponCode(),
    });

    setShowCouponForm(true);
  }

  function openEditCoupon(coupon) {
    setEditingCoupon(coupon);

    setCouponForm({
      code: coupon.code || "",
      title: coupon.title || "",
      description: coupon.description || "",
      discount_type:
        coupon.discount_type || "percentage",
      discount_value:
        coupon.discount_value === null ||
        coupon.discount_value === undefined
          ? ""
          : String(coupon.discount_value),
      min_booking_amount:
        coupon.min_booking_amount === null ||
        coupon.min_booking_amount === undefined
          ? "0"
          : String(coupon.min_booking_amount),
      max_discount_amount:
        coupon.max_discount_amount === null ||
        coupon.max_discount_amount === undefined
          ? ""
          : String(coupon.max_discount_amount),
      usage_limit:
        coupon.usage_limit === null ||
        coupon.usage_limit === undefined
          ? ""
          : String(coupon.usage_limit),
      per_user_limit:
        coupon.per_user_limit === null ||
        coupon.per_user_limit === undefined
          ? "1"
          : String(coupon.per_user_limit),
      starts_at: toDateTimeInput(coupon.starts_at),
      expires_at: toDateTimeInput(coupon.expires_at),
      is_active: coupon.is_active ?? true,
    });

    setShowCouponForm(true);
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
      showMessage("Coupon code is required.");
      return;
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      showMessage("Enter a valid discount value.");
      return;
    }

    if (
      couponForm.discount_type === "percentage" &&
      discountValue > 100
    ) {
      showMessage("Percentage cannot exceed 100%.");
      return;
    }

    if (
      couponForm.starts_at &&
      couponForm.expires_at &&
      new Date(couponForm.expires_at) <=
        new Date(couponForm.starts_at)
    ) {
      showMessage(
        "Coupon expiry must be after its start date."
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
        couponForm.description.trim() || null,
      discount_type: couponForm.discount_type,
      discount_value: discountValue,
      min_booking_amount: Number(
        couponForm.min_booking_amount || 0
      ),
      max_discount_amount:
        couponForm.discount_type === "percentage" &&
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
      is_active: Boolean(couponForm.is_active),
    };

    let result;

    if (editingCoupon) {
      result = await supabase
        .from("coupons")
        .update(payload)
        .eq("id", editingCoupon.id);
    } else {
      result = await supabase
        .from("coupons")
        .insert([
          {
            ...payload,
            created_by: user?.id || null,
          },
        ]);
    }

    setSaving(false);

    if (result.error) {
      const errorText =
        result.error.message?.toLowerCase() || "";

      if (
        errorText.includes("duplicate") ||
        errorText.includes("unique")
      ) {
        showMessage(
          "That coupon code already exists."
        );
      } else {
        showMessage(result.error.message);
      }

      return;
    }

    setShowCouponForm(false);
    setEditingCoupon(null);
    setCouponForm(EMPTY_COUPON);

    showMessage(
      editingCoupon
        ? "Coupon updated successfully."
        : "Coupon created successfully."
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
      showMessage(error.message);
      return;
    }

    showMessage(
      coupon.is_active
        ? "Coupon disabled."
        : "Coupon activated."
    );

    await loadData();
  }

  async function deleteCoupon(coupon) {
    if (
      !window.confirm(
        `Delete coupon "${coupon.code}"?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", coupon.id);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage("Coupon deleted.");
    await loadData();
  }

  async function copyCouponCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      showMessage(`${code} copied.`);
    } catch {
      showMessage("Could not copy coupon code.");
    }
  }

  // ============================================================
  // REWARDS
  // ============================================================

  function openAdjustPoints(member) {
    setSelectedRewardMember(member);
    setPointsAmount("");
    setPointsReason("");
    setShowPointsModal(true);
  }

  async function adjustPoints(mode) {
    if (!selectedRewardMember) return;

    const amount = Number(pointsAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage("Enter a valid points amount.");
      return;
    }

    const signedPoints =
      mode === "add" ? amount : -amount;

    setSaving(true);

    const currentPoints = Number(
      selectedRewardMember.points || 0
    );

    const currentLifetime = Number(
      selectedRewardMember.lifetime_points || 0
    );

    const newPoints = Math.max(
      0,
      currentPoints + signedPoints
    );

    const newLifetime =
      mode === "add"
        ? currentLifetime + amount
        : currentLifetime;

    const { error: rewardError } = await supabase
      .from("member_rewards")
      .upsert(
        {
          user_id: selectedRewardMember.user_id,
          points: newPoints,
          lifetime_points: newLifetime,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (rewardError) {
      setSaving(false);
      showMessage(rewardError.message);
      return;
    }

    const { error: transactionError } =
      await supabase
        .from("reward_transactions")
        .insert([
          {
            user_id: selectedRewardMember.user_id,
            points: signedPoints,
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
      showMessage(transactionError.message);
      return;
    }

    setShowPointsModal(false);
    setSelectedRewardMember(null);

    showMessage(
      mode === "add"
        ? `${amount} points added.`
        : `${amount} points deducted.`
    );

    await loadData();
  }

  function openCreateMilestone() {
    setEditingMilestone(null);
    setMilestoneForm(EMPTY_MILESTONE);
    setShowMilestoneForm(true);
  }

  function openEditMilestone(item) {
    setEditingMilestone(item);

    setMilestoneForm({
      title: item.title || "",
      description: item.description || "",
      points_required:
        item.points_required === null ||
        item.points_required === undefined
          ? ""
          : String(item.points_required),
      is_active: item.is_active ?? true,
    });

    setShowMilestoneForm(true);
  }

  async function saveMilestone(event) {
    event.preventDefault();

    const points = Number(
      milestoneForm.points_required
    );

    if (!milestoneForm.title.trim()) {
      showMessage("Milestone title is required.");
      return;
    }

    if (!Number.isFinite(points) || points < 0) {
      showMessage("Enter valid milestone points.");
      return;
    }

    const payload = {
      title: milestoneForm.title.trim(),
      description:
        milestoneForm.description.trim() || null,
      points_required: points,
      is_active: Boolean(milestoneForm.is_active),
    };

    let result;

    if (editingMilestone) {
      result = await supabase
        .from("reward_checkpoints")
        .update(payload)
        .eq("id", editingMilestone.id);
    } else {
      result = await supabase
        .from("reward_checkpoints")
        .insert([payload]);
    }

    if (result.error) {
      showMessage(result.error.message);
      return;
    }

    setShowMilestoneForm(false);
    setEditingMilestone(null);
    setMilestoneForm(EMPTY_MILESTONE);

    showMessage(
      editingMilestone
        ? "Milestone updated."
        : "Milestone created."
    );

    await loadData();
  }

  async function toggleMilestone(item) {
    const { error } = await supabase
      .from("reward_checkpoints")
      .update({
        is_active: !item.is_active,
      })
      .eq("id", item.id);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage(
      item.is_active
        ? "Milestone disabled."
        : "Milestone activated."
    );

    await loadData();
  }

  async function deleteMilestone(item) {
    if (
      !window.confirm(
        `Delete milestone "${item.title}"?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("reward_checkpoints")
      .delete()
      .eq("id", item.id);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage("Milestone deleted.");
    await loadData();
  }

  function openCreateOffer() {
    setEditingOffer(null);
    setOfferForm(EMPTY_OFFER);
    setShowOfferForm(true);
  }

  function openEditOffer(item) {
    setEditingOffer(item);

    setOfferForm({
      title: item.title || "",
      description: item.description || "",
      required_points:
        item.required_points === null ||
        item.required_points === undefined
          ? ""
          : String(item.required_points),
      benefit: item.benefit || "",
      discount_type:
        item.discount_type || "percentage",
      discount_value:
        item.discount_value === null ||
        item.discount_value === undefined
          ? ""
          : String(item.discount_value),
      is_active: item.is_active ?? true,
    });

    setShowOfferForm(true);
  }

  async function saveOffer(event) {
    event.preventDefault();

    if (!offerForm.title.trim()) {
      showMessage("Reward title is required.");
      return;
    }

    const requiredPoints = Number(
      offerForm.required_points
    );

    if (
      !Number.isFinite(requiredPoints) ||
      requiredPoints < 0
    ) {
      showMessage("Enter valid required points.");
      return;
    }

    const discountValue = Number(
      offerForm.discount_value || 0
    );

    if (
      offerForm.discount_type === "percentage" &&
      discountValue > 100
    ) {
      showMessage("Percentage cannot exceed 100%.");
      return;
    }

    const payload = {
      title: offerForm.title.trim(),
      description:
        offerForm.description.trim() || null,
      required_points: requiredPoints,
      benefit:
        offerForm.benefit.trim() || null,
      discount_type: offerForm.discount_type,
      discount_value: discountValue,
      discount_percent:
        offerForm.discount_type === "percentage"
          ? discountValue
          : 0,
      target_type: "community",
      is_active: Boolean(offerForm.is_active),
    };

    let result;

    if (editingOffer) {
      result = await supabase
        .from("community_offers")
        .update(payload)
        .eq("id", editingOffer.id);
    } else {
      result = await supabase
        .from("community_offers")
        .insert([payload]);
    }

    if (result.error) {
      showMessage(result.error.message);
      return;
    }

    setShowOfferForm(false);
    setEditingOffer(null);
    setOfferForm(EMPTY_OFFER);

    showMessage(
      editingOffer
        ? "Reward offer updated."
        : "Reward offer created."
    );

    await loadData();
  }

  async function toggleOffer(item) {
    const { error } = await supabase
      .from("community_offers")
      .update({
        is_active: !item.is_active,
      })
      .eq("id", item.id);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage(
      item.is_active
        ? "Reward offer disabled."
        : "Reward offer activated."
    );

    await loadData();
  }

  async function deleteOffer(item) {
    if (
      !window.confirm(
        `Delete reward "${item.title}"?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("community_offers")
      .delete()
      .eq("id", item.id);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage("Reward offer deleted.");
    await loadData();
  }

  // ============================================================
  // DERIVED DATA
  // ============================================================

  const confirmedBookings = bookings.filter(
    (booking) =>
      String(booking.status).toLowerCase() ===
      "confirmed"
  );

  const pendingBookings = bookings.filter(
    (booking) =>
      String(booking.status).toLowerCase() ===
      "pending"
  );

  const cancelledBookings = bookings.filter(
    (booking) =>
      String(booking.status).toLowerCase() ===
      "cancelled"
  );

  const revenue = confirmedBookings.reduce(
    (sum, booking) =>
      sum + Number(booking.total_amount || 0),
    0
  );

  const activeTurfs = turfs.filter(
    (turf) => turf.is_active
  ).length;

  const activeCoupons = coupons.filter(
    (coupon) => coupon.is_active
  ).length;

  const totalCouponUsage = couponUsages.length;

  const totalCurrentPoints = memberRewards.reduce(
    (sum, member) =>
      sum + Number(member.points || 0),
    0
  );

  const totalLifetimePoints = memberRewards.reduce(
    (sum, member) =>
      sum + Number(member.lifetime_points || 0),
    0
  );

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const turfMatches =
        turfFilter === "all" ||
        String(slot.turf_id) === String(turfFilter);

      const dateMatches =
        !slotDateFilter ||
        slot.slot_date === slotDateFilter;

      const searchValue = slotSearch
        .trim()
        .toLowerCase();

      const searchMatches =
        !searchValue ||
        slot.turfs?.name
          ?.toLowerCase()
          .includes(searchValue);

      return (
        turfMatches &&
        dateMatches &&
        searchMatches
      );
    });
  }, [
    slots,
    turfFilter,
    slotDateFilter,
    slotSearch,
  ]);

  const filteredBookings = useMemo(() => {
    const query = bookingSearch
      .trim()
      .toLowerCase();

    return bookings.filter((booking) => {
      const statusMatches =
        bookingStatusFilter === "all" ||
        booking.status === bookingStatusFilter;

      const text =
        `${booking.profiles?.full_name || ""} ${
          booking.profiles?.email || ""
        } ${
          booking.profiles?.phone || ""
        } ${
          booking.turfs?.name || ""
        }`.toLowerCase();

      const searchMatches =
        !query || text.includes(query);

      return statusMatches && searchMatches;
    });
  }, [
    bookings,
    bookingSearch,
    bookingStatusFilter,
  ]);

  const filteredUsers = useMemo(() => {
    const query = userSearch
      .trim()
      .toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
      const text =
        `${user.full_name || ""} ${
          user.email || ""
        } ${user.phone || ""}`.toLowerCase();

      return text.includes(query);
    });
  }, [users, userSearch]);

  const filteredCoupons = useMemo(() => {
    const query = couponSearch
      .trim()
      .toLowerCase();

    if (!query) return coupons;

    return coupons.filter((coupon) => {
      return (
        coupon.code
          ?.toLowerCase()
          .includes(query) ||
        coupon.title
          ?.toLowerCase()
          .includes(query) ||
        coupon.description
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [coupons, couponSearch]);

  const filteredRewardMembers = useMemo(() => {
    const query = rewardSearch
      .trim()
      .toLowerCase();

    if (!query) return memberRewards;

    return memberRewards.filter((member) => {
      const user = users.find(
        (item) => item.id === member.user_id
      );

      const text =
        `${user?.full_name || ""} ${
          user?.email || ""
        }`.toLowerCase();

      return text.includes(query);
    });
  }, [memberRewards, users, rewardSearch]);

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigation = [
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

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-icon">
          <ShieldCheck size={32} />
        </div>

        <h2>SPORTIVA ADMIN</h2>

        <p>Loading control center...</p>

        <div className="admin-loading-bar">
          <div />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">

      <aside className="admin-sidebar">

        <div className="admin-brand">
          <div className="admin-brand-mark">
            S
          </div>

          <div>
            <strong>SPORTIVA</strong>
            <span>ADMIN CONTROL</span>
          </div>
        </div>

        <div className="admin-sidebar-label">
          MANAGEMENT
        </div>

        <nav className="admin-navigation">

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={
                  activeTab === item.id
                    ? "active"
                    : ""
                }
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={17} />
                <span>{item.label}</span>

                {item.id === "bookings" &&
                  pendingBookings.length > 0 && (
                    <b className="admin-nav-count">
                      {pendingBookings.length}
                    </b>
                  )}

                {item.id === "coupons" &&
                  activeCoupons > 0 && (
                    <b className="admin-nav-count">
                      {activeCoupons}
                    </b>
                  )}
              </button>
            );
          })}

        </nav>

        <div className="admin-sidebar-footer">
          <div>
            <ShieldCheck size={15} />
            <span>SECURE ACCESS</span>
          </div>

          <small>
            Sportiva Management System
          </small>
        </div>

      </aside>

      <main className="admin-main">

        <header className="admin-topbar">

          <div>
            <span className="admin-topbar-label">
              THE SPORTIVA
            </span>

            <h1>
              {navigation.find(
                (item) => item.id === activeTab
              )?.label || "Overview"}
            </h1>
          </div>

          <button
            type="button"
            className="admin-refresh"
            onClick={loadData}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </header>

        {message && (
          <div className="admin-message">
            <Check size={16} />
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* ======================================================
            OVERVIEW
        ====================================================== */}

        {activeTab === "overview" && (
          <section className="admin-section">

            <div className="admin-hero-panel">

              <div>
                <span>SPORTIVA CONTROL CENTER</span>

                <h2>
                  Everything under
                  <br />
                  one roof.
                </h2>

                <p>
                  Monitor bookings, manage turf
                  availability, run promotions,
                  reward customers and keep the
                  facility updated in real time.
                </p>
              </div>

              <div className="admin-live-indicator">
                <span />
                LIVE
              </div>

            </div>

            <div className="admin-stat-grid">

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <Trophy size={19} />
                </div>

                <span>Active Turfs</span>
                <strong>{activeTurfs}</strong>
                <small>
                  {turfs.length} total facilities
                </small>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <CalendarDays size={19} />
                </div>

                <span>Total Slots</span>
                <strong>{slots.length}</strong>
                <small>
                  Scheduled time slots
                </small>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <ClipboardList size={19} />
                </div>

                <span>Bookings</span>
                <strong>{bookings.length}</strong>
                <small>
                  {pendingBookings.length} pending
                </small>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <Activity size={19} />
                </div>

                <span>Revenue</span>
                <strong>
                  ৳{revenue.toLocaleString()}
                </strong>
                <small>
                  Confirmed bookings
                </small>
              </div>

            </div>

            <div className="admin-stat-grid">

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <Users size={19} />
                </div>

                <span>Members</span>
                <strong>{users.length}</strong>
                <small>
                  Registered customer profiles
                </small>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <Gift size={19} />
                </div>

                <span>Reward Points</span>
                <strong>
                  {totalCurrentPoints.toLocaleString()}
                </strong>
                <small>
                  Current member balance
                </small>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <TicketPercent size={19} />
                </div>

                <span>Active Coupons</span>
                <strong>{activeCoupons}</strong>
                <small>
                  {totalCouponUsage} redemptions
                </small>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <Megaphone size={19} />
                </div>

                <span>Announcements</span>
                <strong>
                  {
                    announcements.filter(
                      (item) => item.is_active
                    ).length
                  }
                </strong>
                <small>
                  Active customer updates
                </small>
              </div>

            </div>

            <div className="admin-dashboard-grid">

              <div className="admin-panel">

                <div className="admin-panel-heading">
                  <div>
                    <span>BOOKING FLOW</span>
                    <h3>Booking Summary</h3>
                  </div>

                  <ClipboardList size={18} />
                </div>

                <div className="admin-summary-list">

                  <div>
                    <span>Confirmed</span>
                    <strong>
                      {confirmedBookings.length}
                    </strong>
                  </div>

                  <div>
                    <span>Pending</span>
                    <strong>
                      {pendingBookings.length}
                    </strong>
                  </div>

                  <div>
                    <span>Cancelled</span>
                    <strong>
                      {cancelledBookings.length}
                    </strong>
                  </div>

                </div>

              </div>

              <div className="admin-panel">

                <div className="admin-panel-heading">
                  <div>
                    <span>LOYALTY SYSTEM</span>
                    <h3>Rewards Summary</h3>
                  </div>

                  <Gift size={18} />
                </div>

                <div className="admin-summary-list">

                  <div>
                    <span>Members</span>
                    <strong>
                      {memberRewards.length}
                    </strong>
                  </div>

                  <div>
                    <span>Current Points</span>
                    <strong>
                      {totalCurrentPoints.toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span>Lifetime Points</span>
                    <strong>
                      {totalLifetimePoints.toLocaleString()}
                    </strong>
                  </div>

                </div>

              </div>

            </div>

          </section>
        )}

        {/* ======================================================
            TURFS
        ====================================================== */}

        {activeTab === "turfs" && (
          <section className="admin-section">

            <div className="admin-section-heading">
              <div>
                <span>FACILITY MANAGEMENT</span>
                <h2>Turfs</h2>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={openCreateTurf}
              >
                <Plus size={16} />
                Add Turf
              </button>
            </div>

            <div className="admin-card-grid">

              {turfs.map((turf) => (
                <div
                  className="admin-turf-card"
                  key={turf.id}
                >

                  <div className="admin-turf-image">
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
                          ? "admin-image-status active"
                          : "admin-image-status"
                      }
                    >
                      {turf.is_active
                        ? "ACTIVE"
                        : "DISABLED"}
                    </span>
                  </div>

                  <div className="admin-turf-content">

                    <div>
                      <span className="admin-card-eyebrow">
                        SPORTIVA FACILITY
                      </span>

                      <h3>{turf.name}</h3>

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

                    <div className="admin-card-actions">

                      <button
                        type="button"
                        onClick={() =>
                          openEditTurf(turf)
                        }
                      >
                        <Edit3 size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleTurf(turf)
                        }
                      >
                        {turf.is_active ? (
                          <X size={15} />
                        ) : (
                          <Check size={15} />
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
                        <Trash2 size={15} />
                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              ))}

            </div>

            {turfs.length === 0 && (
              <div className="admin-empty">
                <Trophy size={28} />
                <strong>No turfs yet.</strong>
                <span>
                  Create your first Sportiva facility.
                </span>
              </div>
            )}

          </section>
        )}

        {/* ======================================================
            TIME SLOTS
        ====================================================== */}

        {activeTab === "slots" && (
          <section className="admin-section">

            <div className="admin-section-heading">
              <div>
                <span>AVAILABILITY MANAGEMENT</span>
                <h2>Time Slots</h2>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={openCreateSlot}
              >
                <Plus size={16} />
                Add Time Slot
              </button>
            </div>

            <div className="admin-filter-bar">

              <div className="admin-filter-input">
                <Search size={15} />

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
                value={turfFilter}
                onChange={(event) =>
                  setTurfFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All Turfs
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
                value={slotDateFilter}
                onChange={(event) =>
                  setSlotDateFilter(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                className="admin-clear-filter"
                onClick={() => {
                  setTurfFilter("all");
                  setSlotDateFilter("");
                  setSlotSearch("");
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
                          <div className="admin-time-cell">
                            <Clock3 size={14} />
                            {formatTime(
                              slot.start_time
                            )}
                            <span>—</span>
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
                                : "muted"
                            }
                          >
                            {slot.is_available
                              ? "Available"
                              : "Disabled"}
                          </StatusBadge>
                        </td>

                        <td>
                          <div className="admin-table-actions">

                            <button
                              type="button"
                              onClick={() =>
                                openEditSlot(slot)
                              }
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleSlot(slot)
                              }
                            >
                              {slot.is_available ? (
                                <X size={14} />
                              ) : (
                                <Check size={14} />
                              )}
                            </button>

                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                deleteSlot(slot)
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
                  No time slots match your filters.
                </div>
              )}

            </div>

          </section>
        )}

        {/* ======================================================
            BOOKINGS
        ====================================================== */}

        {activeTab === "bookings" && (
          <section className="admin-section">

            <div className="admin-section-heading">
              <div>
                <span>RESERVATION CONTROL</span>
                <h2>Bookings</h2>
              </div>

              <strong className="admin-heading-count">
                {bookings.length} TOTAL
              </strong>
            </div>

            <div className="admin-filter-bar">

              <div className="admin-filter-input">
                <Search size={15} />

                <input
                  type="text"
                  placeholder="Search customer, turf or email..."
                  value={bookingSearch}
                  onChange={(event) =>
                    setBookingSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={bookingStatusFilter}
                onChange={(event) =>
                  setBookingStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All Statuses
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
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredBookings.map(
                      (booking) => (
                        <tr key={booking.id}>

                          <td>
                            <div className="admin-person-cell">

                              <div className="admin-mini-avatar">
                                {booking.profiles?.full_name
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "U"}
                              </div>

                              <div>
                                <strong>
                                  {booking.profiles
                                    ?.full_name ||
                                    "Unknown User"}
                                </strong>

                                <small>
                                  {booking.profiles
                                    ?.email ||
                                    booking.profiles
                                      ?.phone ||
                                    "No contact"}
                                </small>
                              </div>

                            </div>
                          </td>

                          <td>
                            {booking.turfs?.name ||
                              "Unknown Turf"}
                          </td>

                          <td>
                            <div className="admin-schedule-cell">
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
                              <div className="admin-table-actions">

                                <button
                                  type="button"
                                  className="success"
                                  onClick={() =>
                                    updateBookingStatus(
                                      booking,
                                      "confirmed"
                                    )
                                  }
                                  title="Confirm"
                                >
                                  <Check size={14} />
                                </button>

                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() =>
                                    updateBookingStatus(
                                      booking,
                                      "cancelled"
                                    )
                                  }
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>

                              </div>
                            ) : (
                              <span className="admin-muted-text">
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

              {filteredBookings.length === 0 && (
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

        {activeTab === "users" && (
          <section className="admin-section">

            <div className="admin-section-heading">
              <div>
                <span>CUSTOMER MANAGEMENT</span>
                <h2>Users</h2>
              </div>

              <strong className="admin-heading-count">
                {users.length} MEMBERS
              </strong>
            </div>

            <div className="admin-filter-bar">

              <div className="admin-filter-input">
                <Search size={15} />

                <input
                  type="text"
                  placeholder="Search name, email or phone..."
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

                    {filteredUsers.map((user) => (
                      <tr key={user.id}>

                        <td>
                          <div className="admin-person-cell">

                            <div className="admin-mini-avatar">
                              {user.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "U"}
                            </div>

                            <div>
                              <strong>
                                {user.full_name ||
                                  "Unnamed Member"}
                              </strong>

                              <small>
                                {user.id.slice(0, 8)}
                              </small>
                            </div>

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
                    ))}

                  </tbody>

                </table>

              </div>

              {filteredUsers.length === 0 && (
                <div className="admin-table-empty">
                  No users found.
                </div>
              )}

            </div>

          </section>
        )}

        {/* ======================================================
            REWARDS
        ====================================================== */}

        {activeTab === "rewards" && (
          <section className="admin-section">

            <div className="admin-section-heading">
              <div>
                <span>LOYALTY CONTROL</span>
                <h2>Sportiva Rewards</h2>
              </div>
            </div>

            <div className="admin-subtabs">

              {[
                ["overview", "Overview"],
                ["members", "Member Points"],
                ["milestones", "Milestones"],
                ["offers", "Reward Offers"],
                ["history", "Reward History"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={
                    rewardTab === id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setRewardTab(id)
                  }
                >
                  {label}
                </button>
              ))}

            </div>

            {rewardTab === "overview" && (
              <div>

                <div className="admin-stat-grid">

                  <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                      <Users size={18} />
                    </div>

                    <span>Reward Members</span>
                    <strong>
                      {memberRewards.length}
                    </strong>

                    <small>
                      Members with reward accounts
                    </small>
                  </div>

                  <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                      <Gift size={18} />
                    </div>

                    <span>Current Points</span>
                    <strong>
                      {totalCurrentPoints.toLocaleString()}
                    </strong>

                    <small>
                      Spendable member points
                    </small>
                  </div>

                  <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                      <Activity size={18} />
                    </div>

                    <span>Lifetime Points</span>
                    <strong>
                      {totalLifetimePoints.toLocaleString()}
                    </strong>

                    <small>
                      Total earned points
                    </small>
                  </div>

                  <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                      <Gift size={18} />
                    </div>

                    <span>Active Offers</span>
                    <strong>
                      {
                        communityOffers.filter(
                          (offer) =>
                            offer.is_active
                        ).length
                      }
                    </strong>

                    <small>
                      Redeemable rewards
                    </small>
                  </div>

                </div>

                <div className="admin-panel">

                  <div className="admin-panel-heading">
                    <div>
                      <span>PROGRAM STRUCTURE</span>
                      <h3>
                        Reward milestones
                      </h3>
                    </div>
                  </div>

                  <div className="admin-milestone-grid">

                    {rewardCheckpoints.map(
                      (checkpoint) => (
                        <div
                          className="admin-milestone-card"
                          key={checkpoint.id}
                        >
                          <span>
                            {checkpoint.points_required}{" "}
                            POINTS
                          </span>

                          <strong>
                            {checkpoint.title}
                          </strong>

                          <p>
                            {checkpoint.description ||
                              "No description."}
                          </p>
                        </div>
                      )
                    )}

                  </div>

                </div>

              </div>
            )}

            {rewardTab === "members" && (
              <div>

                <div className="admin-toolbar-row">

                  <div className="admin-filter-input">
                    <Search size={15} />

                    <input
                      type="text"
                      placeholder="Search member..."
                      value={rewardSearch}
                      onChange={(event) =>
                        setRewardSearch(
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
                          <th>Points</th>
                          <th>Lifetime</th>
                          <th>Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>

                        {filteredRewardMembers.map(
                          (member) => {
                            const user = users.find(
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
                                  <div className="admin-person-cell">

                                    <div className="admin-mini-avatar">
                                      {user?.full_name
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                        "U"}
                                    </div>

                                    <div>
                                      <strong>
                                        {user?.full_name ||
                                          "Unknown Member"}
                                      </strong>

                                      <small>
                                        {user?.email ||
                                          member.user_id.slice(
                                            0,
                                            8
                                          )}
                                      </small>
                                    </div>

                                  </div>
                                </td>

                                <td>
                                  <strong>
                                    {Number(
                                      member.points || 0
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
                                      openAdjustPoints(
                                        member
                                      )
                                    }
                                  >
                                    <Edit3 size={14} />
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

                  {filteredRewardMembers.length ===
                    0 && (
                    <div className="admin-table-empty">
                      No reward members found.
                    </div>
                  )}

                </div>

              </div>
            )}

            {rewardTab === "milestones" && (
              <div>

                <div className="admin-section-heading compact">

                  <div>
                    <span>REWARD PROGRESSION</span>
                    <h3>
                      Membership Milestones
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={
                      openCreateMilestone
                    }
                  >
                    <Plus size={15} />
                    Add Milestone
                  </button>

                </div>

                <div className="admin-list-card">

                  {rewardCheckpoints.map(
                    (item) => (
                      <div
                        className="admin-list-row"
                        key={item.id}
                      >

                        <div className="admin-list-main">

                          <div className="admin-list-icon">
                            <Trophy size={17} />
                          </div>

                          <div>
                            <strong>
                              {item.title}
                            </strong>

                            <small>
                              {
                                item.points_required
                              }{" "}
                              points

                              {item.description
                                ? ` · ${item.description}`
                                : ""}
                            </small>
                          </div>

                        </div>

                        <div className="admin-list-actions">

                          <StatusBadge
                            type={
                              item.is_active
                                ? "success"
                                : "muted"
                            }
                          >
                            {item.is_active
                              ? "Active"
                              : "Disabled"}
                          </StatusBadge>

                          <button
                            type="button"
                            onClick={() =>
                              openEditMilestone(
                                item
                              )
                            }
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleMilestone(
                                item
                              )
                            }
                          >
                            {item.is_active ? (
                              <X size={14} />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>

                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              deleteMilestone(
                                item
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {rewardTab === "offers" && (
              <div>

                <div className="admin-section-heading compact">

                  <div>
                    <span>REDEMPTION CATALOG</span>
                    <h3>
                      Reward Offers
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={openCreateOffer}
                  >
                    <Plus size={15} />
                    Add Reward
                  </button>

                </div>

                <div className="admin-card-grid">

                  {communityOffers.map(
                    (offer) => (
                      <div
                        className="admin-reward-card"
                        key={offer.id}
                      >

                        <div className="admin-reward-card-top">

                          <div className="admin-reward-icon">
                            <Gift size={18} />
                          </div>

                          <StatusBadge
                            type={
                              offer.is_active
                                ? "success"
                                : "muted"
                            }
                          >
                            {offer.is_active
                              ? "Active"
                              : "Disabled"}
                          </StatusBadge>

                        </div>

                        <span className="admin-card-eyebrow">
                          {offer.required_points} POINTS
                        </span>

                        <h3>
                          {offer.title}
                        </h3>

                        <p>
                          {offer.description ||
                            "Reward offer"}
                        </p>

                        <strong className="admin-benefit">
                          {offer.benefit ||
                            "Member benefit"}
                        </strong>

                        {Number(
                          offer.discount_value || 0
                        ) > 0 && (
                          <small className="admin-discount-text">
                            {offer.discount_type ===
                            "percentage"
                              ? `${offer.discount_value}% discount`
                              : `৳${Number(
                                  offer.discount_value
                                ).toLocaleString()} discount`}
                          </small>
                        )}

                        <div className="admin-card-actions">

                          <button
                            type="button"
                            onClick={() =>
                              openEditOffer(
                                offer
                              )
                            }
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleOffer(
                                offer
                              )
                            }
                          >
                            {offer.is_active ? (
                              <X size={14} />
                            ) : (
                              <Check size={14} />
                            )}

                            {offer.is_active
                              ? "Disable"
                              : "Enable"}
                          </button>

                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              deleteOffer(
                                offer
                              )
                            }
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {rewardTab === "history" && (
              <div className="admin-dashboard-grid">

                <div className="admin-panel">

                  <div className="admin-panel-heading">
                    <div>
                      <span>POINT ACTIVITY</span>
                      <h3>
                        Reward Transactions
                      </h3>
                    </div>
                  </div>

                  <div className="admin-history-list">

                    {rewardTransactions
                      .slice(0, 30)
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

                          <div
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
                          </div>

                        </div>
                      ))}

                  </div>

                </div>

                <div className="admin-panel">

                  <div className="admin-panel-heading">
                    <div>
                      <span>REDEMPTIONS</span>
                      <h3>
                        Reward Redemptions
                      </h3>
                    </div>
                  </div>

                  <div className="admin-history-list">

                    {rewardRedemptions
                      .slice(0, 30)
                      .map((item) => (
                        <div
                          className="admin-history-row"
                          key={item.id}
                        >

                          <div>
                            <strong>
                              Redemption
                            </strong>

                            <small>
                              {item.status ||
                                "Processed"}
                            </small>
                          </div>

                          <div className="negative">
                            -{item.points_used || 0}
                          </div>

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

        {activeTab === "coupons" && (
          <section className="admin-section">

            <div className="admin-section-heading">

              <div>
                <span>PROMOTION CONTROL</span>

                <h2>Coupons</h2>

                <p className="admin-heading-description">
                  Create and manage promotional codes
                  customers can use during booking.
                </p>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={openCreateCoupon}
              >
                <Plus size={16} />
                Create Coupon
              </button>

            </div>

            <div className="admin-stat-grid">

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <TicketPercent size={18} />
                </div>

                <span>Total Coupons</span>
                <strong>{coupons.length}</strong>
                <small>
                  All created promotional codes
                </small>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <Check size={18} />
                </div>

                <span>Active</span>
                <strong>{activeCoupons}</strong>
                <small>
                  Currently available codes
                </small>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <Activity size={18} />
                </div>

                <span>Redemptions</span>
                <strong>{totalCouponUsage}</strong>
                <small>
                  Total recorded usage
                </small>
              </div>

            </div>

            <div className="admin-filter-bar">

              <div className="admin-filter-input">
                <Search size={15} />

                <input
                  type="text"
                  placeholder="Search coupon code or title..."
                  value={couponSearch}
                  onChange={(event) =>
                    setCouponSearch(
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
                      <th>Coupon</th>
                      <th>Discount</th>
                      <th>Usage</th>
                      <th>Validity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredCoupons.map(
                      (coupon) => {
                        const usageCount =
                          couponUsages.filter(
                            (usage) =>
                              String(
                                usage.coupon_id
                              ) ===
                              String(coupon.id)
                          ).length;

                        const now = Date.now();

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

                              <div className="admin-coupon-cell">

                                <div className="admin-coupon-icon">
                                  <TicketPercent
                                    size={17}
                                  />
                                </div>

                                <div>
                                  <strong>
                                    {coupon.code}
                                  </strong>

                                  <small>
                                    {coupon.title ||
                                      "Sportiva promotion"}
                                  </small>
                                </div>

                                <button
                                  type="button"
                                  className="admin-copy-button"
                                  onClick={() =>
                                    copyCouponCode(
                                      coupon.code
                                    )
                                  }
                                >
                                  <span>
                                    <ClipboardList
                                      size={12}
                                    />
                                  </span>
                                </button>

                              </div>

                            </td>

                            <td>
                              <div className="admin-discount-cell">

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

                                {Number(
                                  coupon.min_booking_amount ||
                                    0
                                ) > 0 && (
                                  <small>
                                    Min ৳
                                    {Number(
                                      coupon.min_booking_amount
                                    ).toLocaleString()}
                                  </small>
                                )}

                              </div>
                            </td>

                            <td>
                              <strong>
                                {usageCount}
                              </strong>

                              <span className="admin-usage-limit">
                                {coupon.usage_limit
                                  ? ` / ${coupon.usage_limit}`
                                  : " / Unlimited"}
                              </span>
                            </td>

                            <td>
                              <div className="admin-coupon-validity">

                                <span>
                                  {coupon.starts_at
                                    ? formatDateTime(
                                        coupon.starts_at
                                      )
                                    : "Immediately"}
                                </span>

                                <span className="admin-validity-arrow">
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
                                <StatusBadge type="muted">
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

                              <div className="admin-table-actions">

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditCoupon(
                                      coupon
                                    )
                                  }
                                  title="Edit"
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
                                  title={
                                    coupon.is_active
                                      ? "Disable"
                                      : "Enable"
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
                                  title="Delete"
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

              {filteredCoupons.length === 0 && (
                <div className="admin-empty">
                  <div className="admin-empty-icon">
                    <TicketPercent size={26} />
                  </div>

                  <strong>
                    No coupons found
                  </strong>

                  <span>
                    Create your first Sportiva
                    promotion.
                  </span>
                </div>
              )}

            </div>

          </section>
        )}

        {/* ======================================================
            ANNOUNCEMENTS
        ====================================================== */}

        {activeTab === "announcements" && (
          <section className="admin-section">

            <div className="admin-section-heading">

              <div>
                <span>COMMUNICATION CONTROL</span>
                <h2>Announcements</h2>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={() =>
                  setShowAnnouncementForm(
                    (value) => !value
                  )
                }
              >
                <Plus size={16} />
                New Announcement
              </button>

            </div>

            {showAnnouncementForm && (
              <form
                className="admin-form-panel"
                onSubmit={
                  createAnnouncement
                }
              >

                <div className="admin-form-grid">

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

                  <label className="full">
                    Message

                    <textarea
                      rows="4"
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
                      placeholder="Write the message customers will see..."
                    />
                  </label>

                </div>

                <div className="admin-form-actions">

                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() =>
                      setShowAnnouncementForm(
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
            )}

            <div className="admin-list-card">

              {announcements.map(
                (announcement) => (
                  <div
                    className="admin-list-row announcement-row"
                    key={announcement.id}
                  >

                    <div className="admin-list-main">

                      <div className="admin-list-icon">
                        <Megaphone size={17} />
                      </div>

                      <div>
                        <strong>
                          {announcement.title}
                        </strong>

                        <small>
                          {announcement.message ||
                            "No message"}
                        </small>

                        <small>
                          Published{" "}
                          {formatDateTime(
                            announcement.created_at
                          )}
                        </small>
                      </div>

                    </div>

                    <div className="admin-list-actions">

                      <StatusBadge
                        type={
                          announcement.is_active
                            ? "success"
                            : "muted"
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

              {announcements.length === 0 && (
                <div className="admin-empty">
                  <Megaphone size={26} />
                  <strong>
                    No announcements yet.
                  </strong>
                  <span>
                    Publish an update for customers.
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

      {showTurfForm && (
        <div className="admin-modal-backdrop">

          <div className="admin-modal">

            <div className="admin-modal-header">
              <div>
                <span>FACILITY MANAGEMENT</span>
                <h2>
                  {editingTurf
                    ? "Edit Turf"
                    : "Add Turf"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowTurfForm(false)
                }
              >
                <X size={18} />
              </button>
            </div>

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
                  value={turfForm.description}
                  onChange={(event) =>
                    setTurfForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Describe the facility..."
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
                    placeholder="2500"
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

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    setShowTurfForm(false)
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

          </div>

        </div>
      )}

      {/* ========================================================
          SLOT MODAL
      ======================================================== */}

      {showSlotForm && (
        <div className="admin-modal-backdrop">

          <div className="admin-modal">

            <div className="admin-modal-header">
              <div>
                <span>
                  AVAILABILITY MANAGEMENT
                </span>
                <h2>
                  {editingSlot
                    ? "Edit Time Slot"
                    : "Add Time Slot"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSlotForm(false)
                }
              >
                <X size={18} />
              </button>
            </div>

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
                      Select Turf
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
                    value={slotForm.slot_date}
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
                    value={slotForm.end_time}
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

              <label className="admin-checkbox-row">

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
                  Slot available for booking
                </span>

              </label>

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    setShowSlotForm(false)
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

          </div>

        </div>
      )}

      {/* ========================================================
          COUPON MODAL
      ======================================================== */}

      {showCouponForm && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              setShowCouponForm(false);
            }
          }}
        >

          <div className="admin-modal admin-coupon-modal">

            <div className="admin-modal-header">

              <div>
                <span>
                  SPORTIVA PROMOTION SYSTEM
                </span>

                <h2>
                  {editingCoupon
                    ? "Edit Coupon"
                    : "Create Coupon"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCouponForm(false)
                }
              >
                <X size={18} />
              </button>

            </div>

            <form
              className="admin-modal-form"
              onSubmit={saveCoupon}
            >

              <div className="admin-form-grid">

                <label className="full">
                  Coupon Code

                  <div className="admin-code-row">

                    <input
                      type="text"
                      value={
                        couponForm.code
                      }
                      onChange={(event) =>
                        setCouponForm(
                          (current) => ({
                            ...current,
                            code: event.target.value.toUpperCase(),
                          })
                        )
                      }
                      placeholder="SPORTIVA-XXXXXX"
                      required
                    />

                    <button
                      type="button"
                      className="admin-generate-button"
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

                  <div className="admin-input-symbol">

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
                      placeholder={
                        couponForm.discount_type ===
                        "percentage"
                          ? "10"
                          : "300"
                      }
                      required
                    />

                    <span>
                      {couponForm.discount_type ===
                      "percentage"
                        ? "%"
                        : "৳"}
                    </span>

                  </div>
                </label>

                <label>
                  Minimum Booking

                  <div className="admin-input-symbol">

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

                    <span>৳</span>

                  </div>
                </label>

                <label>
                  Maximum Discount

                  <div className="admin-input-symbol">

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

                    <span>৳</span>

                  </div>
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
                    placeholder="Describe this promotion..."
                  />
                </label>

              </div>

              <label className="admin-checkbox-row">

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

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    setShowCouponForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="admin-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      {editingCoupon
                        ? "Save Changes"
                        : "Create Coupon"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ========================================================
          MILESTONE MODAL
      ======================================================== */}

      {showMilestoneForm && (
        <div className="admin-modal-backdrop">

          <div className="admin-modal">

            <div className="admin-modal-header">

              <div>
                <span>
                  REWARD PROGRESSION
                </span>

                <h2>
                  {editingMilestone
                    ? "Edit Milestone"
                    : "Create Milestone"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowMilestoneForm(false)
                }
              >
                <X size={18} />
              </button>

            </div>

            <form
              className="admin-modal-form"
              onSubmit={saveMilestone}
            >

              <label>
                Title

                <input
                  type="text"
                  value={
                    milestoneForm.title
                  }
                  onChange={(event) =>
                    setMilestoneForm(
                      (current) => ({
                        ...current,
                        title:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Pro Player"
                  required
                />
              </label>

              <label>
                Required Points

                <input
                  type="number"
                  min="0"
                  value={
                    milestoneForm.points_required
                  }
                  onChange={(event) =>
                    setMilestoneForm(
                      (current) => ({
                        ...current,
                        points_required:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="150"
                  required
                />
              </label>

              <label>
                Description

                <textarea
                  rows="4"
                  value={
                    milestoneForm.description
                  }
                  onChange={(event) =>
                    setMilestoneForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Describe this membership milestone..."
                />
              </label>

              <label className="admin-checkbox-row">

                <input
                  type="checkbox"
                  checked={
                    milestoneForm.is_active
                  }
                  onChange={(event) =>
                    setMilestoneForm(
                      (current) => ({
                        ...current,
                        is_active:
                          event.target.checked,
                      })
                    )
                  }
                />

                <span>
                  Milestone is active
                </span>

              </label>

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    setShowMilestoneForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                >
                  <Check size={15} />
                  {editingMilestone
                    ? "Save Changes"
                    : "Create Milestone"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ========================================================
          REWARD OFFER MODAL
      ======================================================== */}

      {showOfferForm && (
        <div className="admin-modal-backdrop">

          <div className="admin-modal">

            <div className="admin-modal-header">

              <div>
                <span>
                  REWARD CATALOG
                </span>

                <h2>
                  {editingOffer
                    ? "Edit Reward"
                    : "Create Reward"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowOfferForm(false)
                }
              >
                <X size={18} />
              </button>

            </div>

            <form
              className="admin-modal-form"
              onSubmit={saveOffer}
            >

              <label>
                Reward Title

                <input
                  type="text"
                  value={offerForm.title}
                  onChange={(event) =>
                    setOfferForm(
                      (current) => ({
                        ...current,
                        title:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="5% Booking Discount"
                  required
                />
              </label>

              <div className="admin-form-grid">

                <label>
                  Required Points

                  <input
                    type="number"
                    min="0"
                    value={
                      offerForm.required_points
                    }
                    onChange={(event) =>
                      setOfferForm(
                        (current) => ({
                          ...current,
                          required_points:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="100"
                    required
                  />
                </label>

                <label>
                  Discount Type

                  <select
                    value={
                      offerForm.discount_type
                    }
                    onChange={(event) =>
                      setOfferForm(
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
                    value={
                      offerForm.discount_value
                    }
                    onChange={(event) =>
                      setOfferForm(
                        (current) => ({
                          ...current,
                          discount_value:
                            event.target.value,
                        })
                      )
                    }
                    placeholder={
                      offerForm.discount_type ===
                      "percentage"
                        ? "5"
                        : "300"
                    }
                  />
                </label>

                <label>
                  Benefit

                  <input
                    type="text"
                    value={
                      offerForm.benefit
                    }
                    onChange={(event) =>
                      setOfferForm(
                        (current) => ({
                          ...current,
                          benefit:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="5% off your next booking"
                  />
                </label>

              </div>

              <label>
                Description

                <textarea
                  rows="4"
                  value={
                    offerForm.description
                  }
                  onChange={(event) =>
                    setOfferForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Explain the reward..."
                />
              </label>

              <label className="admin-checkbox-row">

                <input
                  type="checkbox"
                  checked={
                    offerForm.is_active
                  }
                  onChange={(event) =>
                    setOfferForm(
                      (current) => ({
                        ...current,
                        is_active:
                          event.target.checked,
                      })
                    )
                  }
                />

                <span>
                  Reward offer is active
                </span>

              </label>

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    setShowOfferForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                >
                  <Check size={15} />
                  {editingOffer
                    ? "Save Changes"
                    : "Create Reward"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ========================================================
          POINTS MODAL
      ======================================================== */}

      {showPointsModal &&
        selectedRewardMember && (
          <div className="admin-modal-backdrop">

            <div className="admin-modal admin-small-modal">

              <div className="admin-modal-header">

                <div>
                  <span>
                    REWARD MANAGEMENT
                  </span>

                  <h2>
                    Adjust Points
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowPointsModal(false)
                  }
                >
                  <X size={18} />
                </button>

              </div>

              <div className="admin-points-member">

                <div className="admin-mini-avatar">
                  {users
                    .find(
                      (user) =>
                        user.id ===
                        selectedRewardMember.user_id
                    )
                    ?.full_name?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>

                <div>
                  <strong>
                    {
                      users.find(
                        (user) =>
                          user.id ===
                          selectedRewardMember.user_id
                      )?.full_name
                    }
                  </strong>

                  <small>
                    Current points:{" "}
                    {
                      selectedRewardMember.points
                    }
                  </small>
                </div>

              </div>

              <div className="admin-modal-form">

                <label>
                  Points Amount

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
                    placeholder="Admin adjustment reason..."
                  />
                </label>

                <div className="admin-form-actions">

                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() =>
                      setShowPointsModal(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() =>
                      adjustPoints("add")
                    }
                    disabled={saving}
                  >
                    <Plus size={15} />
                    Add Points
                  </button>

                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={() =>
                      adjustPoints("remove")
                    }
                    disabled={saving}
                  >
                    <X size={15} />
                    Deduct
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}