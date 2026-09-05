import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Gift,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  Trophy,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";
import "./Admin.css";

const TABS = {
  OVERVIEW: "overview",
  TURFS: "turfs",
  SLOTS: "slots",
  BOOKINGS: "bookings",
  USERS: "users",
  REWARDS: "rewards",
  ANNOUNCEMENTS: "announcements",
};

const getTodayString = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-BD",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatTime = (value) => {
  if (!value) return "—";

  const [hourString, minuteString] = value.split(":");

  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour)) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `৳${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const normalizeStatus = (value) =>
  String(value || "pending").toLowerCase().trim();

const getInitialSlotForm = () => ({
  turf_id: "",
  slot_date: getTodayString(),
  start_time: "",
  end_time: "",
  is_available: true,
});

const getInitialMilestoneForm = () => ({
  title: "",
  description: "",
  points_required: "",
  is_active: true,
});

const getInitialOfferForm = () => ({
  title: "",
  description: "",
  required_points: "",
  benefit: "",
  discount_type: "percentage",
  discount_value: "",
  target_type: "community",
  is_active: true,
});

function LoadingScreen() {
  return (
    <div className="admin-loading">
      <div className="admin-loading-icon">
        <ShieldCheck size={25} />
      </div>

      <strong>SPORTIVA ADMIN</strong>

      <p>Loading management console...</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  return (
    <span className={`status ${normalized}`}>
      {normalized}
    </span>
  );
}

function MenuButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      className={`admin-nav ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}

function Admin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [errorMessage, setErrorMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [turfs, setTurfs] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);

  /* =========================================================
     TURF STATE
     ========================================================= */

  const [showTurfForm, setShowTurfForm] = useState(false);
  const [editingTurf, setEditingTurf] = useState(null);

  const [turfForm, setTurfForm] = useState({
    name: "",
    description: "",
    price_per_hour: "",
    image_url: "",
    is_active: true,
  });

  /* =========================================================
     SLOT STATE
     ========================================================= */

  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState(getInitialSlotForm());

  const [slotTurfFilter, setSlotTurfFilter] = useState("all");
  const [slotDateFilter, setSlotDateFilter] = useState("");

  /* =========================================================
     BOOKING STATE
     ========================================================= */

  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] =
    useState("all");

  const [bookingTurfFilter, setBookingTurfFilter] =
    useState("all");

  const [bookingDateFilter, setBookingDateFilter] =
    useState("");

  const [processingBookingId, setProcessingBookingId] =
    useState(null);

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  /* =========================================================
     ANNOUNCEMENT STATE
     ========================================================= */

  const [showAnnouncementForm, setShowAnnouncementForm] =
    useState(false);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    is_active: true,
  });

  /* =========================================================
     REWARD STATE
     ========================================================= */

  const [rewardMembers, setRewardMembers] = useState([]);
  const [rewardTransactions, setRewardTransactions] =
    useState([]);
  const [rewardRedemptions, setRewardRedemptions] =
    useState([]);
  const [rewardCheckpoints, setRewardCheckpoints] =
    useState([]);
  const [rewardOffers, setRewardOffers] = useState([]);

  const [rewardSubTab, setRewardSubTab] =
    useState("overview");

  const [rewardSearch, setRewardSearch] = useState("");

  const [showMilestoneForm, setShowMilestoneForm] =
    useState(false);

  const [editingMilestone, setEditingMilestone] =
    useState(null);

  const [milestoneForm, setMilestoneForm] = useState(
    getInitialMilestoneForm()
  );

  const [showOfferForm, setShowOfferForm] = useState(false);

  const [editingOffer, setEditingOffer] =
    useState(null);

  const [offerForm, setOfferForm] = useState(
    getInitialOfferForm()
  );

  const [showPointsForm, setShowPointsForm] =
    useState(false);

  const [selectedRewardMember, setSelectedRewardMember] =
    useState(null);

  const [pointsForm, setPointsForm] = useState({
    points: "",
    action: "add",
    description: "",
  });

  /* =========================================================
     HELPERS
     ========================================================= */

  const getTurfName = useCallback(
    (turfId) => {
      const turf = turfs.find(
        (item) => String(item.id) === String(turfId)
      );

      return turf?.name || "Unknown Turf";
    },
    [turfs]
  );

  const getProfile = useCallback(
    (userId) => {
      return (
        users.find((item) => item.id === userId) ||
        null
      );
    },
    [users]
  );

  /* =========================================================
     ADMIN AUTH
     ========================================================= */

  const verifyAdmin = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    const { data: adminRecord, error: adminError } =
      await supabase
        .from("admin_users")
        .select("user_id, username")
        .eq("user_id", user.id)
        .maybeSingle();

    if (adminError) {
      throw new Error(adminError.message);
    }

    if (!adminRecord) {
      throw new Error(
        "This account does not have admin access."
      );
    }

    setAdminEmail(
      user.email ||
        adminRecord.username ||
        "Administrator"
    );

    return user;
  }, []);

  /* =========================================================
     LOAD DATA
     ========================================================= */

  const loadData = useCallback(async () => {
    const [
      turfsResult,
      slotsResult,
      bookingsResult,
      announcementsResult,
      usersResult,
      rewardsResult,
      transactionsResult,
      redemptionsResult,
      checkpointsResult,
      offersResult,
    ] = await Promise.all([
      supabase
        .from("turfs")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("time_slots")
        .select("*")
        .order("slot_date", {
          ascending: true,
        })
        .order("start_time", {
          ascending: true,
        }),

      supabase
        .from("bookings")
        .select("*")
        .order("booking_date", {
          ascending: false,
        })
        .order("start_time", {
          ascending: false,
        }),

      supabase
        .from("announcements")
        .select("*")
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
        .from("member_rewards")
        .select("*")
        .order("points", {
          ascending: false,
        }),

      supabase
        .from("reward_transactions")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(100),

      supabase
        .from("reward_redemptions")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(100),

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
    ]);

    if (turfsResult.error) {
      throw new Error(turfsResult.error.message);
    }

    if (slotsResult.error) {
      throw new Error(slotsResult.error.message);
    }

    if (bookingsResult.error) {
      throw new Error(bookingsResult.error.message);
    }

    if (announcementsResult.error) {
      throw new Error(
        announcementsResult.error.message
      );
    }

    if (usersResult.error) {
      throw new Error(usersResult.error.message);
    }

    if (rewardsResult.error) {
      console.error(
        "Member rewards error:",
        rewardsResult.error
      );
    }

    if (transactionsResult.error) {
      console.error(
        "Reward transactions error:",
        transactionsResult.error
      );
    }

    if (redemptionsResult.error) {
      console.error(
        "Reward redemptions error:",
        redemptionsResult.error
      );
    }

    if (checkpointsResult.error) {
      console.error(
        "Reward checkpoints error:",
        checkpointsResult.error
      );
    }

    if (offersResult.error) {
      console.error(
        "Reward offers error:",
        offersResult.error
      );
    }

    setTurfs(turfsResult.data || []);
    setSlots(slotsResult.data || []);
    setBookings(bookingsResult.data || []);
    setAnnouncements(
      announcementsResult.data || []
    );
    setUsers(usersResult.data || []);

    setRewardMembers(
      rewardsResult.data || []
    );

    setRewardTransactions(
      transactionsResult.data || []
    );

    setRewardRedemptions(
      redemptionsResult.data || []
    );

    setRewardCheckpoints(
      checkpointsResult.data || []
    );

    setRewardOffers(
      offersResult.data || []
    );
  }, []);

  const refreshData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setRefreshing(true);
      }

      setErrorMessage("");

      try {
        await verifyAdmin();
        await loadData();
      } catch (error) {
        console.error(error);

        setErrorMessage(
          error.message ||
            "Unable to load admin data."
        );
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [loadData, verifyAdmin]
  );

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const channel = supabase
      .channel("sportiva-admin-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => refreshData(true)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "time_slots",
        },
        () => refreshData(true)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "member_rewards",
        },
        () => refreshData(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    navigate("/admin/login", {
      replace: true,
    });
  };

  /* =========================================================
     TURF MANAGEMENT
     ========================================================= */

  const openAddTurfForm = () => {
    setEditingTurf(null);

    setTurfForm({
      name: "",
      description: "",
      price_per_hour: "",
      image_url: "",
      is_active: true,
    });

    setShowTurfForm(true);
  };

  const openEditTurfForm = (turf) => {
    setEditingTurf(turf);

    setTurfForm({
      name: turf.name || "",
      description: turf.description || "",
      price_per_hour:
        turf.price_per_hour ?? "",
      image_url: turf.image_url || "",
      is_active: turf.is_active ?? true,
    });

    setShowTurfForm(true);
  };

  const closeTurfForm = () => {
    setShowTurfForm(false);
    setEditingTurf(null);
  };

  const handleTurfSubmit = async (event) => {
    event.preventDefault();

    const name = turfForm.name.trim();
    const description =
      turfForm.description.trim();

    const price = Number(
      turfForm.price_per_hour
    );

    const imageUrl =
      turfForm.image_url.trim();

    if (!name) {
      alert("Please enter the turf name.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    try {
      setRefreshing(true);

      const payload = {
        name,
        description,
        price_per_hour: price,
        image_url: imageUrl || null,
        is_active: Boolean(
          turfForm.is_active
        ),
      };

      if (editingTurf) {
        const { error } = await supabase
          .from("turfs")
          .update(payload)
          .eq("id", editingTurf.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("turfs")
          .insert({
            ...payload,
            is_active: true,
          });

        if (error) throw error;
      }

      closeTurfForm();
      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to save turf."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const toggleTurf = async (turf) => {
    try {
      setRefreshing(true);

      const { error } = await supabase
        .from("turfs")
        .update({
          is_active: !turf.is_active,
        })
        .eq("id", turf.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to update turf."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const deleteTurf = async (turf) => {
    const confirmed = window.confirm(
      `Delete "${turf.name}"?`
    );

    if (!confirmed) return;

    try {
      setRefreshing(true);

      const { error } = await supabase
        .from("turfs")
        .delete()
        .eq("id", turf.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to delete turf."
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
     SLOT MANAGEMENT
     ========================================================= */

  const openAddSlotForm = () => {
    const firstActiveTurf =
      turfs.find(
        (turf) => turf.is_active
      );

    setEditingSlot(null);

    setSlotForm({
      turf_id:
        firstActiveTurf?.id?.toString() ||
        turfs[0]?.id?.toString() ||
        "",
      slot_date: getTodayString(),
      start_time: "",
      end_time: "",
      is_available: true,
    });

    setShowSlotForm(true);
    setActiveTab(TABS.SLOTS);
  };

  const openEditSlotForm = (slot) => {
    setEditingSlot(slot);

    setSlotForm({
      turf_id:
        slot.turf_id?.toString() || "",
      slot_date:
        slot.slot_date ||
        getTodayString(),
      start_time:
        slot.start_time?.slice(0, 5) || "",
      end_time:
        slot.end_time?.slice(0, 5) || "",
      is_available:
        slot.is_available ?? true,
    });

    setShowSlotForm(true);
  };

  const closeSlotForm = () => {
    setShowSlotForm(false);
    setEditingSlot(null);
    setSlotForm(getInitialSlotForm());
  };

  const handleSlotSubmit = async (event) => {
    event.preventDefault();

    const turfId = Number(
      slotForm.turf_id
    );

    const slotDate =
      slotForm.slot_date;

    const startTime =
      slotForm.start_time;

    const endTime =
      slotForm.end_time;

    if (!Number.isInteger(turfId) || turfId <= 0) {
      alert("Please select a turf.");
      return;
    }

    if (!slotDate) {
      alert("Please select a date.");
      return;
    }

    if (!startTime || !endTime) {
      alert(
        "Please enter start and end time."
      );
      return;
    }

    if (startTime >= endTime) {
      alert(
        "End time must be later than start time."
      );
      return;
    }

    if (
      !editingSlot &&
      slotDate < getTodayString()
    ) {
      alert(
        "You cannot create a slot for a past date."
      );
      return;
    }

    try {
      setRefreshing(true);

      const payload = {
        turf_id: turfId,
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime,
        is_available:
          Boolean(
            slotForm.is_available
          ),
      };

      if (editingSlot) {
        const { error } =
          await supabase
            .from("time_slots")
            .update(payload)
            .eq("id", editingSlot.id);

        if (error) throw error;

        alert(
          "Time slot updated successfully."
        );
      } else {
        const { error } =
          await supabase
            .from("time_slots")
            .insert(payload);

        if (error) throw error;

        alert(
          "Time slot added successfully."
        );
      }

      closeSlotForm();
      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to save time slot."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSlotAvailability = async (slot) => {
    try {
      setRefreshing(true);

      const { error } =
        await supabase
          .from("time_slots")
          .update({
            is_available:
              !slot.is_available,
          })
          .eq("id", slot.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to update time slot."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const deleteSlot = async (slot) => {
    const confirmed =
      window.confirm(
        `Delete ${formatTime(
          slot.start_time
        )} - ${formatTime(
          slot.end_time
        )} on ${formatDate(
          slot.slot_date
        )}?`
      );

    if (!confirmed) return;

    try {
      setRefreshing(true);

      const { error } =
        await supabase
          .from("time_slots")
          .delete()
          .eq("id", slot.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to delete slot."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const matchesTurf =
        slotTurfFilter === "all" ||
        String(slot.turf_id) ===
          String(slotTurfFilter);

      const matchesDate =
        !slotDateFilter ||
        slot.slot_date ===
          slotDateFilter;

      return (
        matchesTurf &&
        matchesDate
      );
    });
  }, [
    slots,
    slotTurfFilter,
    slotDateFilter,
  ]);

  /* =========================================================
     BOOKING MANAGEMENT
     ========================================================= */

  const filteredBookings = useMemo(() => {
    const query =
      bookingSearch
        .trim()
        .toLowerCase();

    return bookings.filter(
      (booking) => {
        const profile =
          getProfile(
            booking.user_id
          );

        const turfName =
          getTurfName(
            booking.turf_id
          );

        const matchesSearch =
          !query ||
          String(
            booking.id
          ).includes(query) ||
          String(
            profile?.full_name ||
              ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            profile?.phone ||
              ""
          )
            .toLowerCase()
            .includes(query) ||
          turfName
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          bookingStatusFilter ===
            "all" ||
          normalizeStatus(
            booking.status
          ) ===
            bookingStatusFilter;

        const matchesTurf =
          bookingTurfFilter ===
            "all" ||
          String(
            booking.turf_id
          ) ===
            String(
              bookingTurfFilter
            );

        const matchesDate =
          !bookingDateFilter ||
          booking.booking_date ===
            bookingDateFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesTurf &&
          matchesDate
        );
      }
    );
  }, [
    bookingSearch,
    bookingStatusFilter,
    bookingTurfFilter,
    bookingDateFilter,
    bookings,
    getProfile,
    getTurfName,
  ]);

  const updateBookingStatus = async (
    booking,
    status
  ) => {
    const action =
      status === "confirmed"
        ? "confirm"
        : "cancel";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} booking #${booking.id}?`
      );

    if (!confirmed) return;

    try {
      setProcessingBookingId(
        booking.id
      );

      const { error } =
        await supabase
          .from("bookings")
          .update({ status })
          .eq("id", booking.id);

      if (error) throw error;

      await loadData();

      setSelectedBooking(
        (current) =>
          current?.id ===
          booking.id
            ? {
                ...current,
                status,
              }
            : current
      );
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          `Unable to ${action} booking.`
      );
    } finally {
      setProcessingBookingId(
        null
      );
    }
  };

  /* =========================================================
     ANNOUNCEMENT MANAGEMENT
     ========================================================= */

  const toggleAnnouncement =
    async (announcement) => {
      try {
        setRefreshing(true);

        const { error } =
          await supabase
            .from("announcements")
            .update({
              is_active:
                !announcement.is_active,
            })
            .eq(
              "id",
              announcement.id
            );

        if (error) throw error;

        await loadData();
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Unable to update announcement."
        );
      } finally {
        setRefreshing(false);
      }
    };

  const deleteAnnouncement =
    async (announcement) => {
      const confirmed =
        window.confirm(
          `Delete "${announcement.title}"?`
        );

      if (!confirmed) return;

      try {
        setRefreshing(true);

        const { error } =
          await supabase
            .from("announcements")
            .delete()
            .eq(
              "id",
              announcement.id
            );

        if (error) throw error;

        await loadData();
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Unable to delete announcement."
        );
      } finally {
        setRefreshing(false);
      }
    };

  const createAnnouncement =
    async (event) => {
      event.preventDefault();

      const title =
        announcementForm.title.trim();

      const message =
        announcementForm.message.trim();

      if (!title || !message) {
        alert(
          "Please enter a title and message."
        );
        return;
      }

      try {
        setRefreshing(true);

        const { error } =
          await supabase
            .from("announcements")
            .insert({
              title,
              message,
              is_active:
                Boolean(
                  announcementForm.is_active
                ),
            });

        if (error) throw error;

        setAnnouncementForm({
          title: "",
          message: "",
          is_active: true,
        });

        setShowAnnouncementForm(false);

        await loadData();
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Unable to create announcement."
        );
      } finally {
        setRefreshing(false);
      }
    };

  /* =========================================================
     REWARDS HELPERS
     ========================================================= */

  const getMemberProfile = useCallback(
    (userId) => {
      return (
        users.find(
          (user) =>
            user.id === userId
        ) || null
      );
    },
    [users]
  );

  const getMemberStatus = useCallback(
    (points) => {
      const reached =
        rewardCheckpoints.filter(
          (checkpoint) =>
            Number(
              checkpoint.points_required ||
                0
            ) <=
            Number(points || 0)
        );

      if (!reached.length) {
        return "Starter";
      }

      return (
        reached[reached.length - 1]
          ?.title || "Starter"
      );
    },
    [rewardCheckpoints]
  );

  const getNextCheckpoint =
    useCallback(
      (points) => {
        return (
          rewardCheckpoints.find(
            (checkpoint) =>
              Number(
                checkpoint.points_required ||
                  0
              ) >
              Number(points || 0)
          ) || null
        );
      },
      [rewardCheckpoints]
    );

  const filteredRewardMembers =
    useMemo(() => {
      const query =
        rewardSearch
          .trim()
          .toLowerCase();

      return rewardMembers.filter(
        (member) => {
          const profile =
            getMemberProfile(
              member.user_id
            );

          return (
            !query ||
            String(
              member.user_id || ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              profile?.full_name ||
                ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              profile?.email ||
                ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              profile?.phone ||
                ""
            )
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      rewardMembers,
      rewardSearch,
      getMemberProfile,
    ]);

  const rewardStats =
    useMemo(() => {
      const totalMembers =
        rewardMembers.length;

      const totalPoints =
        rewardMembers.reduce(
          (sum, member) =>
            sum +
            Number(
              member.points || 0
            ),
          0
        );

      const lifetimePoints =
        rewardMembers.reduce(
          (sum, member) =>
            sum +
            Number(
              member.lifetime_points ||
                0
            ),
          0
        );

      const unlockedOffers =
        rewardMembers.reduce(
          (sum, member) => {
            const count =
              rewardOffers.filter(
                (offer) =>
                  member.points >=
                  Number(
                    offer.required_points ||
                      0
                  )
              ).length;

            return sum + count;
          },
          0
        );

      return {
        totalMembers,
        totalPoints,
        lifetimePoints,
        unlockedOffers,
      };
    }, [
      rewardMembers,
      rewardOffers,
    ]);

  /* =========================================================
     MANUAL POINTS MANAGEMENT
     ========================================================= */

  const openPointsForm = (
    member
  ) => {
    setSelectedRewardMember(
      member
    );

    setPointsForm({
      points: "",
      action: "add",
      description: "",
    });

    setShowPointsForm(true);
  };

  const closePointsForm = () => {
    setShowPointsForm(false);
    setSelectedRewardMember(null);
  };

  const handlePointsSubmit =
    async (event) => {
      event.preventDefault();

      if (!selectedRewardMember) {
        return;
      }

      const amount = Number(
        pointsForm.points
      );

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {
        alert(
          "Enter a positive whole number of points."
        );
        return;
      }

      const currentPoints =
        Number(
          selectedRewardMember.points ||
            0
        );

      let newPoints =
        pointsForm.action === "add"
          ? currentPoints + amount
          : currentPoints - amount;

      if (newPoints < 0) {
        alert(
          "A member cannot have negative points."
        );
        return;
      }

      const lifetime =
        Number(
          selectedRewardMember.lifetime_points ||
            0
        );

      const newLifetime =
        pointsForm.action === "add"
          ? lifetime + amount
          : lifetime;

      const description =
        pointsForm.description.trim() ||
        (pointsForm.action === "add"
          ? "Points manually added by admin"
          : "Points manually removed by admin");

      try {
        setRefreshing(true);

        const { error: rewardError } =
          await supabase
            .from("member_rewards")
            .update({
              points: newPoints,
              lifetime_points:
                newLifetime,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "user_id",
              selectedRewardMember.user_id
            );

        if (rewardError) {
          throw rewardError;
        }

        const transactionPoints =
          pointsForm.action === "add"
            ? amount
            : -amount;

        const {
          error: transactionError,
        } = await supabase
          .from("reward_transactions")
          .insert({
            user_id:
              selectedRewardMember.user_id,
            points:
              transactionPoints,
            type:
              pointsForm.action ===
              "add"
                ? "admin_adjustment"
                : "admin_deduction",
            description,
          });

        if (transactionError) {
          console.error(
            "Transaction log error:",
            transactionError
          );
        }

        closePointsForm();

        await loadData();

        alert(
          pointsForm.action ===
            "add"
            ? "Points added successfully."
            : "Points removed successfully."
        );
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Unable to update member points."
        );
      } finally {
        setRefreshing(false);
      }
    };

  /* =========================================================
     MILESTONE MANAGEMENT
     ========================================================= */

  const openAddMilestone =
    () => {
      setEditingMilestone(null);

      setMilestoneForm(
        getInitialMilestoneForm()
      );

      setShowMilestoneForm(true);
    };

  const openEditMilestone =
    (milestone) => {
      setEditingMilestone(
        milestone
      );

      setMilestoneForm({
        title:
          milestone.title || "",
        description:
          milestone.description ||
          "",
        points_required:
          milestone.points_required ??
          "",
        is_active:
          milestone.is_active ??
          true,
      });

      setShowMilestoneForm(true);
    };

  const closeMilestoneForm =
    () => {
      setShowMilestoneForm(false);
      setEditingMilestone(null);
    };

  const saveMilestone =
    async (event) => {
      event.preventDefault();

      const title =
        milestoneForm.title.trim();

      const description =
        milestoneForm.description.trim();

      const pointsRequired =
        Number(
          milestoneForm.points_required
        );

      if (!title) {
        alert(
          "Please enter a milestone title."
        );
        return;
      }

      if (
        !Number.isInteger(
          pointsRequired
        ) ||
        pointsRequired < 0
      ) {
        alert(
          "Enter a valid points requirement."
        );
        return;
      }

      try {
        setRefreshing(true);

        const payload = {
          title,
          description:
            description || null,
          points_required:
            pointsRequired,
          is_active:
            Boolean(
              milestoneForm.is_active
            ),
        };

        if (editingMilestone) {
          const { error } =
            await supabase
              .from(
                "reward_checkpoints"
              )
              .update(payload)
              .eq(
                "id",
                editingMilestone.id
              );

          if (error) throw error;
        } else {
          const { error } =
            await supabase
              .from(
                "reward_checkpoints"
              )
              .insert(payload);

          if (error) throw error;
        }

        closeMilestoneForm();
        await loadData();
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Unable to save milestone."
        );
      } finally {
        setRefreshing(false);
      }
    };

  const toggleMilestone =
    async (milestone) => {
      try {
        setRefreshing(true);

        const { error } =
          await supabase
            .from(
              "reward_checkpoints"
            )
            .update({
              is_active:
                !milestone.is_active,
            })
            .eq(
              "id",
              milestone.id
            );

        if (error) throw error;

        await loadData();
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Unable to update milestone."
        );
      } finally {
        setRefreshing(false);
      }
    };

  const deleteMilestone =
    async (milestone) => {
      const confirmed =
        window.confirm(
          `Delete "${milestone.title}"?`
        );

      if (!confirmed) return;

      try {
        setRefreshing(true);

        const { error } =
          await supabase
            .from(
              "reward_checkpoints"
            )
            .delete()
            .eq(
              "id",
              milestone.id
            );

        if (error) throw error;

        await loadData();
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Unable to delete milestone."
        );
      } finally {
        setRefreshing(false);
      }
    };

  /* =========================================================
     OFFER MANAGEMENT
     ========================================================= */

  const openAddOffer = () => {
    setEditingOffer(null);

    setOfferForm(
      getInitialOfferForm()
    );

    setShowOfferForm(true);
  };

  const openEditOffer =
    (offer) => {
      setEditingOffer(offer);

      setOfferForm({
        title:
          offer.title || "",
        description:
          offer.description || "",
        required_points:
          offer.required_points ??
          "",
        benefit:
          offer.benefit || "",
        discount_type:
          offer.discount_type ||
          "percentage",
        discount_value:
          offer.discount_value ??
          "",
        target_type:
          offer.target_type ||
          "community",
        is_active:
          offer.is_active ??
          true,
      });

      setShowOfferForm(true);
    };

  const closeOfferForm =
    () => {
      setShowOfferForm(false);
      setEditingOffer(null);
    };

  const saveOffer = async (
    event
  ) => {
    event.preventDefault();

    const title =
      offerForm.title.trim();

    const description =
      offerForm.description.trim();

    const benefit =
      offerForm.benefit.trim();

    const requiredPoints =
      Number(
        offerForm.required_points
      );

    const discountValue =
      Number(
        offerForm.discount_value
      );

    if (!title) {
      alert(
        "Please enter a reward title."
      );
      return;
    }

    if (!description) {
      alert(
        "Please enter a description."
      );
      return;
    }

    if (
      !Number.isInteger(
        requiredPoints
      ) ||
      requiredPoints < 0
    ) {
      alert(
        "Enter a valid points requirement."
      );
      return;
    }

    if (!benefit) {
      alert(
        "Please describe the reward benefit."
      );
      return;
    }

    if (
      !Number.isFinite(
        discountValue
      ) ||
      discountValue < 0
    ) {
      alert(
        "Enter a valid discount value."
      );
      return;
    }

    if (
      offerForm.discount_type ===
        "percentage" &&
      discountValue > 100
    ) {
      alert(
        "Percentage discount cannot exceed 100."
      );
      return;
    }

    try {
      setRefreshing(true);

      const payload = {
        title,
        description,
        required_points:
          requiredPoints,
        benefit,
        discount_percent:
          offerForm.discount_type ===
          "percentage"
            ? discountValue
            : 0,
        is_active:
          Boolean(
            offerForm.is_active
          ),
        target_type:
          offerForm.target_type ||
          "community",
        discount_type:
          offerForm.discount_type,
        discount_value:
          discountValue,
      };

      if (editingOffer) {
        const { error } =
          await supabase
            .from(
              "community_offers"
            )
            .update(payload)
            .eq(
              "id",
              editingOffer.id
            );

        if (error) throw error;
      } else {
        const { error } =
          await supabase
            .from(
              "community_offers"
            )
            .insert(payload);

        if (error) throw error;
      }

      closeOfferForm();
      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to save reward offer."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const toggleOffer =
    async (offer) => {
      try {
        setRefreshing(true);

        const { error } =
          await supabase
            .from(
              "community_offers"
            )
            .update({
              is_active:
                !offer.is_active,
            })
            .eq(
              "id",
              offer.id
            );

        if (error) throw error;

        await loadData();
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Unable to update reward."
        );
      } finally {
        setRefreshing(false);
      }
    };

  const deleteOffer =
    async (offer) => {
      const confirmed =
        window.confirm(
          `Delete "${offer.title}"?`
        );

      if (!confirmed) return;

      try {
        setRefreshing(true);

        const { error } =
          await supabase
            .from(
              "community_offers"
            )
            .delete()
            .eq(
              "id",
              offer.id
            );

        if (error) throw error;

        await loadData();
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Unable to delete reward."
        );
      } finally {
        setRefreshing(false);
      }
    };

  if (loading) {
    return <LoadingScreen />;
  }

  const stats = {
    confirmed: bookings.filter(
      (booking) =>
        normalizeStatus(
          booking.status
        ) === "confirmed"
    ).length,

    pending: bookings.filter(
      (booking) =>
        normalizeStatus(
          booking.status
        ) === "pending"
    ).length,

    cancelled: bookings.filter(
      (booking) =>
        normalizeStatus(
          booking.status
        ) === "cancelled"
    ).length,

    revenue: bookings
      .filter(
        (booking) =>
          normalizeStatus(
            booking.status
          ) === "confirmed"
      )
      .reduce(
        (sum, booking) =>
          sum +
          Number(
            booking.total_amount ||
              0
          ),
        0
      ),

    activeTurfs:
      turfs.filter(
        (turf) => turf.is_active
      ).length,

    availableSlots:
      slots.filter(
        (slot) =>
          slot.is_available
      ).length,
  };

  const navItems = [
    {
      id: TABS.OVERVIEW,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: TABS.TURFS,
      label: "Turfs",
      icon: Trophy,
    },
    {
      id: TABS.SLOTS,
      label: "Time Slots",
      icon: Clock3,
    },
    {
      id: TABS.BOOKINGS,
      label: "Bookings",
      icon: CalendarDays,
    },
    {
      id: TABS.USERS,
      label: "Users",
      icon: Users,
    },
    {
      id: TABS.REWARDS,
      label: "Rewards",
      icon: Award,
    },
    {
      id: TABS.ANNOUNCEMENTS,
      label: "Announcements",
      icon: Megaphone,
    },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-logo">
            SPORT<span>IVA</span>

            <small>
              ADMIN CONTROL
            </small>
          </div>

          <div className="admin-sidebar-divider" />

          <nav>
            {navItems.map((item) => (
              <MenuButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={
                  activeTab ===
                  item.id
                }
                onClick={() =>
                  setActiveTab(
                    item.id
                  )
                }
              />
            ))}
          </nav>
        </div>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-refresh"
            onClick={() =>
              refreshData()
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "admin-spin"
                  : ""
              }
            />

            <span>
              {refreshing
                ? "Refreshing..."
                : "Refresh Data"}
            </span>
          </button>

          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
          >
            <LogOut size={15} />

            <span>
              Sign Out
            </span>
          </button>

          <div className="admin-sidebar-footer">
            SPORTIVA TURF SYSTEM
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <div className="admin-header-label">
              THE SPORTIVA · MANAGEMENT
            </div>

            <h1>
              {
                navItems.find(
                  (item) =>
                    item.id ===
                    activeTab
                )?.label
              }
            </h1>
          </div>

          <div className="admin-header-right">
            <div className="admin-live-status">
              <span />
              LIVE SYSTEM
            </div>

            <div className="admin-user-badge">
              <UserRound size={15} />
              <span>
                {adminEmail ||
                  "Administrator"}
              </span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {errorMessage && (
            <div
              style={{
                marginBottom: 18,
                padding:
                  "12px 15px",
                borderRadius: 10,
                border:
                  "1px solid #f1c8c8",
                background:
                  "#fff5f5",
                color:
                  "#a04444",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* =================================================
              OVERVIEW
              ================================================= */}

          {activeTab ===
            TABS.OVERVIEW && (
            <>
              <section className="admin-welcome">
                <div>
                  <div className="admin-welcome-label">
                    CONTROL CENTER
                  </div>

                  <h2>
                    Welcome back to{" "}
                    <span>
                      Sportiva.
                    </span>
                  </h2>

                  <p>
                    Manage turfs,
                    schedules,
                    bookings,
                    members,
                    rewards and
                    customer
                    communication.
                  </p>
                </div>

                <div className="admin-welcome-icon">
                  <Activity
                    size={29}
                  />
                </div>
              </section>

              <section className="admin-stats">
                <div className="admin-stat">
                  <div className="admin-stat-icon">
                    <CalendarDays
                      size={19}
                    />
                  </div>

                  <div className="admin-stat-info">
                    <span>
                      CONFIRMED BOOKINGS
                    </span>

                    <strong>
                      {
                        stats.confirmed
                      }
                    </strong>

                    <small>
                      Approved
                      reservations
                    </small>
                  </div>
                </div>

                <div className="admin-stat">
                  <div className="admin-stat-icon">
                    <Clock3
                      size={19}
                    />
                  </div>

                  <div className="admin-stat-info">
                    <span>
                      PENDING BOOKINGS
                    </span>

                    <strong>
                      {
                        stats.pending
                      }
                    </strong>

                    <small>
                      Waiting for
                      approval
                    </small>
                  </div>
                </div>

                <div className="admin-stat">
                  <div className="admin-stat-icon">
                    <Trophy
                      size={19}
                    />
                  </div>

                  <div className="admin-stat-info">
                    <span>
                      ACTIVE TURFS
                    </span>

                    <strong>
                      {
                        stats.activeTurfs
                      }
                    </strong>

                    <small>
                      {
                        turfs.length
                      }{" "}
                      total
                      turfs
                    </small>
                  </div>
                </div>

                <div className="admin-stat">
                  <div className="admin-stat-icon">
                    <Award
                      size={19}
                    />
                  </div>

                  <div className="admin-stat-info">
                    <span>
                      REWARD POINTS
                    </span>

                    <strong>
                      {rewardStats.totalPoints.toLocaleString()}
                    </strong>

                    <small>
                      {
                        rewardStats.totalMembers
                      }{" "}
                      members
                    </small>
                  </div>
                </div>
              </section>

              <section className="admin-dashboard-grid">
                <div className="admin-panel">
                  <div className="admin-panel-title">
                    <div>
                      <div className="admin-section-kicker">
                        RECENT ACTIVITY
                      </div>

                      <h2>
                        Latest
                        Bookings
                      </h2>

                      <p>
                        Most recent
                        reservation
                        activity.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="admin-small-button"
                      onClick={() =>
                        setActiveTab(
                          TABS.BOOKINGS
                        )
                      }
                    >
                      View all
                      <ChevronRight
                        size={13}
                      />
                    </button>
                  </div>

                  {bookings.length ===
                  0 ? (
                    <div className="admin-empty">
                      <div className="admin-empty-icon">
                        <CalendarDays
                          size={23}
                        />
                      </div>

                      <h3>
                        No bookings
                        yet
                      </h3>

                      <p>
                        New
                        reservations
                        will
                        appear
                        here.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>
                              ID
                            </th>
                            <th>
                              Customer
                            </th>
                            <th>
                              Turf
                            </th>
                            <th>
                              Date
                            </th>
                            <th>
                              Amount
                            </th>
                            <th>
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {bookings
                            .slice(
                              0,
                              8
                            )
                            .map(
                              (
                                booking
                              ) => {
                                const profile =
                                  getProfile(
                                    booking.user_id
                                  );

                                return (
                                  <tr
                                    key={
                                      booking.id
                                    }
                                  >
                                    <td>
                                      <span className="table-id">
                                        #
                                        {
                                          booking.id
                                        }
                                      </span>
                                    </td>

                                    <td>
                                      <div className="table-user">
                                        <div className="table-avatar">
                                          <UserRound
                                            size={
                                              13
                                            }
                                          />
                                        </div>

                                        <strong>
                                          {profile?.full_name ||
                                            "Unknown"}
                                        </strong>
                                      </div>
                                    </td>

                                    <td>
                                      <span className="table-primary">
                                        {getTurfName(
                                          booking.turf_id
                                        )}
                                      </span>
                                    </td>

                                    <td>
                                      {formatDate(
                                        booking.booking_date
                                      )}
                                    </td>

                                    <td>
                                      <span className="table-amount">
                                        {formatMoney(
                                          booking.total_amount
                                        )}
                                      </span>
                                    </td>

                                    <td>
                                      <StatusBadge
                                        status={
                                          booking.status
                                        }
                                      />
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="admin-side-column">
                  <div className="admin-mini-panel">
                    <div className="admin-mini-heading">
                      <div className="admin-mini-icon">
                        <Award
                          size={17}
                        />
                      </div>

                      <div>
                        <span>
                          REWARDS
                        </span>

                        <strong>
                          Membership
                        </strong>
                      </div>
                    </div>

                    <div className="admin-status-row">
                      <span>
                        <i className="dot confirmed-dot" />
                        Members
                      </span>

                      <strong>
                        {
                          rewardStats.totalMembers
                        }
                      </strong>
                    </div>

                    <div className="admin-status-row">
                      <span>
                        <i className="dot pending-dot" />
                        Current Points
                      </span>

                      <strong>
                        {rewardStats.totalPoints.toLocaleString()}
                      </strong>
                    </div>

                    <div className="admin-status-row">
                      <span>
                        <i className="dot confirmed-dot" />
                        Lifetime
                      </span>

                      <strong>
                        {rewardStats.lifetimePoints.toLocaleString()}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="admin-outline-button"
                      onClick={() =>
                        setActiveTab(
                          TABS.REWARDS
                        )
                      }
                    >
                      <Award
                        size={14}
                      />
                      Manage Rewards
                    </button>
                  </div>

                  <div className="admin-mini-panel">
                    <div className="admin-mini-heading">
                      <div className="admin-mini-icon">
                        <Clock3
                          size={17}
                        />
                      </div>

                      <div>
                        <span>
                          TIME SLOTS
                        </span>

                        <strong>
                          Availability
                        </strong>
                      </div>
                    </div>

                    <div className="admin-big-number">
                      {
                        stats.availableSlots
                      }
                    </div>

                    <p className="admin-mini-description">
                      Available
                      booking
                      windows.
                    </p>

                    <button
                      type="button"
                      className="admin-outline-button"
                      onClick={
                        openAddSlotForm
                      }
                    >
                      <Plus size={14} />
                      Add Time
                      Slot
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* =================================================
              TURFS
              ================================================= */}

          {activeTab ===
            TABS.TURFS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    FACILITY
                    MANAGEMENT
                  </div>

                  <h2>
                    Turfs
                  </h2>

                  <p>
                    Manage facilities
                    available for
                    booking.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={
                    openAddTurfForm
                  }
                >
                  <Plus size={14} />
                  Add Turf
                </button>
              </div>

              {showTurfForm && (
                <form
                  className="admin-form"
                  onSubmit={
                    handleTurfSubmit
                  }
                >
                  <div className="admin-form-heading">
                    <strong>
                      {editingTurf
                        ? "Edit Turf"
                        : "Create New Turf"}
                    </strong>

                    <span>
                      Configure
                      facility
                      information.
                    </span>
                  </div>

                  <div className="admin-form-fields">
                    <input
                      type="text"
                      value={
                        turfForm.name
                      }
                      onChange={(
                        event
                      ) =>
                        setTurfForm(
                          (
                            current
                          ) => ({
                            ...current,
                            name: event
                              .target
                              .value,
                          })
                        )
                      }
                      placeholder="Turf name"
                      required
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        turfForm.price_per_hour
                      }
                      onChange={(
                        event
                      ) =>
                        setTurfForm(
                          (
                            current
                          ) => ({
                            ...current,
                            price_per_hour:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Price per hour"
                      required
                    />

                    <input
                      type="text"
                      value={
                        turfForm.description
                      }
                      onChange={(
                        event
                      ) =>
                        setTurfForm(
                          (
                            current
                          ) => ({
                            ...current,
                            description:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Description"
                    />

                    <input
                      type="url"
                      value={
                        turfForm.image_url
                      }
                      onChange={(
                        event
                      ) =>
                        setTurfForm(
                          (
                            current
                          ) => ({
                            ...current,
                            image_url:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Image URL"
                    />
                  </div>

                  <div className="admin-form-actions">
                    <button
                      type="button"
                      className="admin-cancel-button"
                      onClick={
                        closeTurfForm
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={
                        refreshing
                      }
                    >
                      <Check
                        size={14}
                      />
                      Save
                    </button>
                  </div>
                </form>
              )}

              <div className="turf-list-header">
                <div>
                  <strong>
                    Registered
                    Facilities
                  </strong>

                  <span>
                    {
                      turfs.length
                    }{" "}
                    configured
                    turfs
                  </span>
                </div>

                <div className="turf-list-summary">
                  <span className="turf-summary-active">
                    {
                      turfs.filter(
                        (
                          turf
                        ) =>
                          turf.is_active
                      )
                        .length
                    }{" "}
                    active
                  </span>

                  <span className="turf-summary-disabled">
                    {
                      turfs.filter(
                        (
                          turf
                        ) =>
                          !turf.is_active
                      )
                        .length
                    }{" "}
                    disabled
                  </span>
                </div>
              </div>

              {turfs.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">
                    <Trophy
                      size={23}
                    />
                  </div>

                  <h3>
                    No turfs created
                  </h3>

                  <p>
                    Create your first
                    turf above.
                  </p>
                </div>
              ) : (
                <div className="turf-management-list">
                  {turfs.map(
                    (
                      turf,
                      index
                    ) => (
                      <div
                        key={
                          turf.id
                        }
                        className="turf-management-row"
                      >
                        <div className="turf-list-main">
                          <div className="turf-list-number">
                            {String(
                              index +
                                1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </div>

                          <div className="turf-list-image">
                            {turf.image_url ? (
                              <img
                                src={
                                  turf.image_url
                                }
                                alt={
                                  turf.name
                                }
                              />
                            ) : (
                              <Trophy
                                size={
                                  19
                                }
                              />
                            )}
                          </div>

                          <div className="turf-list-info">
                            <strong>
                              {
                                turf.name
                              }
                            </strong>

                            <span>
                              {turf.description ||
                                "No description"}
                            </span>
                          </div>
                        </div>

                        <div className="turf-list-price">
                          <span>
                            PRICE
                          </span>

                          <strong>
                            {formatMoney(
                              turf.price_per_hour
                            )}
                            <small>
                              /hr
                            </small>
                          </strong>
                        </div>

                        <div className="turf-list-date">
                          <span>
                            CREATED
                          </span>

                          <strong>
                            {formatDate(
                              turf.created_at?.slice(
                                0,
                                10
                              )
                            )}
                          </strong>
                        </div>

                        <div className="turf-list-status">
                          <span
                            className={`turf-list-status-badge ${
                              turf.is_active
                                ? "active"
                                : "disabled"
                            }`}
                          >
                            <i />
                            {turf.is_active
                              ? "Active"
                              : "Disabled"}
                          </span>
                        </div>

                        <div className="turf-list-actions">
                          <button
                            type="button"
                            className="turf-action-toggle"
                            onClick={() =>
                              toggleTurf(
                                turf
                              )
                            }
                            disabled={
                              refreshing
                            }
                          >
                            <Power
                              size={
                                12
                              }
                            />
                            {turf.is_active
                              ? "Disable"
                              : "Enable"}
                          </button>

                          <button
                            type="button"
                            className="turf-action-toggle"
                            onClick={() =>
                              openEditTurfForm(
                                turf
                              )
                            }
                            disabled={
                              refreshing
                            }
                          >
                            <Edit3
                              size={
                                12
                              }
                            />
                            Edit
                          </button>

                          <button
                            type="button"
                            className="turf-action-delete"
                            onClick={() =>
                              deleteTurf(
                                turf
                              )
                            }
                            disabled={
                              refreshing
                            }
                          >
                            <Trash2
                              size={
                                14
                              }
                            />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          )}

          {/* =================================================
              TIME SLOTS
              ================================================= */}

          {activeTab ===
            TABS.SLOTS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    BOOKING
                    AVAILABILITY
                  </div>

                  <h2>
                    Time Slots
                  </h2>

                  <p>
                    Control the exact
                    schedule customers
                    can book.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={
                    openAddSlotForm
                  }
                >
                  <Plus size={14} />
                  Add Time
                  Slot
                </button>
              </div>

              {showSlotForm && (
                <form
                  className="admin-form admin-slot-form"
                  onSubmit={
                    handleSlotSubmit
                  }
                >
                  <div className="admin-form-heading">
                    <strong>
                      {editingSlot
                        ? "Edit Time Slot"
                        : "Add New Time Slot"}
                    </strong>

                    <span>
                      Choose the turf,
                      date and booking
                      window.
                    </span>
                  </div>

                  <div className="admin-form-fields">
                    <div className="admin-form-field">
                      <label>
                        TURF
                      </label>

                      <select
                        value={
                          slotForm.turf_id
                        }
                        onChange={(
                          event
                        ) =>
                          setSlotForm(
                            (
                              current
                            ) => ({
                              ...current,
                              turf_id:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        required
                      >
                        <option value="">
                          Select
                          turf
                        </option>

                        {turfs
                          .filter(
                            (
                              turf
                            ) =>
                              turf.is_active ||
                              String(
                                turf.id
                              ) ===
                                String(
                                  slotForm.turf_id
                                )
                          )
                          .map(
                            (
                              turf
                            ) => (
                              <option
                                key={
                                  turf.id
                                }
                                value={
                                  turf.id
                                }
                              >
                                {
                                  turf.name
                                }
                              </option>
                            )
                          )}
                      </select>
                    </div>

                    <div className="admin-form-field">
                      <label>
                        DATE
                      </label>

                      <input
                        type="date"
                        min={
                          editingSlot
                            ? undefined
                            : getTodayString()
                        }
                        value={
                          slotForm.slot_date
                        }
                        onChange={(
                          event
                        ) =>
                          setSlotForm(
                            (
                              current
                            ) => ({
                              ...current,
                              slot_date:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label>
                        START
                        TIME
                      </label>

                      <input
                        type="time"
                        value={
                          slotForm.start_time
                        }
                        onChange={(
                          event
                        ) =>
                          setSlotForm(
                            (
                              current
                            ) => ({
                              ...current,
                              start_time:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label>
                        END
                        TIME
                      </label>

                      <input
                        type="time"
                        value={
                          slotForm.end_time
                        }
                        onChange={(
                          event
                        ) =>
                          setSlotForm(
                            (
                              current
                            ) => ({
                              ...current,
                              end_time:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-actions">
                    <button
                      type="button"
                      className="admin-cancel-button"
                      onClick={
                        closeSlotForm
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={
                        refreshing
                      }
                    >
                      <Check
                        size={14}
                      />

                      {editingSlot
                        ? "Save Slot"
                        : "Add Time Slot"}
                    </button>
                  </div>
                </form>
              )}

              <div className="admin-slot-toolbar">
                <div className="admin-slot-toolbar-info">
                  <strong>
                    {
                      filteredSlots.length
                    }{" "}
                    slots
                  </strong>

                  <span>
                    {
                      slots.length
                    }{" "}
                    total
                  </span>
                </div>

                <div className="admin-slot-filters">
                  <select
                    className="admin-slot-filter"
                    value={
                      slotTurfFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setSlotTurfFilter(
                        event
                          .target
                          .value
                      )
                    }
                  >
                    <option value="all">
                      All turfs
                    </option>

                    {turfs.map(
                      (turf) => (
                        <option
                          key={
                            turf.id
                          }
                          value={
                            turf.id
                          }
                        >
                          {
                            turf.name
                          }
                        </option>
                      )
                    )}
                  </select>

                  <input
                    type="date"
                    className="admin-slot-filter"
                    value={
                      slotDateFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setSlotDateFilter(
                        event
                          .target
                          .value
                      )
                    }
                  />

                  {(slotTurfFilter !==
                    "all" ||
                    slotDateFilter) && (
                    <button
                      type="button"
                      className="admin-small-button"
                      onClick={() => {
                        setSlotTurfFilter(
                          "all"
                        );
                        setSlotDateFilter(
                          ""
                        );
                      }}
                    >
                      <X size={12} />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {filteredSlots.length ===
              0 ? (
                <div className="admin-empty admin-slot-empty">
                  <div className="admin-empty-icon">
                    <Clock3
                      size={23}
                    />
                  </div>

                  <h3>
                    No time slots
                    found
                  </h3>

                  <p>
                    Add a time slot to
                    make a booking
                    window available.
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table admin-slot-table">
                    <thead>
                      <tr>
                        <th>
                          ID
                        </th>
                        <th>
                          Turf
                        </th>
                        <th>
                          Date
                        </th>
                        <th>
                          Time
                        </th>
                        <th>
                          Status
                        </th>
                        <th>
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredSlots.map(
                        (slot) => (
                          <tr
                            key={
                              slot.id
                            }
                          >
                            <td>
                              <span className="table-id">
                                #
                                {
                                  slot.id
                                }
                              </span>
                            </td>

                            <td>
                              <span className="table-primary">
                                {getTurfName(
                                  slot.turf_id
                                )}
                              </span>
                            </td>

                            <td>
                              {formatDate(
                                slot.slot_date
                              )}
                            </td>

                            <td>
                              <div className="admin-slot-time">
                                <span>
                                  {formatTime(
                                    slot.start_time
                                  )}
                                </span>

                                <span className="separator">
                                  —
                                </span>

                                <span>
                                  {formatTime(
                                    slot.end_time
                                  )}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`admin-slot-status ${
                                  slot.is_available
                                    ? "available"
                                    : "unavailable"
                                }`}
                              >
                                <i />
                                {slot.is_available
                                  ? "Available"
                                  : "Unavailable"}
                              </span>
                            </td>

                            <td>
                              <div className="admin-slot-actions">
                                <button
                                  type="button"
                                  className="admin-slot-action edit"
                                  onClick={() =>
                                    openEditSlotForm(
                                      slot
                                    )
                                  }
                                  disabled={
                                    refreshing
                                  }
                                >
                                  <Edit3
                                    size={
                                      12
                                    }
                                  />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="admin-slot-action toggle"
                                  onClick={() =>
                                    toggleSlotAvailability(
                                      slot
                                    )
                                  }
                                  disabled={
                                    refreshing
                                  }
                                >
                                  <Power
                                    size={
                                      12
                                    }
                                  />
                                  {slot.is_available
                                    ? "Disable"
                                    : "Enable"}
                                </button>

                                <button
                                  type="button"
                                  className="admin-slot-action delete"
                                  onClick={() =>
                                    deleteSlot(
                                      slot
                                    )
                                  }
                                  disabled={
                                    refreshing
                                  }
                                >
                                  <Trash2
                                    size={
                                      13
                                    }
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* =================================================
              BOOKINGS
              ================================================= */}

          {activeTab ===
            TABS.BOOKINGS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    RESERVATION
                    MANAGEMENT
                  </div>

                  <h2>
                    Bookings
                  </h2>

                  <p>
                    Review and manage
                    customer
                    reservations.
                  </p>
                </div>

                <div className="admin-booking-summary">
                  {
                    filteredBookings.length
                  }{" "}
                  shown
                </div>
              </div>

              <div
                style={{
                  padding:
                    "16px 22px",
                  borderBottom:
                    "1px solid #e8edea",
                  background:
                    "#fbfcfb",
                  display:
                    "grid",
                  gridTemplateColumns:
                    "minmax(220px, 1.5fr) repeat(3, minmax(140px, 1fr))",
                  gap: 9,
                }}
              >
                <input
                  type="text"
                  placeholder="Search customer, phone or turf..."
                  value={
                    bookingSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setBookingSearch(
                      event
                        .target
                        .value
                    )
                  }
                  style={{
                    height: 36,
                    padding:
                      "0 11px",
                    border:
                      "1px solid #dce4df",
                    borderRadius: 8,
                    outline:
                      "none",
                    background:
                      "#fff",
                    color:
                      "#17221d",
                    fontFamily:
                      "inherit",
                    fontSize: 10,
                  }}
                />

                <select
                  value={
                    bookingStatusFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setBookingStatusFilter(
                      event
                        .target
                        .value
                    )
                  }
                  style={{
                    height: 36,
                    border:
                      "1px solid #dce4df",
                    borderRadius: 8,
                    padding:
                      "0 10px",
                    background:
                      "#fff",
                    fontSize: 10,
                  }}
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

                <select
                  value={
                    bookingTurfFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setBookingTurfFilter(
                      event
                        .target
                        .value
                    )
                  }
                  style={{
                    height: 36,
                    border:
                      "1px solid #dce4df",
                    borderRadius: 8,
                    padding:
                      "0 10px",
                    background:
                      "#fff",
                    fontSize: 10,
                  }}
                >
                  <option value="all">
                    All turfs
                  </option>

                  {turfs.map(
                    (turf) => (
                      <option
                        key={
                          turf.id
                        }
                        value={
                          turf.id
                        }
                      >
                        {
                          turf.name
                        }
                      </option>
                    )
                  )}
                </select>

                <input
                  type="date"
                  value={
                    bookingDateFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setBookingDateFilter(
                      event
                        .target
                        .value
                    )
                  }
                  style={{
                    height: 36,
                    border:
                      "1px solid #dce4df",
                    borderRadius: 8,
                    padding:
                      "0 10px",
                    background:
                      "#fff",
                    fontSize: 10,
                  }}
                />
              </div>

              {filteredBookings.length ===
              0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">
                    <CalendarDays
                      size={23}
                    />
                  </div>

                  <h3>
                    No bookings
                    found
                  </h3>

                  <p>
                    No booking
                    matches the
                    current filters.
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          ID
                        </th>
                        <th>
                          Customer
                        </th>
                        <th>
                          Turf
                        </th>
                        <th>
                          Date
                        </th>
                        <th>
                          Time
                        </th>
                        <th>
                          Amount
                        </th>
                        <th>
                          Status
                        </th>
                        <th>
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBookings.map(
                        (booking) => {
                          const profile =
                            getProfile(
                              booking.user_id
                            );

                          const status =
                            normalizeStatus(
                              booking.status
                            );

                          return (
                            <tr
                              key={
                                booking.id
                              }
                            >
                              <td>
                                <span className="table-id">
                                  #
                                  {
                                    booking.id
                                  }
                                </span>
                              </td>

                              <td>
                                <div className="table-user">
                                  <div className="table-avatar">
                                    <UserRound
                                      size={
                                        13
                                      }
                                    />
                                  </div>

                                  <strong>
                                    {profile?.full_name ||
                                      "Unknown"}
                                  </strong>
                                </div>
                              </td>

                              <td>
                                <span className="table-primary">
                                  {getTurfName(
                                    booking.turf_id
                                  )}
                                </span>
                              </td>

                              <td>
                                {formatDate(
                                  booking.booking_date
                                )}
                              </td>

                              <td>
                                <div className="table-time">
                                  {formatTime(
                                    booking.start_time
                                  )}
                                  <ChevronRight
                                    size={
                                      11
                                    }
                                  />
                                  {formatTime(
                                    booking.end_time
                                  )}
                                </div>
                              </td>

                              <td>
                                <span className="table-amount">
                                  {formatMoney(
                                    booking.total_amount
                                  )}
                                </span>
                              </td>

                              <td>
                                <StatusBadge
                                  status={
                                    status
                                  }
                                />
                              </td>

                              <td>
                                <div className="booking-actions">
                                  {status ===
                                    "pending" && (
                                    <>
                                      <button
                                        type="button"
                                        className="booking-confirm"
                                        onClick={() =>
                                          updateBookingStatus(
                                            booking,
                                            "confirmed"
                                          )
                                        }
                                        disabled={
                                          processingBookingId ===
                                          booking.id
                                        }
                                      >
                                        <Check
                                          size={
                                            11
                                          }
                                        />
                                        Confirm
                                      </button>

                                      <button
                                        type="button"
                                        className="booking-cancel"
                                        onClick={() =>
                                          updateBookingStatus(
                                            booking,
                                            "cancelled"
                                          )
                                        }
                                        disabled={
                                          processingBookingId ===
                                          booking.id
                                        }
                                      >
                                        <X
                                          size={
                                            11
                                          }
                                        />
                                        Cancel
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    className="admin-slot-action edit"
                                    onClick={() =>
                                      setSelectedBooking(
                                        booking
                                      )
                                    }
                                  >
                                    <Eye
                                      size={
                                        12
                                      }
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
              )}
            </section>
          )}

          {/* =================================================
              USERS
              ================================================= */}

          {activeTab ===
            TABS.USERS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    CUSTOMER
                    DIRECTORY
                  </div>

                  <h2>
                    Users
                  </h2>

                  <p>
                    Registered customer
                    profiles.
                  </p>
                </div>

                <div className="admin-count-badge">
                  {users.length}{" "}
                  users
                </div>
              </div>

              {users.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">
                    <Users
                      size={23}
                    />
                  </div>

                  <h3>
                    No users found
                  </h3>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          Customer
                        </th>
                        <th>
                          Phone
                        </th>
                        <th>
                          Email
                        </th>
                        <th>
                          Joined
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map(
                        (user) => (
                          <tr
                            key={
                              user.id
                            }
                          >
                            <td>
                              <div className="table-user">
                                <div className="table-avatar">
                                  <UserRound
                                    size={
                                      13
                                    }
                                  />
                                </div>

                                <strong>
                                  {
                                    user.full_name
                                  }
                                </strong>
                              </div>
                            </td>

                            <td>
                              {
                                user.phone
                              }
                            </td>

                            <td>
                              {
                                user.email
                              }
                            </td>

                            <td>
                              {formatDate(
                                user.created_at?.slice(
                                  0,
                                  10
                                )
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* =================================================
              REWARDS
              ================================================= */}

          {activeTab ===
            TABS.REWARDS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    MEMBERSHIP
                    PROGRAM
                  </div>

                  <h2>
                    Sportiva
                    Rewards
                  </h2>

                  <p>
                    Manage points,
                    membership
                    milestones,
                    rewards and
                    reward activity.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap: 7,
                  padding:
                    "14px 22px",
                  borderBottom:
                    "1px solid #e8edea",
                  background:
                    "#fbfcfb",
                }}
              >
                {[
                  [
                    "overview",
                    "Overview",
                  ],
                  [
                    "members",
                    "Member Points",
                  ],
                  [
                    "milestones",
                    "Milestones",
                  ],
                  [
                    "offers",
                    "Reward Offers",
                  ],
                  [
                    "history",
                    "Reward History",
                  ],
                ].map(
                  ([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setRewardSubTab(
                          id
                        )
                      }
                      style={{
                        height: 34,
                        padding:
                          "0 12px",
                        border:
                          "1px solid " +
                          (rewardSubTab ===
                          id
                            ? "#bcd4c3"
                            : "#e0e7e2"),
                        borderRadius: 8,
                        background:
                          rewardSubTab ===
                          id
                            ? "#edf6ef"
                            : "#fff",
                        color:
                          rewardSubTab ===
                          id
                            ? "#21683e"
                            : "#64736b",
                        fontFamily:
                          "inherit",
                        fontSize: 9,
                        fontWeight: 800,
                        cursor:
                          "pointer",
                      }}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>

              {/* Reward Overview */}
              {rewardSubTab ===
                "overview" && (
                <div
                  style={{
                    padding:
                      22,
                  }}
                >
                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(4, minmax(0, 1fr))",
                      gap: 12,
                    }}
                  >
                    {[
                      {
                        label:
                          "MEMBERS",
                        value:
                          rewardStats.totalMembers,
                        icon: Users,
                      },
                      {
                        label:
                          "CURRENT POINTS",
                        value:
                          rewardStats.totalPoints,
                        icon: Star,
                      },
                      {
                        label:
                          "LIFETIME POINTS",
                        value:
                          rewardStats.lifetimePoints,
                        icon: Zap,
                      },
                      {
                        label:
                          "REWARD OFFERS",
                        value:
                          rewardOffers.filter(
                            (
                              offer
                            ) =>
                              offer.is_active
                          ).length,
                        icon: Gift,
                      },
                    ].map(
                      (stat) => {
                        const Icon =
                          stat.icon;

                        return (
                          <div
                            key={
                              stat.label
                            }
                            style={{
                              padding:
                                18,
                              border:
                                "1px solid #e1e9e4",
                              borderRadius:
                                14,
                              background:
                                "#fff",
                            }}
                          >
                            <div
                              style={{
                                width:
                                  38,
                                height:
                                  38,
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                borderRadius:
                                  10,
                                background:
                                  "#edf5ef",
                                color:
                                  "#28734a",
                              }}
                            >
                              <Icon
                                size={
                                  18
                                }
                              />
                            </div>

                            <p
                              style={{
                                margin:
                                  "14px 0 4px",
                                color:
                                  "#7b8981",
                                fontSize:
                                  8,
                                fontWeight:
                                  850,
                                letterSpacing:
                                  1,
                              }}
                            >
                              {
                                stat.label
                              }
                            </p>

                            <strong
                              style={{
                                color:
                                  "#17221d",
                                fontSize:
                                  24,
                                fontWeight:
                                  850,
                              }}
                            >
                              {Number(
                                stat.value ||
                                  0
                              ).toLocaleString()}
                            </strong>
                          </div>
                        );
                      }
                    )}
                  </div>

                  <div
                    style={{
                      marginTop:
                        20,
                      padding:
                        20,
                      border:
                        "1px solid #e1e9e4",
                      borderRadius:
                        14,
                      background:
                        "#f9fbfa",
                    }}
                  >
                    <div className="admin-mini-heading">
                      <div className="admin-mini-icon">
                        <Award
                          size={17}
                        />
                      </div>

                      <div>
                        <span>
                          PROGRAM
                          STATUS
                        </span>

                        <strong>
                          Sportiva
                          Rewards
                          System
                        </strong>
                      </div>
                    </div>

                    <p
                      style={{
                        margin:
                          0,
                        color:
                          "#6e7d74",
                        fontSize:
                          11,
                        lineHeight:
                          1.7,
                      }}
                    >
                      Confirmed bookings
                      can award
                      points through
                      the existing
                      booking reward
                      system. Use
                      the tabs above
                      to control
                      members,
                      milestones and
                      reward offers.
                    </p>
                  </div>
                </div>
              )}

              {/* Member Points */}
              {rewardSubTab ===
                "members" && (
                <>
                  <div
                    style={{
                      padding:
                        "16px 22px",
                      background:
                        "#fbfcfb",
                      borderBottom:
                        "1px solid #e8edea",
                    }}
                  >
                    <input
                      type="text"
                      value={
                        rewardSearch
                      }
                      onChange={(
                        event
                      ) =>
                        setRewardSearch(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Search member name, email, phone or ID..."
                      style={{
                        width:
                          "100%",
                        height:
                          38,
                        boxSizing:
                          "border-box",
                        border:
                          "1px solid #dce4df",
                        borderRadius:
                          8,
                        padding:
                          "0 12px",
                        outline:
                          "none",
                        fontFamily:
                          "inherit",
                        fontSize:
                          10,
                      }}
                    />
                  </div>

                  {filteredRewardMembers.length ===
                  0 ? (
                    <div className="admin-empty">
                      <div className="admin-empty-icon">
                        <Award
                          size={23}
                        />
                      </div>

                      <h3>
                        No reward
                        members
                        found
                      </h3>

                      <p>
                        Reward accounts
                        will appear
                        here.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>
                              Member
                            </th>
                            <th>
                              Status
                            </th>
                            <th>
                              Current
                            </th>
                            <th>
                              Lifetime
                            </th>
                            <th>
                              Next
                            </th>
                            <th>
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredRewardMembers.map(
                            (
                              member
                            ) => {
                              const profile =
                                getMemberProfile(
                                  member.user_id
                                );

                              const points =
                                Number(
                                  member.points ||
                                    0
                                );

                              const next =
                                getNextCheckpoint(
                                  points
                                );

                              return (
                                <tr
                                  key={
                                    member.user_id
                                  }
                                >
                                  <td>
                                    <div className="table-user">
                                      <div className="table-avatar">
                                        <UserRound
                                          size={
                                            13
                                          }
                                        />
                                      </div>

                                      <div>
                                        <strong>
                                          {profile?.full_name ||
                                            "Unknown"}
                                        </strong>

                                        <div
                                          style={{
                                            marginTop:
                                              2,
                                            color:
                                              "#8c9892",
                                            fontSize:
                                              8,
                                          }}
                                        >
                                          {profile?.email ||
                                            member.user_id}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td>
                                    <span className="status confirmed">
                                      {getMemberStatus(
                                        points
                                      )}
                                    </span>
                                  </td>

                                  <td>
                                    <strong
                                      style={{
                                        color:
                                          "#28734a",
                                      }}
                                    >
                                      {points.toLocaleString()}
                                    </strong>
                                  </td>

                                  <td>
                                    {Number(
                                      member.lifetime_points ||
                                        0
                                    ).toLocaleString()}
                                  </td>

                                  <td>
                                    {next
                                      ? `${next.title} · ${next.points_required} pts`
                                      : "Maximum"}
                                  </td>

                                  <td>
                                    <button
                                      type="button"
                                      className="admin-small-button"
                                      onClick={() =>
                                        openPointsForm(
                                          member
                                        )
                                      }
                                    >
                                      <Zap
                                        size={
                                          12
                                        }
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
                  )}
                </>
              )}

              {/* Milestones */}
              {rewardSubTab ===
                "milestones" && (
                <>
                  <div className="admin-panel-title">
                    <div>
                      <h2>
                        Membership
                        Milestones
                      </h2>

                      <p>
                        Define the
                        points needed
                        for each
                        membership
                        level.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={
                        openAddMilestone
                      }
                    >
                      <Plus
                        size={14}
                      />
                      Add
                      Milestone
                    </button>
                  </div>

                  {showMilestoneForm && (
                    <form
                      className="admin-form"
                      onSubmit={
                        saveMilestone
                      }
                    >
                      <div className="admin-form-heading">
                        <strong>
                          {editingMilestone
                            ? "Edit Milestone"
                            : "New Milestone"}
                        </strong>

                        <span>
                          This level appears
                          on the customer's
                          rewards page.
                        </span>
                      </div>

                      <div className="admin-form-fields">
                        <input
                          type="text"
                          value={
                            milestoneForm.title
                          }
                          onChange={(
                            event
                          ) =>
                            setMilestoneForm(
                              (
                                current
                              ) => ({
                                ...current,
                                title:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="Example: Pro Player"
                          required
                        />

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            milestoneForm.points_required
                          }
                          onChange={(
                            event
                          ) =>
                            setMilestoneForm(
                              (
                                current
                              ) => ({
                                ...current,
                                points_required:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="150"
                          required
                        />

                        <input
                          type="text"
                          value={
                            milestoneForm.description
                          }
                          onChange={(
                            event
                          ) =>
                            setMilestoneForm(
                              (
                                current
                              ) => ({
                                ...current,
                                description:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="Description"
                        />
                      </div>

                      <div className="admin-form-actions">
                        <button
                          type="button"
                          className="admin-cancel-button"
                          onClick={
                            closeMilestoneForm
                          }
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="admin-primary-button"
                          disabled={
                            refreshing
                          }
                        >
                          <Check
                            size={
                              14
                            }
                          />
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  {rewardCheckpoints.length ===
                  0 ? (
                    <div className="admin-empty">
                      <div className="admin-empty-icon">
                        <Trophy
                          size={
                            23
                          }
                        />
                      </div>

                      <h3>
                        No milestones
                      </h3>

                      <p>
                        Add your first
                        membership
                        milestone.
                      </p>
                    </div>
                  ) : (
                    <div className="announcement-list">
                      {rewardCheckpoints.map(
                        (
                          milestone
                        ) => (
                          <div
                            key={
                              milestone.id
                            }
                            className="announcement-admin-card"
                          >
                            <div className="announcement-content">
                              <div className="announcement-icon">
                                <Award
                                  size={
                                    16
                                  }
                                />
                              </div>

                              <div>
                                <div className="announcement-meta">
                                  <span
                                    className={
                                      milestone.is_active
                                        ? "announcement-live"
                                        : "announcement-disabled"
                                    }
                                  >
                                    {milestone.is_active
                                      ? "ACTIVE"
                                      : "DISABLED"}
                                  </span>
                                </div>

                                <h3>
                                  {
                                    milestone.title
                                  }
                                </h3>

                                <p>
                                  {milestone.description ||
                                    "No description"}
                                </p>

                                <p
                                  style={{
                                    marginTop:
                                      6,
                                    color:
                                      "#28734a",
                                    fontWeight:
                                      800,
                                  }}
                                >
                                  {
                                    milestone.points_required
                                  }{" "}
                                  points
                                </p>
                              </div>
                            </div>

                            <div className="admin-card-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditMilestone(
                                    milestone
                                  )
                                }
                              >
                                <Edit3
                                  size={
                                    12
                                  }
                                />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleMilestone(
                                    milestone
                                  )
                                }
                              >
                                <Power
                                  size={
                                    12
                                  }
                                />
                                {milestone.is_active
                                  ? "Disable"
                                  : "Enable"}
                              </button>

                              <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                  deleteMilestone(
                                    milestone
                                  )
                                }
                              >
                                <Trash2
                                  size={
                                    13
                                  }
                                />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Reward Offers */}
              {rewardSubTab ===
                "offers" && (
                <>
                  <div className="admin-panel-title">
                    <div>
                      <h2>
                        Reward Offers
                      </h2>

                      <p>
                        Define benefits
                        members can unlock
                        with points.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={
                        openAddOffer
                      }
                    >
                      <Plus
                        size={14}
                      />
                      Add Reward
                    </button>
                  </div>

                  {showOfferForm && (
                    <form
                      className="admin-form"
                      onSubmit={
                        saveOffer
                      }
                    >
                      <div className="admin-form-heading">
                        <strong>
                          {editingOffer
                            ? "Edit Reward"
                            : "Create Reward"}
                        </strong>

                        <span>
                          Set the points
                          requirement and
                          customer benefit.
                        </span>
                      </div>

                      <div className="admin-form-fields">
                        <input
                          type="text"
                          value={
                            offerForm.title
                          }
                          onChange={(
                            event
                          ) =>
                            setOfferForm(
                              (
                                current
                              ) => ({
                                ...current,
                                title:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="Example: 5% Booking Discount"
                          required
                        />

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            offerForm.required_points
                          }
                          onChange={(
                            event
                          ) =>
                            setOfferForm(
                              (
                                current
                              ) => ({
                                ...current,
                                required_points:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="100"
                          required
                        />

                        <input
                          type="text"
                          value={
                            offerForm.description
                          }
                          onChange={(
                            event
                          ) =>
                            setOfferForm(
                              (
                                current
                              ) => ({
                                ...current,
                                description:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="Description"
                          required
                        />

                        <input
                          type="text"
                          value={
                            offerForm.benefit
                          }
                          onChange={(
                            event
                          ) =>
                            setOfferForm(
                              (
                                current
                              ) => ({
                                ...current,
                                benefit:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="Example: 5% off your booking"
                          required
                        />

                        <select
                          value={
                            offerForm.discount_type
                          }
                          onChange={(
                            event
                          ) =>
                            setOfferForm(
                              (
                                current
                              ) => ({
                                ...current,
                                discount_type:
                                  event
                                    .target
                                    .value,
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

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            offerForm.discount_value
                          }
                          onChange={(
                            event
                          ) =>
                            setOfferForm(
                              (
                                current
                              ) => ({
                                ...current,
                                discount_value:
                                  event
                                    .target
                                    .value,
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
                      </div>

                      <div className="admin-form-actions">
                        <button
                          type="button"
                          className="admin-cancel-button"
                          onClick={
                            closeOfferForm
                          }
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="admin-primary-button"
                          disabled={
                            refreshing
                          }
                        >
                          <Gift
                            size={
                              14
                            }
                          />
                          Save Reward
                        </button>
                      </div>
                    </form>
                  )}

                  {rewardOffers.length ===
                  0 ? (
                    <div className="admin-empty">
                      <div className="admin-empty-icon">
                        <Gift
                          size={
                            23
                          }
                        />
                      </div>

                      <h3>
                        No rewards
                      </h3>

                      <p>
                        Create your first
                        reward offer.
                      </p>
                    </div>
                  ) : (
                    <div className="announcement-list">
                      {rewardOffers.map(
                        (offer) => (
                          <div
                            key={
                              offer.id
                            }
                            className="announcement-admin-card"
                          >
                            <div className="announcement-content">
                              <div className="announcement-icon">
                                <Gift
                                  size={
                                    16
                                  }
                                />
                              </div>

                              <div>
                                <div className="announcement-meta">
                                  <span
                                    className={
                                      offer.is_active
                                        ? "announcement-live"
                                        : "announcement-disabled"
                                    }
                                  >
                                    {offer.is_active
                                      ? "LIVE"
                                      : "DISABLED"}
                                  </span>
                                </div>

                                <h3>
                                  {
                                    offer.title
                                  }
                                </h3>

                                <p>
                                  {
                                    offer.description
                                  }
                                </p>

                                <p
                                  style={{
                                    marginTop:
                                      6,
                                    color:
                                      "#28734a",
                                    fontWeight:
                                      800,
                                  }}
                                >
                                  {
                                    offer.required_points
                                  }{" "}
                                  points ·{" "}
                                  {
                                    offer.benefit
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="admin-card-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditOffer(
                                    offer
                                  )
                                }
                              >
                                <Edit3
                                  size={
                                    12
                                  }
                                />
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
                                <Power
                                  size={
                                    12
                                  }
                                />
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
                                <Trash2
                                  size={
                                    13
                                  }
                                />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Reward History */}
              {rewardSubTab ===
                "history" && (
                <>
                  <div className="admin-panel-title">
                    <div>
                      <h2>
                        Reward History
                      </h2>

                      <p>
                        Points earned,
                        adjusted and
                        redeemed.
                      </p>
                    </div>

                    <div className="admin-count-badge">
                      {
                        rewardTransactions.length
                      }{" "}
                      transactions
                    </div>
                  </div>

                  {rewardTransactions.length ===
                  0 ? (
                    <div className="admin-empty">
                      <div className="admin-empty-icon">
                        <History
                          size={
                            23
                          }
                        />
                      </div>

                      <h3>
                        No reward
                        activity
                      </h3>
                    </div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>
                              Member
                            </th>
                            <th>
                              Points
                            </th>
                            <th>
                              Type
                            </th>
                            <th>
                              Description
                            </th>
                            <th>
                              Date
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {rewardTransactions.map(
                            (
                              transaction
                            ) => {
                              const profile =
                                getMemberProfile(
                                  transaction.user_id
                                );

                              const amount =
                                Number(
                                  transaction.points ||
                                    0
                                );

                              return (
                                <tr
                                  key={
                                    transaction.id
                                  }
                                >
                                  <td>
                                    <div className="table-user">
                                      <div className="table-avatar">
                                        <UserRound
                                          size={
                                            13
                                          }
                                        />
                                      </div>

                                      <strong>
                                        {profile?.full_name ||
                                          "Unknown"}
                                      </strong>
                                    </div>
                                  </td>

                                  <td>
                                    <strong
                                      style={{
                                        color:
                                          amount >=
                                          0
                                            ? "#28734a"
                                            : "#b74a4a",
                                      }}
                                    >
                                      {amount >=
                                      0
                                        ? "+"
                                        : ""}
                                      {
                                        amount
                                      }
                                    </strong>
                                  </td>

                                  <td>
                                    <span className="table-primary">
                                      {
                                        transaction.type
                                      }
                                    </span>
                                  </td>

                                  <td>
                                    {transaction.description ||
                                      "—"}
                                  </td>

                                  <td>
                                    {formatDate(
                                      transaction.created_at?.slice(
                                        0,
                                        10
                                      )
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {rewardRedemptions.length >
                    0 && (
                    <div
                      style={{
                        marginTop:
                          1,
                        borderTop:
                          "1px solid #e8edea",
                      }}
                    >
                      <div
                        style={{
                          padding:
                            "18px 22px",
                          fontSize:
                            12,
                          fontWeight:
                            850,
                          color:
                            "#26372d",
                        }}
                      >
                        Recent
                        Redemptions
                      </div>

                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>
                                Member
                              </th>
                              <th>
                                Points Used
                              </th>
                              <th>
                                Discount
                              </th>
                              <th>
                                Status
                              </th>
                              <th>
                                Date
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {rewardRedemptions
                              .slice(
                                0,
                                25
                              )
                              .map(
                                (
                                  redemption
                                ) => {
                                  const profile =
                                    getMemberProfile(
                                      redemption.user_id
                                    );

                                  return (
                                    <tr
                                      key={
                                        redemption.id
                                      }
                                    >
                                      <td>
                                        <div className="table-user">
                                          <div className="table-avatar">
                                            <UserRound
                                              size={
                                                13
                                              }
                                            />
                                          </div>

                                          <strong>
                                            {profile?.full_name ||
                                              "Unknown"}
                                          </strong>
                                        </div>
                                      </td>

                                      <td>
                                        {
                                          redemption.points_used
                                        }
                                      </td>

                                      <td>
                                        {formatMoney(
                                          redemption.discount_amount
                                        )}
                                      </td>

                                      <td>
                                        <StatusBadge
                                          status={
                                            redemption.status
                                          }
                                        />
                                      </td>

                                      <td>
                                        {formatDate(
                                          redemption.created_at?.slice(
                                            0,
                                            10
                                          )
                                        )}
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
                </>
              )}
            </section>
          )}

          {/* =================================================
              ANNOUNCEMENTS
              ================================================= */}

          {activeTab ===
            TABS.ANNOUNCEMENTS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    CUSTOMER
                    COMMUNICATION
                  </div>

                  <h2>
                    Announcements
                  </h2>

                  <p>
                    Publish updates and
                    operational
                    messages.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() =>
                    setShowAnnouncementForm(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                >
                  <Plus size={14} />
                  {showAnnouncementForm
                    ? "Close"
                    : "New Announcement"}
                </button>
              </div>

              {showAnnouncementForm && (
                <form
                  className="admin-form"
                  onSubmit={
                    createAnnouncement
                  }
                >
                  <div className="admin-form-heading">
                    <strong>
                      New
                      Announcement
                    </strong>

                    <span>
                      This message can
                      appear on the
                      customer dashboard.
                    </span>
                  </div>

                  <div className="admin-form-fields">
                    <input
                      type="text"
                      value={
                        announcementForm.title
                      }
                      onChange={(
                        event
                      ) =>
                        setAnnouncementForm(
                          (
                            current
                          ) => ({
                            ...current,
                            title:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Announcement title"
                      required
                    />

                    <input
                      type="text"
                      value={
                        announcementForm.message
                      }
                      onChange={(
                        event
                      ) =>
                        setAnnouncementForm(
                          (
                            current
                          ) => ({
                            ...current,
                            message:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Announcement message"
                      required
                    />
                  </div>

                  <div className="admin-form-actions">
                    <button
                      type="button"
                      className="admin-cancel-button"
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
                      <Megaphone
                        size={14}
                      />
                      Publish
                    </button>
                  </div>
                </form>
              )}

              {announcements.length ===
              0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">
                    <Megaphone
                      size={23}
                    />
                  </div>

                  <h3>
                    No announcements
                  </h3>
                </div>
              ) : (
                <div className="announcement-list">
                  {announcements.map(
                    (
                      announcement
                    ) => (
                      <div
                        key={
                          announcement.id
                        }
                        className="announcement-admin-card"
                      >
                        <div className="announcement-content">
                          <div className="announcement-icon">
                            <Bell
                              size={
                                16
                              }
                            />
                          </div>

                          <div>
                            <div className="announcement-meta">
                              <span
                                className={
                                  announcement.is_active
                                    ? "announcement-live"
                                    : "announcement-disabled"
                                }
                              >
                                {announcement.is_active
                                  ? "LIVE"
                                  : "DISABLED"}
                              </span>
                            </div>

                            <h3>
                              {
                                announcement.title
                              }
                            </h3>

                            <p>
                              {
                                announcement.message
                              }
                            </p>
                          </div>
                        </div>

                        <div className="admin-card-actions">
                          <button
                            type="button"
                            onClick={() =>
                              toggleAnnouncement(
                                announcement
                              )
                            }
                          >
                            <Power
                              size={
                                12
                              }
                            />
                            {announcement.is_active
                              ? "Disable"
                              : "Enable"}
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
                            <Trash2
                              size={
                                13
                              }
                            />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* =====================================================
          BOOKING DETAIL MODAL
          ===================================================== */}

      {selectedBooking && (
        <div
          onClick={() =>
            setSelectedBooking(
              null
            )
          }
          style={{
            position:
              "fixed",
            inset: 0,
            zIndex: 500,
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: 20,
            background:
              "rgba(16,37,27,.42)",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width:
                "min(560px,100%)",
              maxHeight:
                "90vh",
              overflowY:
                "auto",
              borderRadius:
                16,
              background:
                "#fff",
              boxShadow:
                "0 25px 80px rgba(0,0,0,.18)",
            }}
          >
            <div
              style={{
                padding:
                  "18px 20px",
                borderBottom:
                  "1px solid #e8edea",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
              }}
            >
              <div>
                <div className="admin-section-kicker">
                  BOOKING
                  DETAILS
                </div>

                <h2
                  style={{
                    margin:
                      "5px 0 0",
                    fontSize:
                      17,
                    fontWeight:
                      850,
                    color:
                      "#17221d",
                  }}
                >
                  Booking #
                  {
                    selectedBooking.id
                  }
                </h2>
              </div>

              <button
                type="button"
                className="admin-cancel-button"
                onClick={() =>
                  setSelectedBooking(
                    null
                  )
                }
              >
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                padding:
                  20,
              }}
            >
              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(2,minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <div>
                  <small>
                    CUSTOMER
                  </small>

                  <strong>
                    {getProfile(
                      selectedBooking.user_id
                    )?.full_name ||
                      "Unknown"}
                  </strong>
                </div>

                <div>
                  <small>
                    TURF
                  </small>

                  <strong>
                    {getTurfName(
                      selectedBooking.turf_id
                    )}
                  </strong>
                </div>

                <div>
                  <small>
                    DATE
                  </small>

                  <strong>
                    {formatDate(
                      selectedBooking.booking_date
                    )}
                  </strong>
                </div>

                <div>
                  <small>
                    TIME
                  </small>

                  <strong>
                    {formatTime(
                      selectedBooking.start_time
                    )}
                    {" — "}
                    {formatTime(
                      selectedBooking.end_time
                    )}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    16,
                  padding:
                    14,
                  border:
                    "1px solid #e2e9e4",
                  borderRadius:
                    10,
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                }}
              >
                <span>
                  Total
                </span>

                <strong
                  style={{
                    color:
                      "#28734a",
                  }}
                >
                  {formatMoney(
                    selectedBooking.total_amount
                  )}
                </strong>
              </div>

              <div
                style={{
                  marginTop:
                    14,
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                }}
              >
                <span>
                  Status
                </span>

                <StatusBadge
                  status={
                    selectedBooking.status
                  }
                />
              </div>

              {normalizeStatus(
                selectedBooking.status
              ) ===
                "pending" && (
                <div
                  style={{
                    display:
                      "flex",
                    gap: 8,
                    marginTop:
                      18,
                  }}
                >
                  <button
                    type="button"
                    className="booking-confirm"
                    style={{
                      height: 40,
                      flex: 1,
                    }}
                    onClick={() =>
                      updateBookingStatus(
                        selectedBooking,
                        "confirmed"
                      )
                    }
                  >
                    <Check
                      size={
                        13
                      }
                    />
                    Confirm
                  </button>

                  <button
                    type="button"
                    className="booking-cancel"
                    style={{
                      height: 40,
                      flex: 1,
                    }}
                    onClick={() =>
                      updateBookingStatus(
                        selectedBooking,
                        "cancelled"
                      )
                    }
                  >
                    <X
                      size={
                        13
                      }
                    />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MANUAL POINT ADJUSTMENT MODAL
          ===================================================== */}

      {showPointsForm &&
        selectedRewardMember && (
          <div
            onClick={
              closePointsForm
            }
            style={{
              position:
                "fixed",
              inset: 0,
              zIndex: 550,
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              padding: 20,
              background:
                "rgba(16,37,27,.42)",
            }}
          >
            <div
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
              style={{
                width:
                  "min(460px,100%)",
                borderRadius:
                  16,
                background:
                  "#fff",
                boxShadow:
                  "0 25px 80px rgba(0,0,0,.18)",
              }}
            >
              <div
                style={{
                  padding:
                    "18px 20px",
                  borderBottom:
                    "1px solid #e8edea",
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                }}
              >
                <div>
                  <div className="admin-section-kicker">
                    MEMBER
                    POINTS
                  </div>

                  <h2
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize:
                        17,
                      fontWeight:
                        850,
                    }}
                  >
                    Adjust Points
                  </h2>
                </div>

                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={
                    closePointsForm
                  }
                >
                  <X size={14} />
                </button>
              </div>

              <form
                onSubmit={
                  handlePointsSubmit
                }
                style={{
                  padding:
                    20,
                }}
              >
                <div
                  style={{
                    padding:
                      14,
                    borderRadius:
                      10,
                    background:
                      "#f6faf7",
                    border:
                      "1px solid #e1e9e4",
                  }}
                >
                  <strong
                    style={{
                      display:
                        "block",
                      color:
                        "#26372d",
                      fontSize:
                        12,
                    }}
                  >
                    {getMemberProfile(
                      selectedRewardMember.user_id
                    )?.full_name ||
                      "Unknown Member"}
                  </strong>

                  <span
                    style={{
                      display:
                        "block",
                      marginTop:
                        4,
                      color:
                        "#7c8981",
                      fontSize:
                        10,
                    }}
                  >
                    Current points:{" "}
                    {
                      selectedRewardMember.points
                    }
                  </span>
                </div>

                <div
                  style={{
                    marginTop:
                      14,
                    display:
                      "grid",
                    gap: 10,
                  }}
                >
                  <select
                    value={
                      pointsForm.action
                    }
                    onChange={(
                      event
                    ) =>
                      setPointsForm(
                        (
                          current
                        ) => ({
                          ...current,
                          action:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    style={{
                      height:
                        40,
                      border:
                        "1px solid #dce4df",
                      borderRadius:
                        8,
                      padding:
                        "0 11px",
                      fontFamily:
                        "inherit",
                      fontSize:
                        11,
                      background:
                        "#fff",
                    }}
                  >
                    <option value="add">
                      Add points
                    </option>

                    <option value="remove">
                      Remove points
                    </option>
                  </select>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      pointsForm.points
                    }
                    onChange={(
                      event
                    ) =>
                      setPointsForm(
                        (
                          current
                        ) => ({
                          ...current,
                          points:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Points"
                    required
                    style={{
                      height:
                        40,
                      border:
                        "1px solid #dce4df",
                      borderRadius:
                        8,
                      padding:
                        "0 11px",
                      fontFamily:
                        "inherit",
                      fontSize:
                        11,
                      outline:
                        "none",
                    }}
                  />

                  <input
                    type="text"
                    value={
                      pointsForm.description
                    }
                    onChange={(
                      event
                    ) =>
                      setPointsForm(
                        (
                          current
                        ) => ({
                          ...current,
                          description:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Reason / description"
                    style={{
                      height:
                        40,
                      border:
                        "1px solid #dce4df",
                      borderRadius:
                        8,
                      padding:
                        "0 11px",
                      fontFamily:
                        "inherit",
                      fontSize:
                        11,
                      outline:
                        "none",
                    }}
                  />
                </div>

                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="admin-cancel-button"
                    onClick={
                      closePointsForm
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-primary-button"
                    disabled={
                      refreshing
                    }
                  >
                    <Zap
                      size={
                        14
                      }
                    />
                    Update Points
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

export default Admin;