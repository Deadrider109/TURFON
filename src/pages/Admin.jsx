import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  Edit3,
  Gift,
  LayoutDashboard,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TicketPercent,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const COLORS = {
  green: "#173d26",
  green2: "#245837",
  lime: "#a9dc63",
  bg: "#f3f6f3",
  white: "#ffffff",
  text: "#172019",
  muted: "#78847c",
  border: "#e1e8e2",
  soft: "#f7faf7",
  success: "#347044",
  warning: "#9a6820",
  danger: "#a14e4e",
};

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

const NAV = [
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

  const [hourPart, minute = "00"] =
    String(value).split(":");

  const hour = Number(hourPart);

  if (!Number.isFinite(hour)) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function toDateTimeInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();

  const local = new Date(
    date.getTime() - offset * 60000
  );

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
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "SPORTIVA-";

  for (let i = 0; i < 6; i += 1) {
    result +=
      chars[
        Math.floor(Math.random() * chars.length)
      ];
  }

  return result;
}

function Status({ type = "neutral", children }) {
  const backgrounds = {
    success: "#eaf5ec",
    warning: "#fbf1df",
    danger: "#faeded",
    info: "#edf3f8",
    neutral: "#f0f2f1",
  };

  const colors = {
    success: COLORS.success,
    warning: COLORS.warning,
    danger: COLORS.danger,
    info: "#4d708e",
    neutral: "#77827c",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 26,
        padding: "0 9px",
        borderRadius: 999,
        background: backgrounds[type],
        color: colors[type],
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
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
      style={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          ...styles.modal,
          maxWidth: wide ? 790 : 620,
        }}
      >
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalEyebrow}>
              {eyebrow}
            </div>

            <h2 style={styles.modalTitle}>
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={styles.modalClose}
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>
        <Icon size={18} />
      </div>

      <div style={styles.statBody}>
        <span style={styles.statLabel}>
          {label}
        </span>

        <strong style={styles.statValue}>
          {value}
        </strong>

        <small style={styles.statDetail}>
          {detail}
        </small>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background:
      "radial-gradient(circle at 85% 0%, rgba(120,170,120,.08), transparent 28%), #f3f6f3",
    color: COLORS.text,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    padding: "22px 14px 16px",
    background:
      "linear-gradient(180deg, #0d291b 0%, #102f20 100%)",
    color: "#fff",
    boxShadow:
      "14px 0 40px rgba(10,30,17,.08)",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "0 5px 28px",
  },

  brandMark: {
    width: 47,
    height: 47,
    display: "grid",
    placeItems: "center",
    borderRadius: 14,
    border:
      "1px solid rgba(172,230,139,.28)",
    background:
      "linear-gradient(145deg, rgba(56,111,72,.75), rgba(19,65,38,.95))",
    color: "#b7ebc5",
    fontSize: 18,
    fontWeight: 900,
    flex: "0 0 auto",
  },

  brandCopy: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  brandTitle: {
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: "0.05em",
    lineHeight: 1,
  },

  brandSubtitle: {
    marginTop: 5,
    color: "rgba(220,240,226,.45)",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.14em",
  },

  navLabel: {
    margin: "0 10px 10px",
    color: "rgba(220,238,223,.4)",
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: "0.15em",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  navButton: {
    position: "relative",
    width: "100%",
    minHeight: 43,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
    border: "1px solid transparent",
    borderRadius: 10,
    background: "transparent",
    color: "rgba(238,246,240,.64)",
    fontSize: 12,
    fontWeight: 650,
    cursor: "pointer",
    transition:
      "background .2s ease, color .2s ease, transform .2s ease",
    textAlign: "left",
  },

  navActive: {
    background:
      "linear-gradient(90deg, rgba(93,156,102,.18), rgba(93,156,102,.035))",
    color: "#fff",
    border:
      "1px solid rgba(162,224,133,.11)",
  },

  navBadge: {
    minWidth: 20,
    height: 20,
    marginLeft: "auto",
    display: "grid",
    placeItems: "center",
    padding: "0 5px",
    borderRadius: 99,
    background: "rgba(169,220,99,.12)",
    color: "#b7e787",
    fontSize: 9,
    fontWeight: 900,
  },

  sidebarBottom: {
    marginTop: "auto",
    paddingTop: 15,
    borderTop:
      "1px solid rgba(255,255,255,.07)",
  },

  secure: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "7px 6px",
    color: "rgba(224,239,227,.55)",
  },

  secureText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },

  secureTitle: {
    color: "rgba(239,247,240,.72)",
    fontSize: 7,
    fontWeight: 900,
    letterSpacing: "0.12em",
  },

  secureSubtitle: {
    color: "rgba(220,237,223,.32)",
    fontSize: 8,
  },

  main: {
    width: "calc(100% - 250px)",
    marginLeft: 250,
    minWidth: 0,
    minHeight: "100vh",
    padding: "28px 32px 55px",
  },

  header: {
    minHeight: 65,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 22,
  },

  headerEyebrow: {
    display: "block",
    marginBottom: 6,
    color: "#758079",
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: "0.15em",
  },

  headerTitle: {
    margin: 0,
    color: "#19251e",
    fontSize: 29,
    lineHeight: 1,
    fontWeight: 850,
    letterSpacing: "-0.04em",
  },

  refreshButton: {
    minHeight: 40,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "0 13px",
    border:
      "1px solid #e1e8e2",
    borderRadius: 10,
    background: "#fff",
    color: "#59665e",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  },

  toast: {
    minHeight: 42,
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 17,
    padding: "0 12px",
    border:
      "1px solid #cfe2d1",
    borderRadius: 10,
    background: "#f0f8f1",
    color: "#35623f",
    fontSize: 11,
  },

  content: {
    width: "100%",
    maxWidth: 1450,
    margin: "0 auto",
    animation:
      "sportivaAdminFade .28s ease",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    minHeight: 230,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 25,
    marginBottom: 16,
    padding: "30px 32px",
    borderRadius: 21,
    border:
      "1px solid rgba(53,91,61,.13)",
    background:
      "radial-gradient(circle at 84% 24%, rgba(177,225,103,.14), transparent 24%), linear-gradient(140deg, #153a25, #214f31 65%, #294c33)",
    color: "#fff",
    boxShadow:
      "0 20px 45px rgba(25,54,31,.1)",
  },

  heroEyebrow: {
    color: "rgba(220,241,222,.5)",
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: "0.15em",
  },

  heroTitle: {
    margin: "10px 0 11px",
    color: "#fff",
    fontSize: "clamp(28px, 3.4vw, 42px)",
    lineHeight: 0.98,
    fontWeight: 850,
    letterSpacing: "-0.05em",
  },

  heroText: {
    maxWidth: 580,
    margin: 0,
    color:
      "rgba(231,244,233,.64)",
    fontSize: 12,
    lineHeight: 1.65,
  },

  livePill: {
    minHeight: 29,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "0 10px",
    border:
      "1px solid rgba(198,229,171,.13)",
    borderRadius: 99,
    background:
      "rgba(255,255,255,.05)",
    color: "#d8edca",
    fontSize: 8,
    fontWeight: 850,
    letterSpacing: "0.08em",
    whiteSpace: "nowrap",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    background: "#9bda70",
    boxShadow:
      "0 0 10px rgba(155,218,112,.6)",
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    minWidth: 0,
    minHeight: 119,
    display: "flex",
    alignItems: "flex-start",
    gap: 11,
    padding: 16,
    border:
      "1px solid #e1e8e2",
    borderRadius: 15,
    background: "#fff",
    boxShadow:
      "0 9px 27px rgba(26,52,31,.035)",
    transition:
      "transform .2s ease, box-shadow .2s ease",
  },

  statIcon: {
    width: 37,
    height: 37,
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    border:
      "1px solid #e0e9e1",
    borderRadius: 10,
    background: "#f1f7f2",
    color: "#3b7048",
  },

  statBody: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },

  statLabel: {
    color: "#7e8881",
    fontSize: 8,
    fontWeight: 850,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
  },

  statValue: {
    marginTop: 8,
    color: "#19271f",
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 850,
    letterSpacing: "-0.04em",
    overflowWrap: "anywhere",
  },

  statDetail: {
    marginTop: 6,
    color: "#909992",
    fontSize: 9,
  },

  panelGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: 14,
    marginBottom: 16,
  },

  panel: {
    minWidth: 0,
    padding: 19,
    border:
      "1px solid #e1e8e2",
    borderRadius: 16,
    background: "#fff",
    boxShadow:
      "0 10px 30px rgba(30,55,35,.035)",
  },

  panelHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 14,
    borderBottom:
      "1px solid #edf1ed",
  },

  panelHeaderEyebrow: {
    color: "#829087",
    fontSize: 7,
    fontWeight: 900,
    letterSpacing: "0.13em",
  },

  panelHeaderTitle: {
    margin: "5px 0 0",
    color: "#253329",
    fontSize: 15,
    fontWeight: 800,
  },

  simpleStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: 9,
    paddingTop: 16,
  },

  simpleStat: {
    padding: 13,
    border:
      "1px solid #e9eee9",
    borderRadius: 10,
    background: "#fafcfb",
  },

  simpleStatLabel: {
    display: "block",
    color: "#7d8880",
    fontSize: 8,
    fontWeight: 750,
  },

  simpleStatValue: {
    display: "block",
    marginTop: 7,
    color: "#25342b",
    fontSize: 20,
    lineHeight: 1,
    fontWeight: 800,
  },

  recentPanel: {
    padding: 19,
    border:
      "1px solid #e1e8e2",
    borderRadius: 16,
    background: "#fff",
    boxShadow:
      "0 10px 30px rgba(30,55,35,.035)",
  },

  recentRow: {
    minHeight: 58,
    display: "grid",
    gridTemplateColumns:
      "1.5fr 1.1fr .7fr auto",
    alignItems: "center",
    gap: 12,
    borderBottom:
      "1px solid #edf1ed",
  },

  person: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  avatar: {
    width: 30,
    height: 30,
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    borderRadius: 9,
    background: "#edf5ee",
    color: "#3b6e46",
    fontSize: 10,
    fontWeight: 850,
  },

  personName: {
    overflow: "hidden",
    color: "#29372e",
    fontSize: 10,
    fontWeight: 750,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  toolbar: {
    minHeight: 47,
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 13,
  },

  search: {
    width: "100%",
    maxWidth: 420,
    height: 41,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 11px",
    border:
      "1px solid #e1e8e2",
    borderRadius: 10,
    background: "#fff",
    color: "#89938c",
  },

  searchInput: {
    width: "100%",
    minWidth: 0,
    border: 0,
    outline: 0,
    background: "transparent",
    color: "#253129",
    fontSize: 11,
  },

  filter: {
    height: 41,
    padding: "0 10px",
    border:
      "1px solid #e1e8e2",
    borderRadius: 10,
    outline: 0,
    background: "#fff",
    color: "#5e6961",
    fontSize: 10,
  },

  tableCard: {
    overflow: "hidden",
    border:
      "1px solid #e1e8e2",
    borderRadius: 16,
    background: "#fff",
    boxShadow:
      "0 10px 30px rgba(30,55,35,.035)",
  },

  tableWrap: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: 880,
    borderCollapse: "collapse",
  },

  th: {
    padding: "13px 16px",
    borderBottom:
      "1px solid #e8ede8",
    background: "#fafcfb",
    color: "#828c85",
    fontSize: 7,
    fontWeight: 900,
    letterSpacing: "0.12em",
    textAlign: "left",
    textTransform: "uppercase",
  },

  td: {
    padding: "14px 16px",
    borderBottom:
      "1px solid #edf1ed",
    color: "#5f6a63",
    fontSize: 10,
    verticalAlign: "middle",
  },

  actions: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },

  iconButton: {
    width: 30,
    height: 30,
    display: "grid",
    placeItems: "center",
    border:
      "1px solid #e0e7e1",
    borderRadius: 8,
    background: "#fff",
    color: "#66736b",
    cursor: "pointer",
  },

  empty: {
    minHeight: 190,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: 30,
    color: "#89928c",
    textAlign: "center",
  },

  emptyTitle: {
    color: "#3a493f",
    fontSize: 12,
    fontWeight: 800,
  },

  emptyText: {
    fontSize: 9,
  },

  turfGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },

  turfCard: {
    overflow: "hidden",
    border:
      "1px solid #e1e8e2",
    borderRadius: 16,
    background: "#fff",
    boxShadow:
      "0 10px 30px rgba(30,55,35,.035)",
  },

  turfImage: {
    height: 175,
    overflow: "hidden",
    position: "relative",
    background:
      "linear-gradient(145deg,#dce9df,#eff5ef)",
  },

  turfImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  turfBody: {
    padding: 16,
  },

  turfEyebrow: {
    color: "#829087",
    fontSize: 7,
    fontWeight: 900,
    letterSpacing: "0.11em",
  },

  turfTitle: {
    margin: "5px 0 7px",
    color: "#25332a",
    fontSize: 17,
    fontWeight: 800,
  },

  turfDescription: {
    minHeight: 32,
    margin: 0,
    color: "#838d86",
    fontSize: 10,
    lineHeight: 1.5,
  },

  turfPrice: {
    marginTop: 15,
    display: "flex",
    alignItems: "baseline",
    gap: 4,
  },

  turfPriceValue: {
    color: "#2b6238",
    fontSize: 21,
    fontWeight: 850,
  },

  turfPriceUnit: {
    color: "#8b948d",
    fontSize: 9,
  },

  inlineButtons: {
    display: "flex",
    gap: 6,
    marginTop: 13,
  },

  inlineButton: {
    minHeight: 31,
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "0 7px",
    border:
      "1px solid #e0e7e1",
    borderRadius: 8,
    background: "#fff",
    color: "#657067",
    fontSize: 9,
    fontWeight: 750,
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background:
      "rgba(10,25,15,.55)",
    backdropFilter: "blur(7px)",
    WebkitBackdropFilter: "blur(7px)",
  },

  modal: {
    width: "100%",
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    border:
      "1px solid #dce5de",
    borderRadius: 19,
    background: "#fff",
    boxShadow:
      "0 35px 100px rgba(8,23,13,.25)",
    animation:
      "sportivaModalIn .22s ease",
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
    padding: "21px 22px",
    borderBottom:
      "1px solid #edf1ed",
  },

  modalEyebrow: {
    color: "#758179",
    fontSize: 7,
    fontWeight: 900,
    letterSpacing: "0.14em",
  },

  modalTitle: {
    margin: "5px 0 0",
    color: "#29362e",
    fontSize: 21,
    fontWeight: 850,
  },

  modalClose: {
    width: 33,
    height: 33,
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    border:
      "1px solid #e1e7e2",
    borderRadius: 9,
    background: "#fff",
    color: "#6f7972",
    cursor: "pointer",
  },

  form: {
    padding: "21px 22px 22px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: 13,
  },

  field: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  full: {
    gridColumn: "1 / -1",
  },

  label: {
    color: "#5d6961",
    fontSize: 9,
    fontWeight: 850,
  },

  input: {
    width: "100%",
    minHeight: 41,
    padding: "0 10px",
    border:
      "1px solid #dbe4dd",
    borderRadius: 9,
    outline: 0,
    background: "#fff",
    color: "#27362d",
    fontSize: 11,
  },

  textarea: {
    width: "100%",
    minHeight: 88,
    padding: "9px 10px",
    border:
      "1px solid #dbe4dd",
    borderRadius: 9,
    outline: 0,
    background: "#fff",
    color: "#27362d",
    fontSize: 11,
    resize: "vertical",
  },

  select: {
    width: "100%",
    height: 41,
    padding: "0 10px",
    border:
      "1px solid #dbe4dd",
    borderRadius: 9,
    outline: 0,
    background: "#fff",
    color: "#27362d",
    fontSize: 11,
  },

  check: {
    minHeight: 41,
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 15,
    padding: "0 10px",
    border:
      "1px solid #e0e7e1",
    borderRadius: 9,
    background: "#fafcfb",
  },

  checkLabel: {
    color: "#4f5c54",
    fontSize: 9,
    fontWeight: 700,
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 19,
    paddingTop: 17,
    borderTop:
      "1px solid #edf1ed",
  },

  codeRow: {
    display: "flex",
    gap: 7,
  },

  generateButton: {
    minWidth: 86,
    border:
      "1px solid #dbe7dc",
    borderRadius: 9,
    background: "#f2f7f3",
    color: "#3c6845",
    fontSize: 9,
    fontWeight: 850,
    cursor: "pointer",
  },
};

export default function Admin() {
  const [activeSection, setActiveSection] =
    useState("overview");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] = useState("");

  const [turfs, setTurfs] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] =
    useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] =
    useState([]);

  const [coupons, setCoupons] =
    useState([]);
  const [couponUsages, setCouponUsages] =
    useState([]);

  const [memberRewards, setMemberRewards] =
    useState([]);
  const [rewardCheckpoints, setRewardCheckpoints] =
    useState([]);
  const [communityOffers, setCommunityOffers] =
    useState([]);
  const [rewardTransactions, setRewardTransactions] =
    useState([]);
  const [rewardRedemptions, setRewardRedemptions] =
    useState([]);

  const [rewardTab, setRewardTab] =
    useState("members");

  const [turfSearch, setTurfSearch] =
    useState("");

  const [slotSearch, setSlotSearch] =
    useState("");
  const [slotTurf, setSlotTurf] =
    useState("all");
  const [slotDate, setSlotDate] =
    useState("");

  const [bookingSearch, setBookingSearch] =
    useState("");
  const [bookingStatus, setBookingStatus] =
    useState("all");

  const [userSearch, setUserSearch] =
    useState("");

  const [couponSearch, setCouponSearch] =
    useState("");

  const [showTurfModal, setShowTurfModal] =
    useState(false);
  const [editingTurf, setEditingTurf] =
    useState(null);
  const [turfForm, setTurfForm] =
    useState(EMPTY_TURF);

  const [showSlotModal, setShowSlotModal] =
    useState(false);
  const [editingSlot, setEditingSlot] =
    useState(null);
  const [slotForm, setSlotForm] =
    useState(EMPTY_SLOT);

  const [showCouponModal, setShowCouponModal] =
    useState(false);
  const [editingCoupon, setEditingCoupon] =
    useState(null);
  const [couponForm, setCouponForm] =
    useState(EMPTY_COUPON);

  const [
    showAnnouncementModal,
    setShowAnnouncementModal,
  ] = useState(false);

  const [
    announcementForm,
    setAnnouncementForm,
  ] = useState(EMPTY_ANNOUNCEMENT);

  const [
    showPointsModal,
    setShowPointsModal,
  ] = useState(false);

  const [
    selectedMember,
    setSelectedMember,
  ] = useState(null);

  const [pointsAmount, setPointsAmount] =
    useState("");

  const [pointsReason, setPointsReason] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  function notify(text) {
    setMessage(text);

    window.clearTimeout(
      notify.timeout
    );

    notify.timeout = window.setTimeout(
      () => {
        setMessage("");
      },
      3500
    );
  }

  async function loadData(options = {}) {
    const refresh = Boolean(
      options.refresh
    );

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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
      turfResult,
      slotResult,
      bookingResult,
      userResult,
      announcementResult,
      couponResult,
      usageResult,
      rewardResult,
      checkpointResult,
      offerResult,
      transactionResult,
      redemptionResult,
    ] = results;

    if (!turfResult.error) {
      setTurfs(turfResult.data || []);
    }

    if (!slotResult.error) {
      setSlots(slotResult.data || []);
    }

    if (!bookingResult.error) {
      setBookings(
        bookingResult.data || []
      );
    }

    if (!userResult.error) {
      setUsers(userResult.data || []);
    }

    if (!announcementResult.error) {
      setAnnouncements(
        announcementResult.data || []
      );
    }

    if (!couponResult.error) {
      setCoupons(
        couponResult.data || []
      );
    } else {
      console.error(
        "Coupon error:",
        couponResult.error
      );
    }

    if (!usageResult.error) {
      setCouponUsages(
        usageResult.data || []
      );
    }

    if (!rewardResult.error) {
      setMemberRewards(
        rewardResult.data || []
      );
    }

    if (!checkpointResult.error) {
      setRewardCheckpoints(
        checkpointResult.data || []
      );
    }

    if (!offerResult.error) {
      setCommunityOffers(
        offerResult.data || []
      );
    }

    if (!transactionResult.error) {
      setRewardTransactions(
        transactionResult.data || []
      );
    }

    if (!redemptionResult.error) {
      setRewardRedemptions(
        redemptionResult.data || []
      );
    }

    setLoading(false);
    setRefreshing(false);
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
          table: "coupons",
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ============================================================
     TURFS
  ============================================================ */

  function openCreateTurf() {
    setEditingTurf(null);
    setTurfForm(EMPTY_TURF);
    setShowTurfModal(true);
  }

  function openEditTurf(turf) {
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

    setSaving(true);

    const payload = {
      name: turfForm.name.trim(),
      description:
        turfForm.description.trim() ||
        null,
      price_per_hour: Number(
        turfForm.price_per_hour
      ),
      image_url:
        turfForm.image_url.trim() ||
        null,
    };

    const result = editingTurf
      ? await supabase
          .from("turfs")
          .update(payload)
          .eq("id", editingTurf.id)
      : await supabase
          .from("turfs")
          .insert([
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
        `Delete ${turf.name}?`
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

  /* ============================================================
     SLOTS
  ============================================================ */

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

    setShowSlotModal(true);
  }

  function openEditSlot(slot) {
    setEditingSlot(slot);

    setSlotForm({
      turf_id: String(
        slot.turf_id || ""
      ),
      slot_date:
        slot.slot_date || "",
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
      notify(
        "Complete all time slot fields."
      );
      return;
    }

    if (
      slotForm.end_time <=
      slotForm.start_time
    ) {
      notify(
        "End time must be after start time."
      );
      return;
    }

    setSaving(true);

    const payload = {
      turf_id: Number(
        slotForm.turf_id
      ),
      slot_date:
        slotForm.slot_date,
      start_time:
        slotForm.start_time,
      end_time:
        slotForm.end_time,
      is_available:
        Boolean(slotForm.is_available),
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
        is_available:
          !slot.is_available,
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

  /* ============================================================
     BOOKINGS
  ============================================================ */

  async function updateBooking(
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

  /* ============================================================
     COUPONS
  ============================================================ */

  function openCreateCoupon() {
    setEditingCoupon(null);

    setCouponForm({
      ...EMPTY_COUPON,
      code: generateCouponCode(),
    });

    setShowCouponModal(true);
  }

  function openEditCoupon(coupon) {
    setEditingCoupon(coupon);

    setCouponForm({
      code: coupon.code || "",
      title: coupon.title || "",
      description:
        coupon.description || "",
      discount_type:
        coupon.discount_type ||
        "percentage",
      discount_value:
        coupon.discount_value ?? "",
      min_booking_amount:
        coupon.min_booking_amount ??
        "0",
      max_discount_amount:
        coupon.max_discount_amount ??
        "",
      usage_limit:
        coupon.usage_limit ?? "",
      per_user_limit:
        coupon.per_user_limit ??
        "1",
      starts_at: toDateTimeInput(
        coupon.starts_at
      ),
      expires_at: toDateTimeInput(
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

    const discount = Number(
      couponForm.discount_value
    );

    if (!code) {
      notify(
        "Coupon code is required."
      );
      return;
    }

    if (
      !Number.isFinite(discount) ||
      discount <= 0
    ) {
      notify(
        "Enter a valid discount."
      );
      return;
    }

    if (
      couponForm.discount_type ===
        "percentage" &&
      discount > 100
    ) {
      notify(
        "Percentage cannot exceed 100%."
      );
      return;
    }

    if (
      couponForm.starts_at &&
      couponForm.expires_at &&
      new Date(
        couponForm.expires_at
      ) <=
        new Date(
          couponForm.starts_at
        )
    ) {
      notify(
        "Expiry must be after start date."
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
        couponForm.title.trim() ||
        code,
      description:
        couponForm.description.trim() ||
        null,
      discount_type:
        couponForm.discount_type,
      discount_value: discount,
      min_booking_amount:
        Number(
          couponForm.min_booking_amount ||
            0
        ),
      max_discount_amount:
        couponForm.discount_type ===
          "percentage" &&
        couponForm.max_discount_amount
          ? Number(
              couponForm.max_discount_amount
            )
          : null,
      usage_limit:
        couponForm.usage_limit
          ? Number(
              couponForm.usage_limit
            )
          : null,
      per_user_limit:
        Number(
          couponForm.per_user_limit ||
            1
        ),
      starts_at:
        toISOStringOrNull(
          couponForm.starts_at
        ),
      expires_at:
        toISOStringOrNull(
          couponForm.expires_at
        ),
      is_active:
        Boolean(
          couponForm.is_active
        ),
    };

    const result = editingCoupon
      ? await supabase
          .from("coupons")
          .update(payload)
          .eq("id", editingCoupon.id)
      : await supabase
          .from("coupons")
          .insert([
            {
              ...payload,
              created_by:
                user?.id || null,
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

  async function toggleCoupon(
    coupon
  ) {
    const { error } = await supabase
      .from("coupons")
      .update({
        is_active:
          !coupon.is_active,
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

  async function deleteCoupon(
    coupon
  ) {
    if (
      !window.confirm(
        `Delete coupon ${coupon.code}?`
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
      await navigator.clipboard.writeText(
        code
      );

      notify(
        `${code} copied to clipboard.`
      );
    } catch {
      notify("Unable to copy coupon.");
    }
  }

  /* ============================================================
     ANNOUNCEMENTS
  ============================================================ */

  async function createAnnouncement(
    event
  ) {
    event.preventDefault();

    if (
      !announcementForm.title.trim()
    ) {
      notify(
        "Announcement title is required."
      );
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

    notify(
      "Announcement published."
    );

    await loadData();
  }

  async function toggleAnnouncement(
    announcement
  ) {
    const { error } = await supabase
      .from("announcements")
      .update({
        is_active:
          !announcement.is_active,
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

    notify(
      "Announcement deleted."
    );

    await loadData();
  }

  /* ============================================================
     REWARDS
  ============================================================ */

  function openPoints(member) {
    setSelectedMember(member);
    setPointsAmount("");
    setPointsReason("");
    setShowPointsModal(true);
  }

  async function adjustPoints(mode) {
    if (!selectedMember) return;

    const amount = Number(
      pointsAmount
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      notify(
        "Enter a valid points amount."
      );
      return;
    }

    setSaving(true);

    const current = Number(
      selectedMember.points || 0
    );

    const lifetime = Number(
      selectedMember.lifetime_points ||
        0
    );

    const delta =
      mode === "add"
        ? amount
        : -amount;

    const nextPoints = Math.max(
      0,
      current + delta
    );

    const nextLifetime =
      mode === "add"
        ? lifetime + amount
        : lifetime;

    const { error } =
      await supabase
        .from("member_rewards")
        .upsert(
          {
            user_id:
              selectedMember.user_id,
            points: nextPoints,
            lifetime_points:
              nextLifetime,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id",
          }
        );

    if (error) {
      setSaving(false);
      notify(error.message);
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
      notify(
        transactionError.message
      );
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

  /* ============================================================
     FILTERS
  ============================================================ */

  const filteredTurfs =
    useMemo(() => {
      const query = turfSearch
        .trim()
        .toLowerCase();

      if (!query) {
        return turfs;
      }

      return turfs.filter((turf) =>
        `${turf.name} ${
          turf.description || ""
        }`
          .toLowerCase()
          .includes(query)
      );
    }, [turfs, turfSearch]);

  const filteredSlots =
    useMemo(() => {
      const query = slotSearch
        .trim()
        .toLowerCase();

      return slots.filter((slot) => {
        const turfMatch =
          slotTurf === "all" ||
          String(slot.turf_id) ===
            String(slotTurf);

        const dateMatch =
          !slotDate ||
          slot.slot_date === slotDate;

        const searchMatch =
          !query ||
          slot.turfs?.name
            ?.toLowerCase()
            .includes(query);

        return (
          turfMatch &&
          dateMatch &&
          searchMatch
        );
      });
    }, [
      slots,
      slotSearch,
      slotDate,
      slotTurf,
    ]);

  const filteredBookings =
    useMemo(() => {
      const query =
        bookingSearch
          .trim()
          .toLowerCase();

      return bookings.filter(
        (booking) => {
          const statusMatch =
            bookingStatus === "all" ||
            booking.status ===
              bookingStatus;

          const searchable =
            `${booking.profiles?.full_name || ""} ${
              booking.profiles?.email || ""
            } ${
              booking.profiles?.phone || ""
            } ${
              booking.turfs?.name || ""
            }`.toLowerCase();

          return (
            statusMatch &&
            (!query ||
              searchable.includes(
                query
              ))
          );
        }
      );
    }, [
      bookings,
      bookingSearch,
      bookingStatus,
    ]);

  const filteredUsers =
    useMemo(() => {
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

  const filteredCoupons =
    useMemo(() => {
      const query = couponSearch
        .trim()
        .toLowerCase();

      if (!query) return coupons;

      return coupons.filter(
        (coupon) =>
          `${coupon.code || ""} ${
            coupon.title || ""
          } ${
            coupon.description || ""
          }`
            .toLowerCase()
            .includes(query)
      );
    }, [coupons, couponSearch]);

  /* ============================================================
     STATS
  ============================================================ */

  const activeTurfs = turfs.filter(
    (item) => item.is_active
  ).length;

  const activeCoupons =
    coupons.filter(
      (item) => item.is_active
    ).length;

  const pendingBookings =
    bookings.filter(
      (item) =>
        item.status === "pending"
    );

  const confirmedBookings =
    bookings.filter(
      (item) =>
        item.status === "confirmed"
    );

  const revenue =
    confirmedBookings.reduce(
      (sum, item) =>
        sum +
        Number(
          item.total_amount || 0
        ),
      0
    );

  const currentPoints =
    memberRewards.reduce(
      (sum, item) =>
        sum +
        Number(item.points || 0),
      0
    );

  if (loading) {
    return (
      <>
        <style>
          {`
            @keyframes sportivaLoading {
              from { transform: translateX(-120%); }
              to { transform: translateX(320%); }
            }

            @keyframes sportivaFloat {
              0%,100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
          `}
        </style>

        <div style={styles.loadingScreen}>
          <div
            style={{
              ...styles.brandMark,
              animation:
                "sportivaFloat 2s ease-in-out infinite",
            }}
          >
            S
          </div>

          <strong
            style={{
              color: COLORS.green,
              fontSize: 11,
              letterSpacing: "0.12em",
            }}
          >
            SPORTIVA ADMIN
          </strong>

          <span
            style={{
              color: COLORS.muted,
              fontSize: 10,
            }}
          >
            Loading control center...
          </span>

          <div style={styles.loadingBar}>
            <div
              style={{
                height: "100%",
                width: "45%",
                background:
                  "linear-gradient(90deg,#173d26,#a9dc63)",
                borderRadius: 99,
                animation:
                  "sportivaLoading 1.2s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </>
    );
  }

  const activeNav =
    NAV.find(
      (item) =>
        item.id === activeSection
    ) || NAV[0];

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          @keyframes sportivaAdminFade {
            from {
              opacity: 0;
              transform: translateY(7px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes sportivaModalIn {
            from {
              opacity: 0;
              transform: translateY(12px) scale(.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .sportiva-admin-nav-button:hover {
            background: rgba(255,255,255,.055) !important;
            color: #fff !important;
            transform: translateX(2px);
          }

          .sportiva-admin-stat:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 34px rgba(25,50,31,.07) !important;
          }

          .sportiva-admin-turf:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 34px rgba(25,50,31,.07) !important;
          }

          .sportiva-admin-table tr:hover td {
            background: #fbfdfb;
          }

          @media (max-width: 1200px) {
            .sportiva-admin-stat-grid {
              grid-template-columns: repeat(2, minmax(0,1fr)) !important;
            }

            .sportiva-admin-turf-grid {
              grid-template-columns: repeat(2, minmax(0,1fr)) !important;
            }
          }

          @media (max-width: 900px) {
            .sportiva-admin-sidebar {
              width: 72px !important;
              padding-left: 9px !important;
              padding-right: 9px !important;
            }

            .sportiva-admin-brand-copy,
            .sportiva-admin-nav-label,
            .sportiva-admin-sidebar-bottom,
            .sportiva-admin-nav-button span {
              display: none !important;
            }

            .sportiva-admin-nav-button {
              justify-content: center !important;
              padding: 0 !important;
            }

            .sportiva-admin-nav-button b {
              position: absolute !important;
              top: 2px !important;
              right: 2px !important;
            }

            .sportiva-admin-main {
              width: calc(100% - 72px) !important;
              margin-left: 72px !important;
            }

            .sportiva-admin-panel-grid {
              grid-template-columns: 1fr !important;
            }

            .sportiva-admin-turf-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 650px) {
            .sportiva-admin-main {
              padding: 18px 12px 35px !important;
            }

            .sportiva-admin-header {
              align-items: flex-start !important;
            }

            .sportiva-admin-header-title {
              font-size: 24px !important;
            }

            .sportiva-admin-hero {
              padding: 23px 20px !important;
              flex-direction: column !important;
            }

            .sportiva-admin-stat-grid {
              grid-template-columns: 1fr !important;
            }

            .sportiva-admin-turf-grid {
              grid-template-columns: 1fr !important;
            }

            .sportiva-admin-toolbar {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .sportiva-admin-toolbar > * {
              width: 100% !important;
              max-width: none !important;
            }

            .sportiva-admin-form-grid {
              grid-template-columns: 1fr !important;
            }

            .sportiva-admin-form-grid .full {
              grid-column: auto !important;
            }

            .sportiva-admin-modal-actions {
              flex-direction: column-reverse !important;
            }

            .sportiva-admin-modal-actions button {
              width: 100% !important;
            }
          }

          @media (max-width: 450px) {
            .sportiva-admin-sidebar {
              width: 62px !important;
            }

            .sportiva-admin-main {
              width: calc(100% - 62px) !important;
              margin-left: 62px !important;
            }
          }
        `}
      </style>

      <div style={styles.page}>

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside
          className="sportiva-admin-sidebar"
          style={styles.sidebar}
        >

          <div style={styles.brand}>

            <div style={styles.brandMark}>
              S
            </div>

            <div
              className="sportiva-admin-brand-copy"
              style={styles.brandCopy}
            >
              <strong style={styles.brandTitle}>
                SPORTIVA
              </strong>

              <span
                style={
                  styles.brandSubtitle
                }
              >
                ADMIN CONTROL
              </span>
            </div>

          </div>

          <div
            className="sportiva-admin-nav-label"
            style={styles.navLabel}
          >
            MANAGEMENT
          </div>

          <nav style={styles.nav}>

            {NAV.map((item) => {
              const Icon = item.icon;

              const active =
                activeSection ===
                item.id;

              const badge =
                item.id ===
                "bookings"
                  ? pendingBookings.length
                  : item.id ===
                    "coupons"
                  ? activeCoupons
                  : 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  className="sportiva-admin-nav-button"
                  onClick={() =>
                    setActiveSection(
                      item.id
                    )
                  }
                  style={{
                    ...styles.navButton,
                    ...(active
                      ? styles.navActive
                      : {}),
                  }}
                >
                  <Icon size={17} />

                  <span>
                    {item.label}
                  </span>

                  {badge > 0 && (
                    <b
                      style={
                        styles.navBadge
                      }
                    >
                      {badge}
                    </b>
                  )}
                </button>
              );
            })}

          </nav>

          <div
            className="sportiva-admin-sidebar-bottom"
            style={
              styles.sidebarBottom
            }
          >
            <div style={styles.secure}>
              <ShieldCheck size={15} />

              <div
                style={styles.secureText}
              >
                <strong
                  style={
                    styles.secureTitle
                  }
                >
                  SECURE ACCESS
                </strong>

                <span
                  style={
                    styles.secureSubtitle
                  }
                >
                  Sportiva Admin
                </span>
              </div>
            </div>
          </div>

        </aside>

        {/* =====================================================
            MAIN
        ===================================================== */}

        <main
          className="sportiva-admin-main"
          style={styles.main}
        >

          <header
            className="sportiva-admin-header"
            style={styles.header}
          >
            <div>

              <span
                style={
                  styles.headerEyebrow
                }
              >
                THE SPORTIVA
              </span>

              <h1
                className="sportiva-admin-header-title"
                style={styles.headerTitle}
              >
                {activeNav.label}
              </h1>

            </div>

            <button
              type="button"
              onClick={() =>
                loadData({
                  refresh: true,
                })
              }
              disabled={refreshing}
              style={{
                ...styles.refreshButton,
                opacity: refreshing
                  ? 0.6
                  : 1,
              }}
            >
              <RefreshCw
                size={15}
                style={
                  refreshing
                    ? {
                        animation:
                          "sportivaSpin .8s linear infinite",
                      }
                    : undefined
                }
              />

              Refresh
            </button>

          </header>

          {message && (
            <div style={styles.toast}>
              <Check size={15} />

              <span
                style={{
                  flex: 1,
                }}
              >
                {message}
              </span>

              <button
                type="button"
                onClick={() =>
                  setMessage("")
                }
                style={{
                  border: 0,
                  background:
                    "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ===================================================
              OVERVIEW
          =================================================== */}

          {activeSection ===
            "overview" && (
            <section
              className="sportiva-admin-content"
              style={styles.content}
            >

              <div
                className="sportiva-admin-hero"
                style={styles.hero}
              >
                <div>
                  <span
                    style={
                      styles.heroEyebrow
                    }
                  >
                    FACILITY OPERATIONS
                  </span>

                  <h2
                    style={
                      styles.heroTitle
                    }
                  >
                    Control the
                    <br />
                    entire Sportiva.
                  </h2>

                  <p
                    style={styles.heroText}
                  >
                    Manage facilities,
                    bookings, customers,
                    rewards and
                    promotions from
                    one clean control
                    center.
                  </p>
                </div>

                <div
                  style={
                    styles.livePill
                  }
                >
                  <span
                    style={
                      styles.liveDot
                    }
                  />

                  LIVE SYSTEM
                </div>
              </div>

              <div
                className="sportiva-admin-stat-grid"
                style={styles.statGrid}
              >

                <StatCard
                  icon={Trophy}
                  label="Active Turfs"
                  value={activeTurfs}
                  detail={`${turfs.length} total facilities`}
                />

                <StatCard
                  icon={ClipboardList}
                  label="Bookings"
                  value={
                    bookings.length
                  }
                  detail={`${pendingBookings.length} pending`}
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
                  value={
                    users.length
                  }
                  detail="Registered customers"
                />

              </div>

              <div
                className="sportiva-admin-panel-grid"
                style={styles.panelGrid}
              >

                <div style={styles.panel}>

                  <div
                    style={
                      styles.panelHeader
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.panelHeaderEyebrow
                        }
                      >
                        BOOKING STATUS
                      </span>

                      <h3
                        style={
                          styles.panelHeaderTitle
                        }
                      >
                        Reservation overview
                      </h3>
                    </div>

                    <ClipboardList
                      size={18}
                      color="#6d8974"
                    />
                  </div>

                  <div
                    style={
                      styles.simpleStats
                    }
                  >

                    <div
                      style={
                        styles.simpleStat
                      }
                    >
                      <span
                        style={
                          styles.simpleStatLabel
                        }
                      >
                        Pending
                      </span>

                      <strong
                        style={
                          styles.simpleStatValue
                        }
                      >
                        {
                          pendingBookings.length
                        }
                      </strong>
                    </div>

                    <div
                      style={
                        styles.simpleStat
                      }
                    >
                      <span
                        style={
                          styles.simpleStatLabel
                        }
                      >
                        Confirmed
                      </span>

                      <strong
                        style={
                          styles.simpleStatValue
                        }
                      >
                        {
                          confirmedBookings.length
                        }
                      </strong>
                    </div>

                    <div
                      style={
                        styles.simpleStat
                      }
                    >
                      <span
                        style={
                          styles.simpleStatLabel
                        }
                      >
                        Cancelled
                      </span>

                      <strong
                        style={
                          styles.simpleStatValue
                        }
                      >
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

                <div style={styles.panel}>

                  <div
                    style={
                      styles.panelHeader
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.panelHeaderEyebrow
                        }
                      >
                        PROMOTIONS
                      </span>

                      <h3
                        style={
                          styles.panelHeaderTitle
                        }
                      >
                        Coupon system
                      </h3>
                    </div>

                    <TicketPercent
                      size={18}
                      color="#6d8974"
                    />
                  </div>

                  <div
                    style={{
                      paddingTop: 17,
                    }}
                  >
                    <strong
                      style={{
                        display:
                          "block",
                        fontSize: 32,
                        letterSpacing:
                          "-0.04em",
                      }}
                    >
                      {activeCoupons}
                    </strong>

                    <span
                      style={{
                        display:
                          "block",
                        marginTop: 4,
                        color:
                          COLORS.muted,
                        fontSize: 10,
                      }}
                    >
                      active promotional
                      codes
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveSection(
                          "coupons"
                        )
                      }
                      style={{
                        marginTop: 13,
                        padding: 0,
                        display:
                          "inline-flex",
                        alignItems:
                          "center",
                        border: 0,
                        background:
                          "transparent",
                        color:
                          COLORS.green2,
                        fontSize: 10,
                        fontWeight: 800,
                        cursor:
                          "pointer",
                      }}
                    >
                      Manage coupons
                    </button>
                  </div>

                </div>

              </div>

              <div
                style={
                  styles.recentPanel
                }
              >

                <div
                  style={
                    styles.panelHeader
                  }
                >
                  <div>
                    <span
                      style={
                        styles.panelHeaderEyebrow
                      }
                    >
                      RECENT ACTIVITY
                    </span>

                    <h3
                      style={
                        styles.panelHeaderTitle
                      }
                    >
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
                    style={{
                      border: 0,
                      background:
                        "transparent",
                      color:
                        COLORS.green2,
                      fontSize: 9,
                      fontWeight: 800,
                      cursor:
                        "pointer",
                    }}
                  >
                    View all
                  </button>
                </div>

                {bookings
                  .slice(0, 6)
                  .map((booking) => (
                    <div
                      key={booking.id}
                      style={
                        styles.recentRow
                      }
                    >

                      <div
                        style={
                          styles.person
                        }
                      >
                        <div
                          style={
                            styles.avatar
                          }
                        >
                          {booking
                            .profiles
                            ?.full_name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "U"}
                        </div>

                        <span
                          style={
                            styles.personName
                          }
                        >
                          {booking
                            .profiles
                            ?.full_name ||
                            "Unknown User"}
                        </span>
                      </div>

                      <span
                        style={{
                          color:
                            "#707a73",
                          fontSize: 10,
                        }}
                      >
                        {booking
                          .turfs?.name ||
                          "Turf"}
                      </span>

                      <strong
                        style={{
                          fontSize: 10,
                        }}
                      >
                        ৳
                        {Number(
                          booking.total_amount ||
                            0
                        ).toLocaleString()}
                      </strong>

                      <Status
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
                      </Status>

                    </div>
                  ))}

                {bookings.length ===
                  0 && (
                  <div
                    style={{
                      padding: 28,
                      textAlign:
                        "center",
                      color:
                        COLORS.muted,
                      fontSize: 10,
                    }}
                  >
                    No bookings yet.
                  </div>
                )}

              </div>

            </section>
          )}

          {/* ===================================================
              TURFS
          =================================================== */}

          {activeSection ===
            "turfs" && (
            <section
              className="sportiva-admin-content"
              style={styles.content}
            >

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "flex-end",
                  justifyContent:
                    "space-between",
                  gap: 20,
                  marginBottom: 19,
                }}
              >
                <div>
                  <span
                    style={
                      styles.headerEyebrow
                    }
                  >
                    FACILITY MANAGEMENT
                  </span>

                  <h2
                    style={{
                      margin: "5px 0 0",
                      fontSize: 26,
                      letterSpacing:
                        "-0.04em",
                    }}
                  >
                    Turfs
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    openCreateTurf
                  }
                  style={
                    styles.refreshButton
                  }
                >
                  <Plus size={15} />
                  Add Turf
                </button>
              </div>

              <div
                className="sportiva-admin-toolbar"
                style={
                  styles.toolbar
                }
              >
                <div
                  style={styles.search}
                >
                  <Search size={15} />

                  <input
                    value={turfSearch}
                    onChange={(e) =>
                      setTurfSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search turfs..."
                    style={
                      styles.searchInput
                    }
                  />
                </div>

                <span
                  style={{
                    marginLeft:
                      "auto",
                    color:
                      COLORS.muted,
                    fontSize: 9,
                  }}
                >
                  {
                    filteredTurfs.length
                  }{" "}
                  facilities
                </span>
              </div>

              <div
                className="sportiva-admin-turf-grid"
                style={styles.turfGrid}
              >

                {filteredTurfs.map(
                  (turf) => (
                    <article
                      className="sportiva-admin-turf"
                      key={turf.id}
                      style={{
                        ...styles.turfCard,
                        transition:
                          "transform .2s ease, box-shadow .2s ease",
                      }}
                    >

                      <div
                        style={
                          styles.turfImage
                        }
                      >

                        {turf.image_url ? (
                          <img
                            src={
                              turf.image_url
                            }
                            alt={
                              turf.name
                            }
                            style={
                              styles.turfImg
                            }
                          />
                        ) : (
                          <div
                            style={{
                              height:
                                "100%",
                              display:
                                "grid",
                              placeItems:
                                "center",
                              color:
                                "#6d8f76",
                            }}
                          >
                            <Trophy
                              size={28}
                            />
                          </div>
                        )}

                        <span
                          style={{
                            position:
                              "absolute",
                            top: 11,
                            right: 11,
                            padding:
                              "6px 8px",
                            borderRadius:
                              99,
                            background:
                              turf.is_active
                                ? "rgba(28,88,45,.84)"
                                : "rgba(28,38,31,.65)",
                            color:
                              "#fff",
                            fontSize: 7,
                            fontWeight:
                              900,
                          }}
                        >
                          {turf.is_active
                            ? "ACTIVE"
                            : "DISABLED"}
                        </span>

                      </div>

                      <div
                        style={
                          styles.turfBody
                        }
                      >
                        <span
                          style={
                            styles.turfEyebrow
                          }
                        >
                          SPORTIVA
                          FACILITY
                        </span>

                        <h3
                          style={
                            styles.turfTitle
                          }
                        >
                          {turf.name}
                        </h3>

                        <p
                          style={
                            styles.turfDescription
                          }
                        >
                          {turf.description ||
                            "No description provided."}
                        </p>

                        <div
                          style={
                            styles.turfPrice
                          }
                        >
                          <strong
                            style={
                              styles.turfPriceValue
                            }
                          >
                            ৳
                            {Number(
                              turf.price_per_hour
                            ).toLocaleString()}
                          </strong>

                          <span
                            style={
                              styles.turfPriceUnit
                            }
                          >
                            / hour
                          </span>
                        </div>

                        <div
                          style={
                            styles.inlineButtons
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openEditTurf(
                                turf
                              )
                            }
                            style={
                              styles.inlineButton
                            }
                          >
                            <Edit3
                              size={13}
                            />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleTurf(
                                turf
                              )
                            }
                            style={
                              styles.inlineButton
                            }
                          >
                            {turf.is_active ? (
                              <X
                                size={13}
                              />
                            ) : (
                              <Check
                                size={13}
                              />
                            )}

                            {turf.is_active
                              ? "Disable"
                              : "Enable"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteTurf(
                                turf
                              )
                            }
                            style={{
                              ...styles.inlineButton,
                              flex:
                                "0 0 37px",
                              color:
                                COLORS.danger,
                            }}
                          >
                            <Trash2
                              size={13}
                            />
                          </button>
                        </div>
                      </div>

                    </article>
                  )
                )}

              </div>

              {filteredTurfs.length ===
                0 && (
                <div
                  style={styles.empty}
                >
                  <Trophy size={27} />

                  <strong
                    style={
                      styles.emptyTitle
                    }
                  >
                    No turfs found.
                  </strong>

                  <span
                    style={
                      styles.emptyText
                    }
                  >
                    Add your first
                    facility.
                  </span>
                </div>
              )}

            </section>
          )}

          {/* ===================================================
              SLOTS
          =================================================== */}

          {activeSection ===
            "slots" && (
            <section
              style={styles.content}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-end",
                  gap: 20,
                  marginBottom: 18,
                }}
              >
                <div>
                  <span
                    style={
                      styles.headerEyebrow
                    }
                  >
                    AVAILABILITY
                    MANAGEMENT
                  </span>

                  <h2
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize: 26,
                    }}
                  >
                    Time Slots
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    openCreateSlot
                  }
                  style={
                    styles.refreshButton
                  }
                >
                  <Plus size={15} />
                  Add Slot
                </button>
              </div>

              <div
                className="sportiva-admin-toolbar"
                style={
                  styles.toolbar
                }
              >
                <div
                  style={styles.search}
                >
                  <Search size={15} />

                  <input
                    value={slotSearch}
                    onChange={(e) =>
                      setSlotSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search turf..."
                    style={
                      styles.searchInput
                    }
                  />
                </div>

                <select
                  value={slotTurf}
                  onChange={(e) =>
                    setSlotTurf(
                      e.target.value
                    )
                  }
                  style={
                    styles.filter
                  }
                >
                  <option value="all">
                    All Turfs
                  </option>

                  {turfs.map(
                    (turf) => (
                      <option
                        key={turf.id}
                        value={turf.id}
                      >
                        {turf.name}
                      </option>
                    )
                  )}
                </select>

                <input
                  type="date"
                  value={slotDate}
                  onChange={(e) =>
                    setSlotDate(
                      e.target.value
                    )
                  }
                  style={
                    styles.filter
                  }
                />

                <button
                  type="button"
                  onClick={() => {
                    setSlotSearch("");
                    setSlotTurf("all");
                    setSlotDate("");
                  }}
                  style={
                    styles.refreshButton
                  }
                >
                  Clear
                </button>
              </div>

              <div
                style={
                  styles.tableCard
                }
              >
                <div
                  style={
                    styles.tableWrap
                  }
                >
                  <table
                    className="sportiva-admin-table"
                    style={
                      styles.table
                    }
                  >
                    <thead>
                      <tr>
                        <th
                          style={
                            styles.th
                          }
                        >
                          Turf
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Date
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Time
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Status
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
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
                            <td
                              style={
                                styles.td
                              }
                            >
                              <strong>
                                {slot
                                  .turfs
                                  ?.name ||
                                  "Unknown Turf"}
                              </strong>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {formatDate(
                                slot.slot_date
                              )}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: 6,
                                }}
                              >
                                <Clock3
                                  size={13}
                                />

                                {formatTime(
                                  slot.start_time
                                )}

                                —

                                {formatTime(
                                  slot.end_time
                                )}
                              </div>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <Status
                                type={
                                  slot.is_available
                                    ? "success"
                                    : "neutral"
                                }
                              >
                                {slot.is_available
                                  ? "Available"
                                  : "Disabled"}
                              </Status>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <div
                                style={
                                  styles.actions
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditSlot(
                                      slot
                                    )
                                  }
                                  style={
                                    styles.iconButton
                                  }
                                >
                                  <Edit3
                                    size={
                                      13
                                    }
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleSlot(
                                      slot
                                    )
                                  }
                                  style={
                                    styles.iconButton
                                  }
                                >
                                  {slot.is_available ? (
                                    <X
                                      size={
                                        13
                                      }
                                    />
                                  ) : (
                                    <Check
                                      size={
                                        13
                                      }
                                    />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteSlot(
                                      slot
                                    )
                                  }
                                  style={{
                                    ...styles.iconButton,
                                    color:
                                      COLORS.danger,
                                  }}
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

                {filteredSlots.length ===
                  0 && (
                  <div
                    style={
                      styles.empty
                    }
                  >
                    No matching time
                    slots.
                  </div>
                )}
              </div>

            </section>
          )}

          {/* ===================================================
              BOOKINGS
          =================================================== */}

          {activeSection ===
            "bookings" && (
            <section
              style={styles.content}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-end",
                  gap: 20,
                  marginBottom: 18,
                }}
              >
                <div>
                  <span
                    style={
                      styles.headerEyebrow
                    }
                  >
                    RESERVATION
                    MANAGEMENT
                  </span>

                  <h2
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize: 26,
                    }}
                  >
                    Bookings
                  </h2>
                </div>

                <span
                  style={{
                    color:
                      COLORS.muted,
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                >
                  {bookings.length} TOTAL
                </span>
              </div>

              <div
                className="sportiva-admin-toolbar"
                style={
                  styles.toolbar
                }
              >
                <div
                  style={styles.search}
                >
                  <Search size={15} />

                  <input
                    value={
                      bookingSearch
                    }
                    onChange={(e) =>
                      setBookingSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search customer or turf..."
                    style={
                      styles.searchInput
                    }
                  />
                </div>

                <select
                  value={
                    bookingStatus
                  }
                  onChange={(e) =>
                    setBookingStatus(
                      e.target.value
                    )
                  }
                  style={
                    styles.filter
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

              <div
                style={
                  styles.tableCard
                }
              >
                <div
                  style={
                    styles.tableWrap
                  }
                >
                  <table
                    style={
                      styles.table
                    }
                  >
                    <thead>
                      <tr>
                        <th
                          style={
                            styles.th
                          }
                        >
                          Customer
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Turf
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Schedule
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Amount
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Status
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBookings.map(
                        (booking) => (
                          <tr
                            key={
                              booking.id
                            }
                          >
                            <td
                              style={
                                styles.td
                              }
                            >
                              <div
                                style={
                                  styles.person
                                }
                              >
                                <div
                                  style={
                                    styles.avatar
                                  }
                                >
                                  {booking
                                    .profiles
                                    ?.full_name
                                    ?.charAt(
                                      0
                                    )
                                    ?.toUpperCase() ||
                                    "U"}
                                </div>

                                <div
                                  style={{
                                    minWidth:
                                      0,
                                  }}
                                >
                                  <strong
                                    style={{
                                      display:
                                        "block",
                                      color:
                                        COLORS.text,
                                      fontSize: 10,
                                    }}
                                  >
                                    {booking
                                      .profiles
                                      ?.full_name ||
                                      "Unknown User"}
                                  </strong>

                                  <small
                                    style={{
                                      display:
                                        "block",
                                      marginTop:
                                        3,
                                      color:
                                        "#8a938c",
                                      fontSize: 8,
                                    }}
                                  >
                                    {booking
                                      .profiles
                                      ?.email ||
                                      booking
                                        .profiles
                                        ?.phone ||
                                      "No contact"}
                                  </small>
                                </div>
                              </div>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {booking
                                .turfs
                                ?.name ||
                                "Unknown Turf"}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <strong
                                style={{
                                  display:
                                    "block",
                                  fontSize: 10,
                                }}
                              >
                                {formatDate(
                                  booking.booking_date
                                )}
                              </strong>

                              <small
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    3,
                                  color:
                                    "#89928b",
                                  fontSize: 9,
                                }}
                              >
                                {formatTime(
                                  booking.start_time
                                )}{" "}
                                —{" "}
                                {formatTime(
                                  booking.end_time
                                )}
                              </small>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <strong>
                                ৳
                                {Number(
                                  booking.total_amount ||
                                    0
                                ).toLocaleString()}
                              </strong>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <Status
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
                              </Status>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {booking.status ===
                                "pending" && (
                                <div
                                  style={
                                    styles.actions
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateBooking(
                                        booking,
                                        "confirmed"
                                      )
                                    }
                                    style={{
                                      ...styles.iconButton,
                                      color:
                                        COLORS.success,
                                    }}
                                  >
                                    <Check
                                      size={
                                        13
                                      }
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateBooking(
                                        booking,
                                        "cancelled"
                                      )
                                    }
                                    style={{
                                      ...styles.iconButton,
                                      color:
                                        COLORS.danger,
                                    }}
                                  >
                                    <X
                                      size={
                                        13
                                      }
                                    />
                                  </button>
                                </div>
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
                  <div
                    style={
                      styles.empty
                    }
                  >
                    No bookings found.
                  </div>
                )}
              </div>

            </section>
          )}

          {/* ===================================================
              USERS
          =================================================== */}

          {activeSection ===
            "users" && (
            <section
              style={styles.content}
            >

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "flex-end",
                  justifyContent:
                    "space-between",
                  marginBottom: 18,
                }}
              >
                <div>
                  <span
                    style={
                      styles.headerEyebrow
                    }
                  >
                    CUSTOMER MANAGEMENT
                  </span>

                  <h2
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize: 26,
                    }}
                  >
                    Users
                  </h2>
                </div>

                <span
                  style={{
                    color:
                      COLORS.muted,
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                >
                  {users.length} MEMBERS
                </span>
              </div>

              <div
                style={
                  styles.toolbar
                }
              >
                <div
                  style={styles.search}
                >
                  <Search size={15} />

                  <input
                    value={userSearch}
                    onChange={(e) =>
                      setUserSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search name, email or phone..."
                    style={
                      styles.searchInput
                    }
                  />
                </div>
              </div>

              <div
                style={
                  styles.tableCard
                }
              >
                <div
                  style={
                    styles.tableWrap
                  }
                >
                  <table
                    style={
                      styles.table
                    }
                  >
                    <thead>
                      <tr>
                        <th
                          style={
                            styles.th
                          }
                        >
                          Member
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Phone
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Email
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Joined
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map(
                        (user) => (
                          <tr
                            key={
                              user.id
                            }
                          >
                            <td
                              style={
                                styles.td
                              }
                            >
                              <div
                                style={
                                  styles.person
                                }
                              >
                                <div
                                  style={
                                    styles.avatar
                                  }
                                >
                                  {user
                                    .full_name
                                    ?.charAt(
                                      0
                                    )
                                    ?.toUpperCase() ||
                                    "U"}
                                </div>

                                <div>
                                  <strong
                                    style={{
                                      fontSize:
                                        10,
                                    }}
                                  >
                                    {user.full_name ||
                                      "Unnamed Member"}
                                  </strong>

                                  <small
                                    style={{
                                      display:
                                        "block",
                                      marginTop:
                                        3,
                                      color:
                                        "#8c958e",
                                      fontSize: 8,
                                    }}
                                  >
                                    ID:{" "}
                                    {user.id.slice(
                                      0,
                                      8
                                    )}
                                  </small>
                                </div>
                              </div>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {user.phone ||
                                "—"}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {user.email ||
                                "—"}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
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

          {/* ===================================================
              REWARDS
          =================================================== */}

          {activeSection ===
            "rewards" && (
            <section
              style={styles.content}
            >

              <div
                style={{
                  marginBottom: 18,
                }}
              >
                <span
                  style={
                    styles.headerEyebrow
                  }
                >
                  CUSTOMER LOYALTY
                </span>

                <h2
                  style={{
                    margin:
                      "5px 0 0",
                    fontSize: 26,
                  }}
                >
                  Sportiva Rewards
                </h2>
              </div>

              <div
                className="sportiva-admin-stat-grid"
                style={
                  styles.statGrid
                }
              >
                <StatCard
                  icon={Users}
                  label="Reward Members"
                  value={
                    memberRewards.length
                  }
                  detail="Reward accounts"
                />

                <StatCard
                  icon={Gift}
                  label="Current Points"
                  value={currentPoints.toLocaleString()}
                  detail="Spendable balance"
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
                  label="Active Offers"
                  value={
                    communityOffers.filter(
                      (item) =>
                        item.is_active
                    ).length
                  }
                  detail="Redeemable rewards"
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 4,
                  marginBottom: 15,
                  overflowX:
                    "auto",
                  padding: 4,
                  width: "fit-content",
                  maxWidth:
                    "100%",
                  border:
                    "1px solid #e1e8e2",
                  borderRadius: 10,
                  background:
                    "#fff",
                }}
              >
                {[
                  ["members", "Members"],
                  [
                    "milestones",
                    "Milestones",
                  ],
                  ["offers", "Offers"],
                  ["history", "History"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setRewardTab(
                        id
                      )
                    }
                    style={{
                      minHeight: 32,
                      padding:
                        "0 12px",
                      border: 0,
                      borderRadius: 7,
                      background:
                        rewardTab ===
                        id
                          ? "#edf5ee"
                          : "transparent",
                      color:
                        rewardTab ===
                        id
                          ? "#315f3c"
                          : "#78837b",
                      fontSize: 9,
                      fontWeight: 750,
                      cursor:
                        "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {rewardTab ===
                "members" && (
                <div
                  style={
                    styles.tableCard
                  }
                >
                  <div
                    style={
                      styles.tableWrap
                    }
                  >
                    <table
                      style={
                        styles.table
                      }
                    >
                      <thead>
                        <tr>
                          <th
                            style={
                              styles.th
                            }
                          >
                            Member
                          </th>

                          <th
                            style={
                              styles.th
                            }
                          >
                            Points
                          </th>

                          <th
                            style={
                              styles.th
                            }
                          >
                            Lifetime
                          </th>

                          <th
                            style={
                              styles.th
                            }
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {memberRewards.map(
                          (member) => {
                            const user =
                              users.find(
                                (
                                  item
                                ) =>
                                  item.id ===
                                  member.user_id
                              );

                            return (
                              <tr
                                key={
                                  member.user_id
                                }
                              >
                                <td
                                  style={
                                    styles.td
                                  }
                                >
                                  <div
                                    style={
                                      styles.person
                                    }
                                  >
                                    <div
                                      style={
                                        styles.avatar
                                      }
                                    >
                                      {user
                                        ?.full_name
                                        ?.charAt(
                                          0
                                        )
                                        ?.toUpperCase() ||
                                        "U"}
                                    </div>

                                    <div>
                                      <strong
                                        style={{
                                          fontSize:
                                            10,
                                        }}
                                      >
                                        {user?.full_name ||
                                          "Unknown Member"}
                                      </strong>

                                      <small
                                        style={{
                                          display:
                                            "block",
                                          marginTop:
                                            3,
                                          color:
                                            "#8c958e",
                                          fontSize:
                                            8,
                                        }}
                                      >
                                        {user?.email ||
                                          member.user_id.slice(
                                            0,
                                            8
                                          )}
                                      </small>
                                    </div>
                                  </div>
                                </td>

                                <td
                                  style={
                                    styles.td
                                  }
                                >
                                  <strong>
                                    {Number(
                                      member.points ||
                                        0
                                    ).toLocaleString()}
                                  </strong>
                                </td>

                                <td
                                  style={
                                    styles.td
                                  }
                                >
                                  {Number(
                                    member.lifetime_points ||
                                      0
                                  ).toLocaleString()}
                                </td>

                                <td
                                  style={
                                    styles.td
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPoints(
                                        member
                                      )
                                    }
                                    style={{
                                      ...styles.refreshButton,
                                      minHeight: 32,
                                    }}
                                  >
                                    <Edit3
                                      size={
                                        13
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
                </div>
              )}

              {rewardTab ===
                "milestones" && (
                <div
                  className="sportiva-admin-turf-grid"
                  style={
                    styles.turfGrid
                  }
                >
                  {rewardCheckpoints.map(
                    (item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: 19,
                          border:
                            "1px solid #e1e8e2",
                          borderRadius: 15,
                          background:
                            "#fff",
                          boxShadow:
                            "0 10px 30px rgba(30,55,35,.035)",
                        }}
                      >
                        <span
                          style={{
                            color:
                              "#718979",
                            fontSize: 7,
                            fontWeight:
                              900,
                            letterSpacing:
                              ".12em",
                          }}
                        >
                          {
                            item.points_required
                          }{" "}
                          POINTS
                        </span>

                        <h3
                          style={{
                            margin:
                              "8px 0 6px",
                            fontSize: 16,
                          }}
                        >
                          {item.title}
                        </h3>

                        <p
                          style={{
                            minHeight: 35,
                            margin: 0,
                            color:
                              COLORS.muted,
                            fontSize: 10,
                            lineHeight:
                              1.5,
                          }}
                        >
                          {item.description ||
                            "No description."}
                        </p>

                        <div
                          style={{
                            marginTop: 12,
                          }}
                        >
                          <Status
                            type={
                              item.is_active
                                ? "success"
                                : "neutral"
                            }
                          >
                            {item.is_active
                              ? "Active"
                              : "Disabled"}
                          </Status>
                        </div>
                      </div>
                    )
                  )}

                  {rewardCheckpoints.length ===
                    0 && (
                    <div
                      style={
                        styles.empty
                      }
                    >
                      No milestones
                      configured.
                    </div>
                  )}
                </div>
              )}

              {rewardTab ===
                "offers" && (
                <div
                  className="sportiva-admin-turf-grid"
                  style={
                    styles.turfGrid
                  }
                >
                  {communityOffers.map(
                    (offer) => (
                      <div
                        key={offer.id}
                        style={{
                          padding: 19,
                          border:
                            "1px solid #e1e8e2",
                          borderRadius: 15,
                          background:
                            "#fff",
                          boxShadow:
                            "0 10px 30px rgba(30,55,35,.035)",
                        }}
                      >
                        <span
                          style={{
                            color:
                              "#718979",
                            fontSize: 7,
                            fontWeight:
                              900,
                            letterSpacing:
                              ".12em",
                          }}
                        >
                          {
                            offer.required_points
                          }{" "}
                          POINTS
                        </span>

                        <h3
                          style={{
                            margin:
                              "8px 0 6px",
                            fontSize: 16,
                          }}
                        >
                          {offer.title}
                        </h3>

                        <p
                          style={{
                            minHeight: 35,
                            margin: 0,
                            color:
                              COLORS.muted,
                            fontSize: 10,
                            lineHeight:
                              1.5,
                          }}
                        >
                          {offer.benefit ||
                            offer.description ||
                            "Reward benefit"}
                        </p>

                        {Number(
                          offer.discount_value ||
                            0
                        ) > 0 && (
                          <small
                            style={{
                              display:
                                "block",
                              marginTop:
                                10,
                              color:
                                "#3c7048",
                              fontSize: 9,
                              fontWeight:
                                800,
                            }}
                          >
                            {offer.discount_type ===
                            "percentage"
                              ? `${offer.discount_value}% discount`
                              : `৳${Number(
                                  offer.discount_value
                                ).toLocaleString()} discount`}
                          </small>
                        )}

                        <div
                          style={{
                            marginTop: 12,
                          }}
                        >
                          <Status
                            type={
                              offer.is_active
                                ? "success"
                                : "neutral"
                            }
                          >
                            {offer.is_active
                              ? "Active"
                              : "Disabled"}
                          </Status>
                        </div>
                      </div>
                    )
                  )}

                  {communityOffers.length ===
                    0 && (
                    <div
                      style={
                        styles.empty
                      }
                    >
                      No reward offers
                      configured.
                    </div>
                  )}
                </div>
              )}

              {rewardTab ===
                "history" && (
                <div
                  className="sportiva-admin-panel-grid"
                  style={
                    styles.panelGrid
                  }
                >

                  <div
                    style={styles.panel}
                  >
                    <div
                      style={
                        styles.panelHeader
                      }
                    >
                      <div>
                        <span
                          style={
                            styles.panelHeaderEyebrow
                          }
                        >
                          POINT ACTIVITY
                        </span>

                        <h3
                          style={
                            styles.panelHeaderTitle
                          }
                        >
                          Transactions
                        </h3>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                      }}
                    >
                      {rewardTransactions
                        .slice(0, 20)
                        .map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              style={{
                                minHeight:
                                  54,
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "space-between",
                                borderBottom:
                                  "1px solid #edf1ed",
                              }}
                            >
                              <div>
                                <strong
                                  style={{
                                    display:
                                      "block",
                                    fontSize:
                                      9,
                                    color:
                                      "#334138",
                                  }}
                                >
                                  {item.type ||
                                    "Transaction"}
                                </strong>

                                <small
                                  style={{
                                    display:
                                      "block",
                                    marginTop:
                                      3,
                                    color:
                                      "#8c958e",
                                    fontSize:
                                      8,
                                  }}
                                >
                                  {item.description ||
                                    "Reward activity"}
                                </small>
                              </div>

                              <strong
                                style={{
                                  color:
                                    Number(
                                      item.points
                                    ) >=
                                    0
                                      ? COLORS.success
                                      : COLORS.danger,
                                  fontSize:
                                    12,
                                }}
                              >
                                {Number(
                                  item.points
                                ) >=
                                0
                                  ? "+"
                                  : ""}
                                {
                                  item.points
                                }
                              </strong>
                            </div>
                          )
                        )}
                    </div>
                  </div>

                  <div
                    style={styles.panel}
                  >
                    <div
                      style={
                        styles.panelHeader
                      }
                    >
                      <div>
                        <span
                          style={
                            styles.panelHeaderEyebrow
                          }
                        >
                          REDEMPTIONS
                        </span>

                        <h3
                          style={
                            styles.panelHeaderTitle
                          }
                        >
                          Reward activity
                        </h3>
                      </div>
                    </div>

                    {rewardRedemptions
                      .slice(0, 20)
                      .map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            style={{
                              minHeight:
                                54,
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              borderBottom:
                                "1px solid #edf1ed",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  display:
                                    "block",
                                  fontSize:
                                    9,
                                }}
                              >
                                Reward redeemed
                              </strong>

                              <small
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    3,
                                  color:
                                    COLORS.muted,
                                  fontSize:
                                    8,
                                }}
                              >
                                {item.status ||
                                  "Processed"}
                              </small>
                            </div>

                            <strong
                              style={{
                                color:
                                  COLORS.danger,
                                fontSize:
                                  12,
                              }}
                            >
                              -
                              {
                                item.points_used
                              }
                            </strong>
                          </div>
                        )
                      )}
                  </div>

                </div>
              )}

            </section>
          )}

          {/* ===================================================
              COUPONS
          =================================================== */}

          {activeSection ===
            "coupons" && (
            <section
              style={styles.content}
            >

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "flex-end",
                  justifyContent:
                    "space-between",
                  gap: 20,
                  marginBottom: 18,
                }}
              >
                <div>
                  <span
                    style={
                      styles.headerEyebrow
                    }
                  >
                    PROMOTION MANAGEMENT
                  </span>

                  <h2
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize: 26,
                    }}
                  >
                    Coupons
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    openCreateCoupon
                  }
                  style={
                    styles.refreshButton
                  }
                >
                  <Plus size={15} />
                  Create Coupon
                </button>
              </div>

              <div
                className="sportiva-admin-stat-grid"
                style={
                  styles.statGrid
                }
              >

                <StatCard
                  icon={TicketPercent}
                  label="Total Coupons"
                  value={
                    coupons.length
                  }
                  detail="Created codes"
                />

                <StatCard
                  icon={Check}
                  label="Active"
                  value={
                    activeCoupons
                  }
                  detail="Enabled campaigns"
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
                  icon={TicketPercent}
                  label="Limited"
                  value={
                    coupons.filter(
                      (item) =>
                        item.usage_limit
                    ).length
                  }
                  detail="Limited campaigns"
                />

              </div>

              <div
                style={
                  styles.toolbar
                }
              >
                <div
                  style={styles.search}
                >
                  <Search size={15} />

                  <input
                    value={couponSearch}
                    onChange={(e) =>
                      setCouponSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search coupon code or title..."
                    style={
                      styles.searchInput
                    }
                  />
                </div>

                <span
                  style={{
                    marginLeft:
                      "auto",
                    color:
                      COLORS.muted,
                    fontSize: 9,
                  }}
                >
                  {
                    filteredCoupons.length
                  }{" "}
                  coupons
                </span>
              </div>

              <div
                style={
                  styles.tableCard
                }
              >
                <div
                  style={
                    styles.tableWrap
                  }
                >
                  <table
                    style={
                      styles.table
                    }
                  >
                    <thead>
                      <tr>
                        <th
                          style={
                            styles.th
                          }
                        >
                          Coupon
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Discount
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Usage
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Validity
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Status
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Actions
                        </th>
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
                                String(
                                  coupon.id
                                )
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
                              key={
                                coupon.id
                              }
                            >
                              <td
                                style={
                                  styles.td
                                }
                              >
                                <div
                                  style={{
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    gap: 9,
                                  }}
                                >
                                  <div
                                    style={{
                                      width:
                                        34,
                                      height:
                                        34,
                                      display:
                                        "grid",
                                      placeItems:
                                        "center",
                                      borderRadius:
                                        9,
                                      background:
                                        "#edf5ee",
                                      color:
                                        "#3d7047",
                                      flex:
                                        "0 0 auto",
                                    }}
                                  >
                                    <TicketPercent
                                      size={
                                        16
                                      }
                                    />
                                  </div>

                                  <div>
                                    <strong
                                      style={{
                                        display:
                                          "block",
                                        fontSize:
                                          10,
                                        letterSpacing:
                                          ".035em",
                                      }}
                                    >
                                      {
                                        coupon.code
                                      }
                                    </strong>

                                    <small
                                      style={{
                                        display:
                                          "block",
                                        marginTop:
                                          3,
                                        color:
                                          "#8c958e",
                                        fontSize:
                                          8,
                                      }}
                                    >
                                      {coupon.title ||
                                        "Sportiva promotion"}
                                    </small>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyCoupon(
                                        coupon.code
                                      )
                                    }
                                    style={{
                                      width:
                                        26,
                                      height:
                                        26,
                                      display:
                                        "grid",
                                      placeItems:
                                        "center",
                                      marginLeft:
                                        "auto",
                                      border:
                                        "1px solid #e1e8e2",
                                      borderRadius:
                                        7,
                                      background:
                                        "#fff",
                                      color:
                                        "#738077",
                                      cursor:
                                        "pointer",
                                    }}
                                  >
                                    <ClipboardList
                                      size={
                                        12
                                      }
                                    />
                                  </button>
                                </div>
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                <strong
                                  style={{
                                    color:
                                      "#31683d",
                                  }}
                                >
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
                                ) >
                                  0 && (
                                  <small
                                    style={{
                                      display:
                                        "block",
                                      marginTop:
                                        3,
                                      color:
                                        "#909891",
                                      fontSize:
                                        8,
                                    }}
                                  >
                                    Min ৳
                                    {Number(
                                      coupon.min_booking_amount
                                    ).toLocaleString()}
                                  </small>
                                )}
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                <strong>
                                  {usage}
                                </strong>

                                <span
                                  style={{
                                    marginLeft:
                                      3,
                                    color:
                                      "#8c958e",
                                    fontSize:
                                      8,
                                  }}
                                >
                                  {coupon.usage_limit
                                    ? ` / ${coupon.usage_limit}`
                                    : " / unlimited"}
                                </span>
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                <div
                                  style={{
                                    color:
                                      "#76817a",
                                    fontSize:
                                      8,
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  {coupon.starts_at
                                    ? formatDateTime(
                                        coupon.starts_at
                                      )
                                    : "Immediately"}

                                  <span
                                    style={{
                                      margin:
                                        "0 5px",
                                      color:
                                        "#a0a7a1",
                                    }}
                                  >
                                    →
                                  </span>

                                  {coupon.expires_at
                                    ? formatDateTime(
                                        coupon.expires_at
                                      )
                                    : "No expiry"}
                                </div>
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                {!coupon.is_active ? (
                                  <Status>
                                    Inactive
                                  </Status>
                                ) : scheduled ? (
                                  <Status type="info">
                                    Scheduled
                                  </Status>
                                ) : expired ? (
                                  <Status type="danger">
                                    Expired
                                  </Status>
                                ) : (
                                  <Status type="success">
                                    Active
                                  </Status>
                                )}
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                <div
                                  style={
                                    styles.actions
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditCoupon(
                                        coupon
                                      )
                                    }
                                    style={
                                      styles.iconButton
                                    }
                                  >
                                    <Edit3
                                      size={
                                        13
                                      }
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleCoupon(
                                        coupon
                                      )
                                    }
                                    style={
                                      styles.iconButton
                                    }
                                  >
                                    {coupon.is_active ? (
                                      <X
                                        size={
                                          13
                                        }
                                      />
                                    ) : (
                                      <Check
                                        size={
                                          13
                                        }
                                      />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteCoupon(
                                        coupon
                                      )
                                    }
                                    style={{
                                      ...styles.iconButton,
                                      color:
                                        COLORS.danger,
                                    }}
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
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredCoupons.length ===
                  0 && (
                  <div
                    style={
                      styles.empty
                    }
                  >
                    <TicketPercent
                      size={27}
                    />

                    <strong
                      style={
                        styles.emptyTitle
                      }
                    >
                      No coupons found.
                    </strong>

                    <span
                      style={
                        styles.emptyText
                      }
                    >
                      Create a promotional
                      code to begin.
                    </span>
                  </div>
                )}
              </div>

            </section>
          )}

          {/* ===================================================
              ANNOUNCEMENTS
          =================================================== */}

          {activeSection ===
            "announcements" && (
            <section
              style={styles.content}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-end",
                  marginBottom: 18,
                }}
              >
                <div>
                  <span
                    style={
                      styles.headerEyebrow
                    }
                  >
                    CUSTOMER
                    COMMUNICATION
                  </span>

                  <h2
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize: 26,
                    }}
                  >
                    Announcements
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowAnnouncementModal(
                      true
                    )
                  }
                  style={
                    styles.refreshButton
                  }
                >
                  <Plus size={15} />
                  New Announcement
                </button>
              </div>

              <div
                style={
                  styles.listCard
                    ? styles.listCard
                    : {
                        overflow:
                          "hidden",
                        border:
                          "1px solid #e1e8e2",
                        borderRadius:
                          16,
                        background:
                          "#fff",
                      }
                }
              >
                {announcements.map(
                  (announcement) => (
                    <div
                      key={
                        announcement.id
                      }
                      style={{
                        minHeight: 76,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap: 20,
                        padding:
                          "14px 17px",
                        borderBottom:
                          "1px solid #edf1ed",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 10,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 35,
                            height: 35,
                            display:
                              "grid",
                            placeItems:
                              "center",
                            borderRadius:
                              10,
                            background:
                              "#eef5ef",
                            color:
                              "#42704c",
                            flex:
                              "0 0 auto",
                          }}
                        >
                          <Megaphone
                            size={16}
                          />
                        </div>

                        <div
                          style={{
                            minWidth:
                              0,
                          }}
                        >
                          <strong
                            style={{
                              display:
                                "block",
                              fontSize:
                                10,
                            }}
                          >
                            {
                              announcement.title
                            }
                          </strong>

                          <p
                            style={{
                              margin:
                                "4px 0 0",
                              color:
                                "#7f8982",
                              fontSize:
                                9,
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {announcement.message ||
                              "No message"}
                          </p>

                          <small
                            style={{
                              display:
                                "block",
                              marginTop:
                                3,
                              color:
                                "#9aa19c",
                              fontSize:
                                7,
                            }}
                          >
                            {formatDateTime(
                              announcement.created_at
                            )}
                          </small>
                        </div>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 5,
                          flex:
                            "0 0 auto",
                        }}
                      >
                        <Status
                          type={
                            announcement.is_active
                              ? "success"
                              : "neutral"
                          }
                        >
                          {announcement.is_active
                            ? "Active"
                            : "Disabled"}
                        </Status>

                        <button
                          type="button"
                          onClick={() =>
                            toggleAnnouncement(
                              announcement
                            )
                          }
                          style={
                            styles.iconButton
                          }
                        >
                          {announcement.is_active ? (
                            <X
                              size={
                                13
                              }
                            />
                          ) : (
                            <Check
                              size={
                                13
                              }
                            />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteAnnouncement(
                              announcement
                            )
                          }
                          style={{
                            ...styles.iconButton,
                            color:
                              COLORS.danger,
                          }}
                        >
                          <Trash2
                            size={13}
                          />
                        </button>
                      </div>
                    </div>
                  )
                )}

                {announcements.length ===
                  0 && (
                  <div
                    style={
                      styles.empty
                    }
                  >
                    <Megaphone
                      size={27}
                    />

                    <strong
                      style={
                        styles.emptyTitle
                      }
                    >
                      No announcements yet.
                    </strong>

                    <span
                      style={
                        styles.emptyText
                      }
                    >
                      Publish your first
                      customer update.
                    </span>
                  </div>
                )}
              </div>

            </section>
          )}

        </main>
      </div>

      {/* =======================================================
          TURF MODAL
      ======================================================= */}

      {showTurfModal && (
        <Modal
          eyebrow="FACILITY MANAGEMENT"
          title={
            editingTurf
              ? "Edit Turf"
              : "Add Turf"
          }
          onClose={() =>
            setShowTurfModal(
              false
            )
          }
        >
          <form
            style={styles.form}
            onSubmit={saveTurf}
          >

            <div
              style={{
                ...styles.field,
                marginBottom: 14,
              }}
            >
              <label
                style={styles.label}
              >
                Turf Name
              </label>

              <input
                value={turfForm.name}
                onChange={(e) =>
                  setTurfForm(
                    (current) => ({
                      ...current,
                      name: e.target
                        .value,
                    })
                  )
                }
                style={styles.input}
                required
              />
            </div>

            <div
              style={{
                ...styles.field,
                marginBottom: 14,
              }}
            >
              <label
                style={styles.label}
              >
                Description
              </label>

              <textarea
                value={
                  turfForm.description
                }
                onChange={(e) =>
                  setTurfForm(
                    (current) => ({
                      ...current,
                      description:
                        e.target.value,
                    })
                  )
                }
                style={styles.textarea}
              />
            </div>

            <div
              className="sportiva-admin-form-grid"
              style={styles.formGrid}
            >
              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Price / Hour
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    turfForm.price_per_hour
                  }
                  onChange={(e) =>
                    setTurfForm(
                      (current) => ({
                        ...current,
                        price_per_hour:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Image URL
                </label>

                <input
                  type="url"
                  value={
                    turfForm.image_url
                  }
                  onChange={(e) =>
                    setTurfForm(
                      (current) => ({
                        ...current,
                        image_url:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                />
              </div>
            </div>

            <div
              className="sportiva-admin-modal-actions"
              style={
                styles.formActions
              }
            >
              <button
                type="button"
                onClick={() =>
                  setShowTurfModal(
                    false
                  )
                }
                style={
                  styles.refreshButton
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                style={
                  styles.refreshButton
                }
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

      {/* =======================================================
          SLOT MODAL
      ======================================================= */}

      {showSlotModal && (
        <Modal
          eyebrow="AVAILABILITY MANAGEMENT"
          title={
            editingSlot
              ? "Edit Time Slot"
              : "Add Time Slot"
          }
          onClose={() =>
            setShowSlotModal(
              false
            )
          }
        >
          <form
            style={styles.form}
            onSubmit={saveSlot}
          >

            <div
              className="sportiva-admin-form-grid"
              style={styles.formGrid}
            >
              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Turf
                </label>

                <select
                  value={
                    slotForm.turf_id
                  }
                  onChange={(e) =>
                    setSlotForm(
                      (current) => ({
                        ...current,
                        turf_id:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={
                    styles.select
                  }
                  required
                >
                  <option value="">
                    Select Turf
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
                        {turf.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Date
                </label>

                <input
                  type="date"
                  value={
                    slotForm.slot_date
                  }
                  onChange={(e) =>
                    setSlotForm(
                      (current) => ({
                        ...current,
                        slot_date:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Start Time
                </label>

                <input
                  type="time"
                  value={
                    slotForm.start_time
                  }
                  onChange={(e) =>
                    setSlotForm(
                      (current) => ({
                        ...current,
                        start_time:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  End Time
                </label>

                <input
                  type="time"
                  value={
                    slotForm.end_time
                  }
                  onChange={(e) =>
                    setSlotForm(
                      (current) => ({
                        ...current,
                        end_time:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <label
              style={styles.check}
            >
              <input
                type="checkbox"
                checked={
                  slotForm.is_available
                }
                onChange={(e) =>
                  setSlotForm(
                    (current) => ({
                      ...current,
                      is_available:
                        e.target
                          .checked,
                    })
                  )
                }
              />

              <span
                style={
                  styles.checkLabel
                }
              >
                Available for customer
                booking
              </span>
            </label>

            <div
              className="sportiva-admin-modal-actions"
              style={
                styles.formActions
              }
            >
              <button
                type="button"
                onClick={() =>
                  setShowSlotModal(
                    false
                  )
                }
                style={
                  styles.refreshButton
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                style={
                  styles.refreshButton
                }
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

      {/* =======================================================
          COUPON MODAL
      ======================================================= */}

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
            setShowCouponModal(
              false
            )
          }
        >
          <form
            style={styles.form}
            onSubmit={saveCoupon}
          >

            <div
              style={{
                ...styles.field,
                marginBottom: 14,
              }}
            >
              <label
                style={
                  styles.label
                }
              >
                Coupon Code
              </label>

              <div
                style={
                  styles.codeRow
                }
              >
                <input
                  value={
                    couponForm.code
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        code: e.target
                          .value
                          .toUpperCase(),
                      })
                    )
                  }
                  style={styles.input}
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
                  style={
                    styles.generateButton
                  }
                >
                  Generate
                </button>
              </div>
            </div>

            <div
              className="sportiva-admin-form-grid"
              style={styles.formGrid}
            >

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Title
                </label>

                <input
                  value={
                    couponForm.title
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        title:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="Weekend Special"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Discount Type
                </label>

                <select
                  value={
                    couponForm.discount_type
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        discount_type:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={
                    styles.select
                  }
                >
                  <option value="percentage">
                    Percentage
                  </option>

                  <option value="fixed">
                    Fixed Amount
                  </option>
                </select>
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Discount Value
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    couponForm.discount_value
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        discount_value:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Minimum Booking
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    couponForm.min_booking_amount
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        min_booking_amount:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Maximum Discount
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    couponForm.max_discount_amount
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        max_discount_amount:
                          e.target
                            .value,
                      })
                    )
                  }
                  disabled={
                    couponForm.discount_type !==
                    "percentage"
                  }
                  style={styles.input}
                  placeholder="Optional"
                />
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Total Usage Limit
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    couponForm.usage_limit
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        usage_limit:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                  placeholder="Unlimited"
                />
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Per User Limit
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    couponForm.per_user_limit
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        per_user_limit:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Starts At
                </label>

                <input
                  type="datetime-local"
                  value={
                    couponForm.starts_at
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        starts_at:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label
                  style={
                    styles.label
                  }
                >
                  Expires At
                </label>

                <input
                  type="datetime-local"
                  value={
                    couponForm.expires_at
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        expires_at:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.input}
                />
              </div>

              <div
                className="full"
                style={styles.field}
              >
                <label
                  style={
                    styles.label
                  }
                >
                  Description
                </label>

                <textarea
                  rows="3"
                  value={
                    couponForm.description
                  }
                  onChange={(e) =>
                    setCouponForm(
                      (current) => ({
                        ...current,
                        description:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={styles.textarea}
                  placeholder="Describe this promotion..."
                />
              </div>

            </div>

            <label
              style={styles.check}
            >
              <input
                type="checkbox"
                checked={
                  couponForm.is_active
                }
                onChange={(e) =>
                  setCouponForm(
                    (current) => ({
                      ...current,
                      is_active:
                        e.target
                          .checked,
                    })
                  )
                }
              />

              <span
                style={
                  styles.checkLabel
                }
              >
                Coupon is active
              </span>
            </label>

            <div
              className="sportiva-admin-modal-actions"
              style={
                styles.formActions
              }
            >
              <button
                type="button"
                onClick={() =>
                  setShowCouponModal(
                    false
                  )
                }
                style={
                  styles.refreshButton
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                style={
                  styles.refreshButton
                }
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

      {/* =======================================================
          ANNOUNCEMENT MODAL
      ======================================================= */}

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
            style={styles.form}
            onSubmit={
              createAnnouncement
            }
          >

            <div
              style={{
                ...styles.field,
                marginBottom: 14,
              }}
            >
              <label
                style={
                  styles.label
                }
              >
                Title
              </label>

              <input
                value={
                  announcementForm.title
                }
                onChange={(e) =>
                  setAnnouncementForm(
                    (current) => ({
                      ...current,
                      title:
                        e.target.value,
                    })
                  )
                }
                style={styles.input}
                required
              />
            </div>

            <div
              style={styles.field}
            >
              <label
                style={
                  styles.label
                }
              >
                Message
              </label>

              <textarea
                rows="5"
                value={
                  announcementForm.message
                }
                onChange={(e) =>
                  setAnnouncementForm(
                    (current) => ({
                      ...current,
                      message:
                        e.target.value,
                    })
                  )
                }
                style={styles.textarea}
              />
            </div>

            <div
              className="sportiva-admin-modal-actions"
              style={
                styles.formActions
              }
            >
              <button
                type="button"
                onClick={() =>
                  setShowAnnouncementModal(
                    false
                  )
                }
                style={
                  styles.refreshButton
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                style={
                  styles.refreshButton
                }
              >
                <Megaphone
                  size={14}
                />
                Publish
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* =======================================================
          POINTS MODAL
      ======================================================= */}

      {showPointsModal &&
        selectedMember && (
          <Modal
            eyebrow="REWARDS MANAGEMENT"
            title="Adjust Points"
            onClose={() =>
              setShowPointsModal(
                false
              )
            }
          >
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 10,
                margin:
                  "18px 22px 0",
                padding: 11,
                border:
                  "1px solid #e1e8e2",
                borderRadius: 10,
                background: "#fafcfb",
              }}
            >
              <div
                style={
                  styles.avatar
                }
              >
                {users
                  .find(
                    (user) =>
                      user.id ===
                      selectedMember.user_id
                  )
                  ?.full_name?.charAt(0)
                  ?.toUpperCase() ||
                  "U"}
              </div>

              <div>
                <strong
                  style={{
                    display:
                      "block",
                    fontSize: 10,
                  }}
                >
                  {
                    users.find(
                      (user) =>
                        user.id ===
                        selectedMember.user_id
                    )?.full_name
                  }
                </strong>

                <small
                  style={{
                    display:
                      "block",
                    marginTop:
                      3,
                    color:
                      COLORS.muted,
                    fontSize: 8,
                  }}
                >
                  Current:
                  {" "}
                  {
                    selectedMember.points ||
                    0
                  }{" "}
                  points
                </small>
              </div>
            </div>

            <div
              style={styles.form}
            >

              <div
                style={{
                  ...styles.field,
                  marginBottom: 14,
                }}
              >
                <label
                  style={
                    styles.label
                  }
                >
                  Points
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    pointsAmount
                  }
                  onChange={(e) =>
                    setPointsAmount(
                      e.target
                        .value
                    )
                  }
                  style={styles.input}
                  placeholder="10"
                />
              </div>

              <div
                style={styles.field}
              >
                <label
                  style={
                    styles.label
                  }
                >
                  Reason
                </label>

                <textarea
                  rows="3"
                  value={
                    pointsReason
                  }
                  onChange={(e) =>
                    setPointsReason(
                      e.target
                        .value
                    )
                  }
                  style={styles.textarea}
                  placeholder="Reason for adjustment..."
                />
              </div>

              <div
                className="sportiva-admin-modal-actions"
                style={
                  styles.formActions
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowPointsModal(
                      false
                    )
                  }
                  style={
                    styles.refreshButton
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    adjustPoints(
                      "remove"
                    )
                  }
                  style={{
                    ...styles.refreshButton,
                    color:
                      COLORS.danger,
                  }}
                >
                  Deduct
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    adjustPoints(
                      "add"
                    )
                  }
                  style={{
                    ...styles.refreshButton,
                    background:
                      COLORS.green,
                    color:
                      "#fff",
                    borderColor:
                      COLORS.green,
                  }}
                >
                  Add Points
                </button>
              </div>

            </div>
          </Modal>
        )}

    </>
  );
}