import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Trophy,
  UserRound,
  Users,
  X,
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

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function Admin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);

  const [turfs, setTurfs] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");

  const [showTurfForm, setShowTurfForm] = useState(false);
  const [editingTurf, setEditingTurf] = useState(null);
  const [turfForm, setTurfForm] = useState({
    name: "",
    description: "",
    price_per_hour: "",
    image_url: "",
    is_active: true,
  });

  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState(getInitialSlotForm());

  const [slotTurfFilter, setSlotTurfFilter] = useState("all");
  const [slotDateFilter, setSlotDateFilter] = useState("");

  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingTurfFilter, setBookingTurfFilter] = useState("all");
  const [bookingDateFilter, setBookingDateFilter] = useState("");

  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [adminEmail, setAdminEmail] = useState("");

  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    is_active: true,
  });

  const getTurfName = useCallback(
    (turfId) => {
      const turf = turfs.find((item) => String(item.id) === String(turfId));
      return turf?.name || "Unknown Turf";
    },
    [turfs]
  );

  const getProfile = useCallback(
    (userId) => {
      return users.find((item) => item.id === userId) || null;
    },
    [users]
  );

  const verifyAdmin = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    if (!user.email_confirmed_at) {
      throw new Error("Your admin email is not verified.");
    }

    const { data: adminRecord, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id, username")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError) {
      throw new Error(adminError.message);
    }

    if (!adminRecord) {
      throw new Error("This account does not have admin access.");
    }

    setAdminEmail(user.email || adminRecord.username || "Administrator");

    return user;
  }, []);

  const loadData = useCallback(async () => {
    const [
      turfsResult,
      slotsResult,
      bookingsResult,
      announcementsResult,
      usersResult,
    ] = await Promise.all([
      supabase
        .from("turfs")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("time_slots")
        .select("*")
        .order("slot_date", { ascending: true })
        .order("start_time", { ascending: true }),

      supabase
        .from("bookings")
        .select("*")
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false }),

      supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (turfsResult.error) throw new Error(turfsResult.error.message);
    if (slotsResult.error) throw new Error(slotsResult.error.message);
    if (bookingsResult.error) throw new Error(bookingsResult.error.message);
    if (announcementsResult.error) {
      throw new Error(announcementsResult.error.message);
    }
    if (usersResult.error) throw new Error(usersResult.error.message);

    setTurfs(turfsResult.data || []);
    setSlots(slotsResult.data || []);
    setBookings(bookingsResult.data || []);
    setAnnouncements(announcementsResult.data || []);
    setUsers(usersResult.data || []);
  }, []);

  const refreshData = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      setErrorMessage("");

      try {
        await verifyAdmin();
        await loadData();
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message || "Unable to load admin data.");
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
        () => {
          refreshData(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "time_slots",
        },
        () => {
          refreshData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

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
      price_per_hour: turf.price_per_hour ?? "",
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
    const description = turfForm.description.trim();
    const price = Number(turfForm.price_per_hour);
    const imageUrl = turfForm.image_url.trim();

    if (!name) {
      alert("Please enter the turf name.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert("Please enter a valid price per hour.");
      return;
    }

    try {
      setRefreshing(true);

      if (editingTurf) {
        const { error } = await supabase
          .from("turfs")
          .update({
            name,
            description,
            price_per_hour: price,
            image_url: imageUrl || null,
            is_active: turfForm.is_active,
          })
          .eq("id", editingTurf.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("turfs").insert({
          name,
          description,
          price_per_hour: price,
          image_url: imageUrl || null,
          is_active: true,
        });

        if (error) throw error;
      }

      closeTurfForm();
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to save turf.");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleTurf = async (turf) => {
    try {
      setRefreshing(true);

      const { error } = await supabase
        .from("turfs")
        .update({ is_active: !turf.is_active })
        .eq("id", turf.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to update turf.");
    } finally {
      setRefreshing(false);
    }
  };

  const deleteTurf = async (turf) => {
    const confirmed = window.confirm(
      `Delete "${turf.name}"?\n\nThis should only be done when the turf is no longer needed.`
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
          "Unable to delete turf. Existing slots or bookings may reference it."
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
     TIME SLOT MANAGEMENT
     ========================================================= */

  const openAddSlotForm = () => {
    setEditingSlot(null);

    setSlotForm({
      turf_id:
        turfs.find((turf) => turf.is_active)?.id?.toString() ||
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
      turf_id: slot.turf_id?.toString() || "",
      slot_date: slot.slot_date || getTodayString(),
      start_time: slot.start_time?.slice(0, 5) || "",
      end_time: slot.end_time?.slice(0, 5) || "",
      is_available: slot.is_available ?? true,
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

    const turfId = Number(slotForm.turf_id);
    const slotDate = slotForm.slot_date;
    const startTime = slotForm.start_time;
    const endTime = slotForm.end_time;

    if (!Number.isInteger(turfId) || turfId <= 0) {
      alert("Please select a turf.");
      return;
    }

    if (!slotDate) {
      alert("Please select a date.");
      return;
    }

    if (!startTime || !endTime) {
      alert("Please enter both start and end time.");
      return;
    }

    if (startTime >= endTime) {
      alert("End time must be later than start time.");
      return;
    }

    if (!editingSlot && slotDate < getTodayString()) {
      alert("You cannot create a time slot for a past date.");
      return;
    }

    try {
      setRefreshing(true);

      const payload = {
        turf_id: turfId,
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime,
        is_available: Boolean(slotForm.is_available),
      };

      if (editingSlot) {
        const { error } = await supabase
          .from("time_slots")
          .update(payload)
          .eq("id", editingSlot.id);

        if (error) throw error;

        alert("Time slot updated successfully.");
      } else {
        const { error } = await supabase.from("time_slots").insert(payload);

        if (error) throw error;

        alert("Time slot added successfully.");
      }

      closeSlotForm();
      await loadData();
    } catch (error) {
      console.error(error);

      const message = error.message || "";

      if (
        message.toLowerCase().includes("overlap") ||
        message.toLowerCase().includes("time_slots")
      ) {
        alert(
          `${message}\n\nMake sure this turf does not already have an overlapping slot on the same date.`
        );
      } else {
        alert(message || "Unable to save time slot.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSlotAvailability = async (slot) => {
    try {
      setRefreshing(true);

      const { error } = await supabase
        .from("time_slots")
        .update({
          is_available: !slot.is_available,
        })
        .eq("id", slot.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to update time slot.");
    } finally {
      setRefreshing(false);
    }
  };

  const deleteSlot = async (slot) => {
    const confirmed = window.confirm(
      `Delete the ${formatTime(slot.start_time)} - ${formatTime(
        slot.end_time
      )} slot on ${formatDate(slot.slot_date)}?`
    );

    if (!confirmed) return;

    try {
      setRefreshing(true);

      const { error } = await supabase
        .from("time_slots")
        .delete()
        .eq("id", slot.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "Unable to delete this slot. It may already be referenced by a booking."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const matchesTurf =
        slotTurfFilter === "all" ||
        String(slot.turf_id) === String(slotTurfFilter);

      const matchesDate =
        !slotDateFilter || slot.slot_date === slotDateFilter;

      return matchesTurf && matchesDate;
    });
  }, [slots, slotTurfFilter, slotDateFilter]);

  /* =========================================================
     BOOKING MANAGEMENT
     ========================================================= */

  const filteredBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();

    return bookings.filter((booking) => {
      const profile = getProfile(booking.user_id);
      const turfName = getTurfName(booking.turf_id);

      const matchesSearch =
        !query ||
        String(booking.id).includes(query) ||
        String(booking.user_id || "").toLowerCase().includes(query) ||
        String(profile?.full_name || "")
          .toLowerCase()
          .includes(query) ||
        String(profile?.phone || "")
          .toLowerCase()
          .includes(query) ||
        turfName.toLowerCase().includes(query);

      const matchesStatus =
        bookingStatusFilter === "all" ||
        normalizeStatus(booking.status) === bookingStatusFilter;

      const matchesTurf =
        bookingTurfFilter === "all" ||
        String(booking.turf_id) === String(bookingTurfFilter);

      const matchesDate =
        !bookingDateFilter || booking.booking_date === bookingDateFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTurf &&
        matchesDate
      );
    });
  }, [
    bookingDateFilter,
    bookingSearch,
    bookingStatusFilter,
    bookingTurfFilter,
    bookings,
    getProfile,
    getTurfName,
  ]);

  const updateBookingStatus = async (booking, status) => {
    if (!booking?.id) return;

    const actionLabel = status === "confirmed" ? "confirm" : "cancel";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} booking #${booking.id}?`
    );

    if (!confirmed) return;

    try {
      setProcessingBookingId(booking.id);

      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", booking.id);

      if (error) throw error;

      await loadData();

      setSelectedBooking((current) =>
        current?.id === booking.id
          ? { ...current, status }
          : current
      );
    } catch (error) {
      console.error(error);
      alert(error.message || `Unable to ${actionLabel} booking.`);
    } finally {
      setProcessingBookingId(null);
    }
  };

  /* =========================================================
     ANNOUNCEMENTS
     ========================================================= */

  const toggleAnnouncement = async (announcement) => {
    try {
      setRefreshing(true);

      const { error } = await supabase
        .from("announcements")
        .update({
          is_active: !announcement.is_active,
        })
        .eq("id", announcement.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to update announcement.");
    } finally {
      setRefreshing(false);
    }
  };

  const deleteAnnouncement = async (announcement) => {
    const confirmed = window.confirm(
      `Delete "${announcement.title}"?`
    );

    if (!confirmed) return;

    try {
      setRefreshing(true);

      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", announcement.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to delete announcement.");
    } finally {
      setRefreshing(false);
    }
  };

  const createAnnouncement = async (event) => {
    event.preventDefault();

    const title = announcementForm.title.trim();
    const message = announcementForm.message.trim();

    if (!title || !message) {
      alert("Please enter both a title and a message.");
      return;
    }

    try {
      setRefreshing(true);

      const { error } = await supabase.from("announcements").insert({
        title,
        message,
        is_active: Boolean(announcementForm.is_active),
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
      alert(error.message || "Unable to create announcement.");
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
     STATS
     ========================================================= */

  const stats = useMemo(() => {
    const confirmed = bookings.filter(
      (booking) => normalizeStatus(booking.status) === "confirmed"
    ).length;

    const pending = bookings.filter(
      (booking) => normalizeStatus(booking.status) === "pending"
    ).length;

    const cancelled = bookings.filter(
      (booking) => normalizeStatus(booking.status) === "cancelled"
    ).length;

    const revenue = bookings
      .filter(
        (booking) =>
          normalizeStatus(booking.status) === "confirmed"
      )
      .reduce(
        (sum, booking) => sum + Number(booking.total_amount || 0),
        0
      );

    const activeTurfs = turfs.filter((turf) => turf.is_active).length;

    const availableSlots = slots.filter(
      (slot) => slot.is_available
    ).length;

    return {
      confirmed,
      pending,
      cancelled,
      revenue,
      activeTurfs,
      availableSlots,
    };
  }, [bookings, slots, turfs]);

  const sortedUpcomingBookings = useMemo(() => {
    const today = getTodayString();

    return bookings
      .filter((booking) => {
        const status = normalizeStatus(booking.status);

        return (
          status !== "cancelled" &&
          booking.booking_date >= today
        );
      })
      .sort((a, b) => {
        const aKey = `${a.booking_date} ${a.start_time}`;
        const bKey = `${b.booking_date} ${b.start_time}`;

        return aKey.localeCompare(bKey);
      })
      .slice(0, 6);
  }, [bookings]);

  const latestBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const aKey = `${a.booking_date || ""} ${a.start_time || ""}`;
        const bKey = `${b.booking_date || ""} ${b.start_time || ""}`;

        return bKey.localeCompare(aKey);
      })
      .slice(0, 8);
  }, [bookings]);

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
      id: TABS.ANNOUNCEMENTS,
      label: "Announcements",
      icon: Megaphone,
    },
  ];

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-logo">
            SPORT<span>IVA</span>
            <small>ADMIN CONTROL</small>
          </div>

          <div className="admin-sidebar-divider" />

          <nav>
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  className={`admin-nav ${
                    activeTab === item.id ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(item.id)}
                  type="button"
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-bottom">
          <button
            className="admin-refresh"
            onClick={() => refreshData()}
            disabled={refreshing}
            type="button"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "admin-spin" : ""}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
          </button>

          <button
            className="admin-logout"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
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
              {navItems.find((item) => item.id === activeTab)?.label ||
                "Admin Dashboard"}
            </h1>
          </div>

          <div className="admin-header-right">
            <div className="admin-live-status">
              <span />
              LIVE SYSTEM
            </div>

            <div className="admin-user-badge">
              <UserRound size={15} />
              <span>{adminEmail || "Administrator"}</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {errorMessage && (
            <div
              style={{
                marginBottom: 18,
                padding: "12px 15px",
                borderRadius: 10,
                border: "1px solid #f1c8c8",
                background: "#fff5f5",
                color: "#a04444",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {errorMessage}
            </div>
          )}

          {activeTab === TABS.OVERVIEW && (
            <>
              <section className="admin-welcome">
                <div>
                  <div className="admin-welcome-label">
                    CONTROL CENTER
                  </div>

                  <h2>
                    Welcome back to <span>Sportiva.</span>
                  </h2>

                  <p>
                    Manage turfs, time slots, customer bookings,
                    announcements and facility operations from one
                    place.
                  </p>
                </div>

                <div className="admin-welcome-icon">
                  <Activity size={29} />
                </div>
              </section>

              <section className="admin-stats">
                <div className="admin-stat">
                  <div className="admin-stat-icon">
                    <CalendarDays size={19} />
                  </div>

                  <div className="admin-stat-info">
                    <span>CONFIRMED BOOKINGS</span>
                    <strong>{stats.confirmed}</strong>
                    <small>Approved reservations</small>
                  </div>
                </div>

                <div className="admin-stat">
                  <div className="admin-stat-icon">
                    <Clock3 size={19} />
                  </div>

                  <div className="admin-stat-info">
                    <span>PENDING BOOKINGS</span>
                    <strong>{stats.pending}</strong>
                    <small>Waiting for approval</small>
                  </div>
                </div>

                <div className="admin-stat">
                  <div className="admin-stat-icon">
                    <Trophy size={19} />
                  </div>

                  <div className="admin-stat-info">
                    <span>ACTIVE TURFS</span>
                    <strong>{stats.activeTurfs}</strong>
                    <small>{turfs.length} total turfs</small>
                  </div>
                </div>

                <div className="admin-stat">
                  <div className="admin-stat-icon">
                    <Activity size={19} />
                  </div>

                  <div className="admin-stat-info">
                    <span>CONFIRMED REVENUE</span>
                    <strong>{formatMoney(stats.revenue)}</strong>
                    <small>From confirmed bookings</small>
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
                      <h2>Latest Bookings</h2>
                      <p>Most recent reservation activity.</p>
                    </div>

                    <button
                      type="button"
                      className="admin-small-button"
                      onClick={() => setActiveTab(TABS.BOOKINGS)}
                    >
                      View all
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  {latestBookings.length === 0 ? (
                    <div className="admin-empty">
                      <div className="admin-empty-icon">
                        <CalendarDays size={23} />
                      </div>
                      <h3>No bookings yet</h3>
                      <p>
                        New customer reservations will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Turf</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {latestBookings.map((booking) => {
                            const profile = getProfile(booking.user_id);

                            return (
                              <tr key={booking.id}>
                                <td>
                                  <span className="table-id">
                                    #{booking.id}
                                  </span>
                                </td>

                                <td>
                                  <div className="table-user">
                                    <div className="table-avatar">
                                      <UserRound size={13} />
                                    </div>
                                    <strong>
                                      {profile?.full_name ||
                                        "Unknown User"}
                                    </strong>
                                  </div>
                                </td>

                                <td>
                                  <span className="table-primary">
                                    {getTurfName(booking.turf_id)}
                                  </span>
                                </td>

                                <td>{formatDate(booking.booking_date)}</td>

                                <td>
                                  <div className="table-time">
                                    <span>
                                      {formatTime(booking.start_time)}
                                    </span>
                                    <ChevronRight size={11} />
                                    <span>
                                      {formatTime(booking.end_time)}
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  <span className="table-amount">
                                    {formatMoney(booking.total_amount)}
                                  </span>
                                </td>

                                <td>
                                  <StatusBadge
                                    status={booking.status}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="admin-side-column">
                  <div className="admin-mini-panel">
                    <div className="admin-mini-heading">
                      <div className="admin-mini-icon">
                        <Activity size={17} />
                      </div>

                      <div>
                        <span>BOOKING STATUS</span>
                        <strong>Current Overview</strong>
                      </div>
                    </div>

                    <div className="admin-status-row">
                      <span>
                        <i className="dot confirmed-dot" />
                        Confirmed
                      </span>
                      <strong>{stats.confirmed}</strong>
                    </div>

                    <div className="admin-status-row">
                      <span>
                        <i className="dot pending-dot" />
                        Pending
                      </span>
                      <strong>{stats.pending}</strong>
                    </div>

                    <div className="admin-status-row">
                      <span>
                        <i className="dot cancelled-dot" />
                        Cancelled
                      </span>
                      <strong>{stats.cancelled}</strong>
                    </div>
                  </div>

                  <div className="admin-mini-panel">
                    <div className="admin-mini-heading">
                      <div className="admin-mini-icon">
                        <Clock3 size={17} />
                      </div>

                      <div>
                        <span>TIME SLOTS</span>
                        <strong>Availability</strong>
                      </div>
                    </div>

                    <div className="admin-big-number">
                      {stats.availableSlots}
                    </div>

                    <p className="admin-mini-description">
                      Available slots ready for customer booking.
                    </p>

                    <button
                      type="button"
                      className="admin-outline-button"
                      onClick={openAddSlotForm}
                    >
                      <Plus size={14} />
                      Add Time Slot
                    </button>
                  </div>

                  <div className="admin-mini-panel">
                    <div className="admin-mini-heading">
                      <div className="admin-mini-icon">
                        <Bell size={17} />
                      </div>

                      <div>
                        <span>ANNOUNCEMENTS</span>
                        <strong>Live Messages</strong>
                      </div>
                    </div>

                    <div className="admin-big-number">
                      {
                        announcements.filter(
                          (item) => item.is_active
                        ).length
                      }
                    </div>

                    <p className="admin-mini-description">
                      Active announcements visible to customers.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === TABS.TURFS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    FACILITY MANAGEMENT
                  </div>
                  <h2>Turfs</h2>
                  <p>
                    Create, edit and control the facilities available
                    for booking.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={openAddTurfForm}
                >
                  <Plus size={14} />
                  Add Turf
                </button>
              </div>

              {showTurfForm && (
                <form
                  className="admin-form"
                  onSubmit={handleTurfSubmit}
                >
                  <div className="admin-form-heading">
                    <strong>
                      {editingTurf ? "Edit Turf" : "Create New Turf"}
                    </strong>

                    <span>
                      Configure the facility information shown to
                      customers.
                    </span>
                  </div>

                  <div className="admin-form-fields">
                    <div className="admin-form-field">
                      <label>TURF NAME</label>
                      <input
                        type="text"
                        value={turfForm.name}
                        onChange={(event) =>
                          setTurfForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Example: Sportiva Main Arena"
                      />
                    </div>

                    <div className="admin-form-field">
                      <label>PRICE PER HOUR</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={turfForm.price_per_hour}
                        onChange={(event) =>
                          setTurfForm((current) => ({
                            ...current,
                            price_per_hour: event.target.value,
                          }))
                        }
                        placeholder="2500"
                      />
                    </div>

                    <div className="admin-form-field full">
                      <label>DESCRIPTION</label>
                      <input
                        type="text"
                        value={turfForm.description}
                        onChange={(event) =>
                          setTurfForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Short description of the turf"
                      />
                    </div>

                    <div className="admin-form-field full">
                      <label>IMAGE URL</label>
                      <input
                        type="url"
                        value={turfForm.image_url}
                        onChange={(event) =>
                          setTurfForm((current) => ({
                            ...current,
                            image_url: event.target.value,
                          }))
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="admin-form-actions">
                    <button
                      type="button"
                      className="admin-cancel-button"
                      onClick={closeTurfForm}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={refreshing}
                    >
                      <Check size={14} />
                      {editingTurf ? "Save Changes" : "Create Turf"}
                    </button>
                  </div>
                </form>
              )}

              <div className="turf-list-header">
                <div>
                  <strong>Registered Facilities</strong>
                  <span>All turf facilities currently configured.</span>
                </div>

                <div className="turf-list-summary">
                  <span className="turf-summary-active">
                    {
                      turfs.filter((turf) => turf.is_active)
                        .length
                    }{" "}
                    active
                  </span>

                  <span className="turf-summary-disabled">
                    {
                      turfs.filter((turf) => !turf.is_active)
                        .length
                    }{" "}
                    disabled
                  </span>
                </div>
              </div>

              {turfs.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">
                    <Trophy size={23} />
                  </div>

                  <h3>No turfs created</h3>
                  <p>Create your first turf facility.</p>
                </div>
              ) : (
                <div className="turf-management-list">
                  {turfs.map((turf, index) => (
                    <div
                      key={turf.id}
                      className="turf-management-row"
                    >
                      <div className="turf-list-main">
                        <div className="turf-list-number">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="turf-list-image">
                          {turf.image_url ? (
                            <img
                              src={turf.image_url}
                              alt={turf.name}
                            />
                          ) : (
                            <Trophy size={19} />
                          )}
                        </div>

                        <div className="turf-list-info">
                          <strong>{turf.name}</strong>
                          <span>
                            {turf.description ||
                              "No description provided"}
                          </span>
                        </div>
                      </div>

                      <div className="turf-list-price">
                        <span>PRICE</span>
                        <strong>
                          {formatMoney(turf.price_per_hour)}
                          <small>/hr</small>
                        </strong>
                      </div>

                      <div className="turf-list-date">
                        <span>CREATED</span>
                        <strong>
                          {formatDate(
                            turf.created_at?.slice(0, 10)
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
                          {turf.is_active ? "Active" : "Disabled"}
                        </span>
                      </div>

                      <div className="turf-list-actions">
                        <button
                          type="button"
                          className="turf-action-toggle"
                          onClick={() => toggleTurf(turf)}
                          disabled={refreshing}
                        >
                          <Power size={12} />
                          {turf.is_active ? "Disable" : "Enable"}
                        </button>

                        <button
                          type="button"
                          className="turf-action-toggle"
                          onClick={() => openEditTurfForm(turf)}
                          disabled={refreshing}
                        >
                          <Edit3 size={12} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="turf-action-delete"
                          onClick={() => deleteTurf(turf)}
                          disabled={refreshing}
                          title="Delete turf"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === TABS.SLOTS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    BOOKING AVAILABILITY
                  </div>
                  <h2>Time Slots</h2>
                  <p>
                    Create and manage the exact schedule customers
                    can book.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={openAddSlotForm}
                >
                  <Plus size={14} />
                  Add Time Slot
                </button>
              </div>

              {showSlotForm && (
                <form
                  className="admin-form admin-slot-form"
                  onSubmit={handleSlotSubmit}
                >
                  <div className="admin-form-heading">
                    <strong>
                      {editingSlot
                        ? "Edit Time Slot"
                        : "Add New Time Slot"}
                    </strong>

                    <span>
                      Choose a turf, date and booking window.
                    </span>
                  </div>

                  <div className="admin-form-fields">
                    <div className="admin-form-field">
                      <label>TURF</label>

                      <select
                        value={slotForm.turf_id}
                        onChange={(event) =>
                          setSlotForm((current) => ({
                            ...current,
                            turf_id: event.target.value,
                          }))
                        }
                        required
                      >
                        <option value="">Select turf</option>

                        {turfs
                          .filter((turf) => turf.is_active)
                          .map((turf) => (
                            <option
                              key={turf.id}
                              value={turf.id}
                            >
                              {turf.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="admin-form-field">
                      <label>DATE</label>

                      <input
                        type="date"
                        min={editingSlot ? undefined : getTodayString()}
                        value={slotForm.slot_date}
                        onChange={(event) =>
                          setSlotForm((current) => ({
                            ...current,
                            slot_date: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label>START TIME</label>

                      <input
                        type="time"
                        value={slotForm.start_time}
                        onChange={(event) =>
                          setSlotForm((current) => ({
                            ...current,
                            start_time: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label>END TIME</label>

                      <input
                        type="time"
                        value={slotForm.end_time}
                        onChange={(event) =>
                          setSlotForm((current) => ({
                            ...current,
                            end_time: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="admin-form-field full">
                      <label>INITIAL AVAILABILITY</label>

                      <select
                        value={
                          slotForm.is_available
                            ? "available"
                            : "unavailable"
                        }
                        onChange={(event) =>
                          setSlotForm((current) => ({
                            ...current,
                            is_available:
                              event.target.value === "available",
                          }))
                        }
                      >
                        <option value="available">
                          Available for booking
                        </option>
                        <option value="unavailable">
                          Unavailable
                        </option>
                      </select>

                      <div className="admin-slot-form-note">
                        <ShieldCheck size={12} />
                        Overlapping slots are blocked by the database.
                      </div>
                    </div>
                  </div>

                  <div className="admin-form-actions">
                    <button
                      type="button"
                      className="admin-cancel-button"
                      onClick={closeSlotForm}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={refreshing}
                    >
                      {editingSlot ? (
                        <Check size={14} />
                      ) : (
                        <Plus size={14} />
                      )}

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
                    {filteredSlots.length} slot
                    {filteredSlots.length === 1 ? "" : "s"} shown
                  </strong>

                  <span>
                    {slots.length} total configured slots
                  </span>
                </div>

                <div className="admin-slot-filters">
                  <select
                    className="admin-slot-filter"
                    value={slotTurfFilter}
                    onChange={(event) =>
                      setSlotTurfFilter(event.target.value)
                    }
                  >
                    <option value="all">All turfs</option>

                    {turfs.map((turf) => (
                      <option key={turf.id} value={turf.id}>
                        {turf.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    className="admin-slot-filter"
                    value={slotDateFilter}
                    onChange={(event) =>
                      setSlotDateFilter(event.target.value)
                    }
                  />

                  {(slotTurfFilter !== "all" ||
                    slotDateFilter) && (
                    <button
                      type="button"
                      className="admin-small-button"
                      onClick={() => {
                        setSlotTurfFilter("all");
                        setSlotDateFilter("");
                      }}
                    >
                      <X size={12} />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {filteredSlots.length === 0 ? (
                <div className="admin-empty admin-slot-empty">
                  <div className="admin-empty-icon">
                    <Clock3 size={23} />
                  </div>

                  <h3>No time slots found</h3>

                  <p>
                    Add a time slot above to make a booking window
                    available for customers.
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table admin-slot-table">
                    <thead>
                      <tr>
                        <th>ID</th>
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
                            <span className="table-id">
                              #{slot.id}
                            </span>
                          </td>

                          <td>
                            <span className="table-primary">
                              {getTurfName(slot.turf_id)}
                            </span>
                          </td>

                          <td>
                            <div className="admin-slot-date">
                              <strong>
                                {formatDate(slot.slot_date)}
                              </strong>

                              <span>{slot.slot_date}</span>
                            </div>
                          </td>

                          <td>
                            <div className="admin-slot-time">
                              <span>
                                {formatTime(slot.start_time)}
                              </span>

                              <span className="separator">—</span>

                              <span>
                                {formatTime(slot.end_time)}
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
                                  openEditSlotForm(slot)
                                }
                                disabled={refreshing}
                                title="Edit slot"
                              >
                                <Edit3 size={12} />
                                Edit
                              </button>

                              <button
                                type="button"
                                className="admin-slot-action toggle"
                                onClick={() =>
                                  toggleSlotAvailability(slot)
                                }
                                disabled={refreshing}
                                title={
                                  slot.is_available
                                    ? "Make unavailable"
                                    : "Make available"
                                }
                              >
                                <Power size={12} />
                                {slot.is_available
                                  ? "Disable"
                                  : "Enable"}
                              </button>

                              <button
                                type="button"
                                className="admin-slot-action delete"
                                onClick={() => deleteSlot(slot)}
                                disabled={refreshing}
                                title="Delete slot"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === TABS.BOOKINGS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    RESERVATION MANAGEMENT
                  </div>
                  <h2>Bookings</h2>
                  <p>
                    Review reservations and approve or cancel
                    pending requests.
                  </p>
                </div>

                <div className="admin-booking-summary">
                  {filteredBookings.length} shown
                </div>
              </div>

              <div
                style={{
                  padding: "16px 22px",
                  borderBottom: "1px solid #e8edea",
                  background: "#fbfcfb",
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(220px, 1.5fr) repeat(3, minmax(140px, 1fr))",
                  gap: 9,
                }}
              >
                <input
                  type="text"
                  placeholder="Search booking, customer, phone or turf..."
                  value={bookingSearch}
                  onChange={(event) =>
                    setBookingSearch(event.target.value)
                  }
                  style={{
                    height: 36,
                    padding: "0 11px",
                    border: "1px solid #dce4df",
                    borderRadius: 8,
                    outline: "none",
                    background: "#fff",
                    color: "#17221d",
                    fontFamily: "inherit",
                    fontSize: 10,
                  }}
                />

                <select
                  value={bookingStatusFilter}
                  onChange={(event) =>
                    setBookingStatusFilter(event.target.value)
                  }
                  style={{
                    height: 36,
                    padding: "0 10px",
                    border: "1px solid #dce4df",
                    borderRadius: 8,
                    outline: "none",
                    background: "#fff",
                    color: "#34493d",
                    fontFamily: "inherit",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={bookingTurfFilter}
                  onChange={(event) =>
                    setBookingTurfFilter(event.target.value)
                  }
                  style={{
                    height: 36,
                    padding: "0 10px",
                    border: "1px solid #dce4df",
                    borderRadius: 8,
                    outline: "none",
                    background: "#fff",
                    color: "#34493d",
                    fontFamily: "inherit",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  <option value="all">All turfs</option>

                  {turfs.map((turf) => (
                    <option key={turf.id} value={turf.id}>
                      {turf.name}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={bookingDateFilter}
                  onChange={(event) =>
                    setBookingDateFilter(event.target.value)
                  }
                  style={{
                    height: 36,
                    padding: "0 10px",
                    border: "1px solid #dce4df",
                    borderRadius: 8,
                    outline: "none",
                    background: "#fff",
                    color: "#34493d",
                    fontFamily: "inherit",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
              </div>

              {filteredBookings.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">
                    <CalendarDays size={23} />
                  </div>

                  <h3>No bookings found</h3>
                  <p>
                    No reservations match the selected filters.
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Turf</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBookings.map((booking) => {
                        const profile = getProfile(booking.user_id);
                        const status = normalizeStatus(
                          booking.status
                        );

                        return (
                          <tr key={booking.id}>
                            <td>
                              <span className="table-id">
                                #{booking.id}
                              </span>
                            </td>

                            <td>
                              <div className="table-user">
                                <div className="table-avatar">
                                  <UserRound size={13} />
                                </div>

                                <div>
                                  <strong>
                                    {profile?.full_name ||
                                      "Unknown User"}
                                  </strong>

                                  {profile?.phone && (
                                    <div
                                      style={{
                                        marginTop: 2,
                                        color: "#8d9892",
                                        fontSize: 8,
                                      }}
                                    >
                                      {profile.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="table-primary">
                                {getTurfName(booking.turf_id)}
                              </span>
                            </td>

                            <td>
                              {formatDate(booking.booking_date)}
                            </td>

                            <td>
                              <div className="table-time">
                                <span>
                                  {formatTime(booking.start_time)}
                                </span>
                                <ChevronRight size={11} />
                                <span>
                                  {formatTime(booking.end_time)}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span className="table-amount">
                                {formatMoney(booking.total_amount)}
                              </span>
                            </td>

                            <td>
                              <StatusBadge status={status} />
                            </td>

                            <td>
                              <div className="booking-actions">
                                {status === "pending" && (
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
                                      <Check size={11} />
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
                                      <X size={11} />
                                      Cancel
                                    </button>
                                  </>
                                )}

                                {status !== "pending" && (
                                  <span className="action-complete">
                                    {status === "confirmed"
                                      ? "Confirmed"
                                      : "Cancelled"}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  className="admin-slot-action edit"
                                  onClick={() =>
                                    setSelectedBooking(booking)
                                  }
                                  title="View booking"
                                >
                                  <Eye size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === TABS.USERS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    CUSTOMER DIRECTORY
                  </div>
                  <h2>Users</h2>
                  <p>
                    Registered customer profiles connected to the
                    Sportiva platform.
                  </p>
                </div>

                <div className="admin-count-badge">
                  {users.length} users
                </div>
              </div>

              {users.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">
                    <Users size={23} />
                  </div>

                  <h3>No users found</h3>
                  <p>
                    Registered users will appear in this directory.
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Joined</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="table-user">
                              <div className="table-avatar">
                                <UserRound size={13} />
                              </div>

                              <strong>
                                {user.full_name || "Unnamed User"}
                              </strong>
                            </div>
                          </td>

                          <td>{user.phone || "—"}</td>
                          <td>{user.email || "—"}</td>
                          <td>{user.address || "—"}</td>
                          <td>
                            {formatDate(
                              user.created_at?.slice(0, 10)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === TABS.ANNOUNCEMENTS && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <div className="admin-section-kicker">
                    CUSTOMER COMMUNICATION
                  </div>
                  <h2>Announcements</h2>
                  <p>
                    Publish important updates and operational
                    messages to customers.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() =>
                    setShowAnnouncementForm(
                      (current) => !current
                    )
                  }
                >
                  <Plus size={14} />
                  {showAnnouncementForm
                    ? "Close Form"
                    : "New Announcement"}
                </button>
              </div>

              {showAnnouncementForm && (
                <form
                  className="admin-form"
                  onSubmit={createAnnouncement}
                >
                  <div className="admin-form-heading">
                    <strong>Create Announcement</strong>
                    <span>
                      This message can appear on the customer
                      dashboard.
                    </span>
                  </div>

                  <div className="admin-form-fields">
                    <div className="admin-form-field full">
                      <label>TITLE</label>

                      <input
                        type="text"
                        value={announcementForm.title}
                        onChange={(event) =>
                          setAnnouncementForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        placeholder="Example: Weekend booking update"
                        required
                      />
                    </div>

                    <div className="admin-form-field full">
                      <label>MESSAGE</label>

                      <input
                        type="text"
                        value={announcementForm.message}
                        onChange={(event) =>
                          setAnnouncementForm((current) => ({
                            ...current,
                            message: event.target.value,
                          }))
                        }
                        placeholder="Write the announcement message"
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-actions">
                    <button
                      type="button"
                      className="admin-cancel-button"
                      onClick={() =>
                        setShowAnnouncementForm(false)
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={refreshing}
                    >
                      <Megaphone size={14} />
                      Publish
                    </button>
                  </div>
                </form>
              )}

              {announcements.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">
                    <Megaphone size={23} />
                  </div>

                  <h3>No announcements</h3>
                  <p>
                    Create your first customer announcement above.
                  </p>
                </div>
              ) : (
                <div className="announcement-list">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="announcement-admin-card"
                    >
                      <div className="announcement-content">
                        <div className="announcement-icon">
                          <Bell size={16} />
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

                          <h3>{announcement.title}</h3>
                          <p>{announcement.message}</p>
                        </div>
                      </div>

                      <div className="admin-card-actions">
                        <button
                          type="button"
                          onClick={() =>
                            toggleAnnouncement(announcement)
                          }
                          disabled={refreshing}
                        >
                          <Power size={12} />
                          {announcement.is_active
                            ? "Disable"
                            : "Enable"}
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            deleteAnnouncement(announcement)
                          }
                          disabled={refreshing}
                          title="Delete announcement"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {selectedBooking && (
        <div
          onClick={() => setSelectedBooking(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            background: "rgba(16, 37, 27, 0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(560px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 16,
              background: "#fff",
              border: "1px solid #e1e9e4",
              boxShadow: "0 25px 80px rgba(0,0,0,.18)",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #e8edea",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 15,
              }}
            >
              <div>
                <div className="admin-section-kicker">
                  BOOKING DETAILS
                </div>

                <h2
                  style={{
                    margin: "5px 0 0",
                    fontSize: 17,
                    color: "#17221d",
                    fontWeight: 850,
                  }}
                >
                  Booking #{selectedBooking.id}
                </h2>
              </div>

              <button
                type="button"
                className="admin-cancel-button"
                onClick={() => setSelectedBooking(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {(() => {
                const profile = getProfile(
                  selectedBooking.user_id
                );

                return (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          padding: 13,
                          borderRadius: 10,
                          background: "#f7faf8",
                        }}
                      >
                        <div
                          style={{
                            color: "#819087",
                            fontSize: 8,
                            fontWeight: 850,
                            letterSpacing: 0.8,
                          }}
                        >
                          CUSTOMER
                        </div>

                        <div
                          style={{
                            marginTop: 5,
                            color: "#26372d",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {profile?.full_name ||
                            "Unknown customer"}
                        </div>

                        <div
                          style={{
                            marginTop: 3,
                            color: "#78867f",
                            fontSize: 9,
                          }}
                        >
                          {profile?.phone || "No phone"}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: 13,
                          borderRadius: 10,
                          background: "#f7faf8",
                        }}
                      >
                        <div
                          style={{
                            color: "#819087",
                            fontSize: 8,
                            fontWeight: 850,
                            letterSpacing: 0.8,
                          }}
                        >
                          TURF
                        </div>

                        <div
                          style={{
                            marginTop: 5,
                            color: "#26372d",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {getTurfName(selectedBooking.turf_id)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: 13,
                          borderRadius: 10,
                          background: "#f7faf8",
                        }}
                      >
                        <div
                          style={{
                            color: "#819087",
                            fontSize: 8,
                            fontWeight: 850,
                            letterSpacing: 0.8,
                          }}
                        >
                          DATE
                        </div>

                        <div
                          style={{
                            marginTop: 5,
                            color: "#26372d",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {formatDate(
                            selectedBooking.booking_date
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: 13,
                          borderRadius: 10,
                          background: "#f7faf8",
                        }}
                      >
                        <div
                          style={{
                            color: "#819087",
                            fontSize: 8,
                            fontWeight: 850,
                            letterSpacing: 0.8,
                          }}
                        >
                          TIME
                        </div>

                        <div
                          style={{
                            marginTop: 5,
                            color: "#26372d",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {formatTime(selectedBooking.start_time)}
                          {" — "}
                          {formatTime(selectedBooking.end_time)}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 16,
                        padding: 15,
                        border: "1px solid #e2e9e4",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 15,
                      }}
                    >
                      <span
                        style={{
                          color: "#718078",
                          fontSize: 10,
                          fontWeight: 750,
                        }}
                      >
                        TOTAL AMOUNT
                      </span>

                      <strong
                        style={{
                          color: "#246c42",
                          fontSize: 17,
                        }}
                      >
                        {formatMoney(
                          selectedBooking.total_amount
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          color: "#748179",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        Status
                      </span>

                      <StatusBadge
                        status={selectedBooking.status}
                      />
                    </div>

                    {normalizeStatus(
                      selectedBooking.status
                    ) === "pending" && (
                      <div
                        style={{
                          marginTop: 18,
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          className="booking-confirm"
                          style={{
                            flex: 1,
                            height: 40,
                          }}
                          onClick={() =>
                            updateBookingStatus(
                              selectedBooking,
                              "confirmed"
                            )
                          }
                          disabled={
                            processingBookingId ===
                            selectedBooking.id
                          }
                        >
                          <Check size={13} />
                          Confirm Booking
                        </button>

                        <button
                          type="button"
                          className="booking-cancel"
                          style={{
                            flex: 1,
                            height: 40,
                          }}
                          onClick={() =>
                            updateBookingStatus(
                              selectedBooking,
                              "cancelled"
                            )
                          }
                          disabled={
                            processingBookingId ===
                            selectedBooking.id
                          }
                        >
                          <X size={13} />
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;