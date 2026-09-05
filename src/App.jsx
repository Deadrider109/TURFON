import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { supabase } from "./lib/supabase";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Book from "./pages/Book";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import Rewards from "./pages/Rewards";

import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import Coupons from "./pages/Coupons";

function AppBackground() {
  return (
    <div className="sportiva-bg" aria-hidden="true">
      <div className="sportiva-bg-grid" />

      <motion.div
        className="sportiva-orb orb-1"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -20, 25, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="sportiva-orb orb-2"
        animate={{
          x: [0, -35, 20, 0],
          y: [0, 25, -20, 0],
          scale: [1, 0.94, 1.05, 1],
        }}
        transition={{
          duration: 19,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="sportiva-orb orb-3"
        animate={{
          x: [0, 25, -25, 0],
          y: [0, -15, 25, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="sportiva-light-line line-1"
        animate={{
          opacity: [0.1, 0.28, 0.1],
          scaleX: [0.96, 1.02, 0.96],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="sportiva-light-line line-2"
        animate={{
          opacity: [0.08, 0.2, 0.08],
          scaleX: [1, 0.95, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

function AppStyles() {
  return (
    <style>{`
      :root {
        --sportiva-green: #173d26;
        --sportiva-green-2: #245837;
        --sportiva-lime: #a7df62;
        --sportiva-text: #172019;
        --sportiva-muted: #738078;
        --sportiva-border: rgba(36, 65, 43, 0.1);
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        min-width: 320px;
        background: #f4f7f4;
        color: var(--sportiva-text);
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      button,
      input,
      textarea,
      select {
        font: inherit;
      }

      button {
        -webkit-tap-highlight-color: transparent;
      }

      .sportiva-app {
        position: relative;
        min-height: 100vh;
        isolation: isolate;
        overflow-x: hidden;
      }

      .sportiva-bg {
        position: fixed;
        inset: 0;
        z-index: -10;
        overflow: hidden;
        pointer-events: none;
        background:
          radial-gradient(
            circle at 8% 0%,
            rgba(107, 165, 112, 0.1),
            transparent 28%
          ),
          radial-gradient(
            circle at 92% 8%,
            rgba(167, 223, 98, 0.08),
            transparent 25%
          ),
          linear-gradient(
            180deg,
            #f8faf8 0%,
            #f3f7f3 55%,
            #eef4ef 100%
          );
      }

      .sportiva-bg-grid {
        position: absolute;
        inset: 0;
        opacity: 0.22;
        background-image:
          linear-gradient(
            rgba(38, 77, 48, 0.04) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(38, 77, 48, 0.04) 1px,
            transparent 1px
          );
        background-size: 46px 46px;
        mask-image: linear-gradient(
          to bottom,
          black,
          transparent 92%
        );
        -webkit-mask-image: linear-gradient(
          to bottom,
          black,
          transparent 92%
        );
      }

      .sportiva-orb {
        position: absolute;
        border-radius: 999px;
        will-change: transform;
      }

      .orb-1 {
        width: 420px;
        height: 420px;
        top: -170px;
        left: -160px;
        background: radial-gradient(
          circle,
          rgba(81, 144, 89, 0.14),
          rgba(81, 144, 89, 0)
        );
        filter: blur(5px);
      }

      .orb-2 {
        width: 500px;
        height: 500px;
        top: 80px;
        right: -210px;
        background: radial-gradient(
          circle,
          rgba(166, 221, 93, 0.11),
          rgba(166, 221, 93, 0)
        );
        filter: blur(4px);
      }

      .orb-3 {
        width: 360px;
        height: 360px;
        bottom: -190px;
        left: 40%;
        background: radial-gradient(
          circle,
          rgba(47, 97, 59, 0.06),
          rgba(47, 97, 59, 0)
        );
        filter: blur(4px);
      }

      .sportiva-light-line {
        position: absolute;
        height: 1px;
        transform-origin: center;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(58, 107, 69, 0.18),
          transparent
        );
      }

      .line-1 {
        width: 55vw;
        top: 23%;
        left: -10%;
        transform: rotate(-11deg);
      }

      .line-2 {
        width: 52vw;
        top: 63%;
        right: -9%;
        transform: rotate(10deg);
      }

      .sportiva-loading-screen {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(
            circle at 50% 30%,
            rgba(89, 147, 96, 0.1),
            transparent 32%
          ),
          #f5f8f5;
      }

      .sportiva-loader-card {
        width: min(410px, 100%);
        padding: 34px;
        text-align: center;
        border: 1px solid rgba(37, 72, 46, 0.1);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.78);
        box-shadow:
          0 28px 80px rgba(23, 53, 30, 0.09),
          inset 0 1px 0 rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .sportiva-loader-mark {
        position: relative;
        width: 58px;
        height: 58px;
        margin: 0 auto 18px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        overflow: hidden;
        background:
          linear-gradient(
            145deg,
            #173d26,
            #2d6840
          );
        color: white;
        font-size: 18px;
        font-weight: 900;
        box-shadow:
          0 12px 30px rgba(23, 61, 38, 0.2);
      }

      .sportiva-loader-mark::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            120deg,
            transparent 25%,
            rgba(255,255,255,0.28) 48%,
            transparent 65%
          );
        transform: translateX(-100%);
        animation: sportiva-shimmer 1.9s infinite;
      }

      .sportiva-loader-title {
        margin: 0;
        color: #1d3023;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .sportiva-loader-subtitle {
        margin: 8px 0 0;
        color: #7d887f;
        font-size: 12px;
      }

      .sportiva-loader-bar {
        width: 100%;
        height: 4px;
        margin-top: 22px;
        overflow: hidden;
        border-radius: 999px;
        background: #e8eee9;
      }

      .sportiva-loader-progress {
        width: 45%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(
          90deg,
          #173d26,
          #a7df62
        );
        animation: sportiva-loading 1.35s ease-in-out infinite;
      }

      .sportiva-route-wrapper {
        position: relative;
        width: 100%;
        min-height: 100vh;
      }

      .sportiva-route-page {
        width: 100%;
        min-height: 100vh;
      }

      .sportiva-route-glow {
        position: fixed;
        inset: auto auto 5% 50%;
        width: 250px;
        height: 250px;
        border-radius: 50%;
        transform: translateX(-50%);
        pointer-events: none;
        background: radial-gradient(
          circle,
          rgba(100, 158, 106, 0.055),
          transparent 68%
        );
        z-index: -2;
      }

      .sportiva-back-to-top {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 30;
      }

      @keyframes sportiva-loading {
        0% {
          transform: translateX(-120%);
        }
        100% {
          transform: translateX(320%);
        }
      }

      @keyframes sportiva-shimmer {
        0% {
          transform: translateX(-120%);
        }
        55%,
        100% {
          transform: translateX(120%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        html {
          scroll-behavior: auto;
        }

        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      @media (max-width: 700px) {
        .sportiva-bg-grid {
          background-size: 34px 34px;
        }

        .orb-1 {
          width: 300px;
          height: 300px;
          left: -150px;
        }

        .orb-2 {
          width: 350px;
          height: 350px;
          right: -190px;
        }

        .orb-3 {
          width: 280px;
          height: 280px;
        }

        .sportiva-loader-card {
          padding: 28px 22px;
        }
      }
    `}</style>
  );
}

function LoadingScreen({ message = "Loading Sportiva..." }) {
  return (
    <div className="sportiva-loading-screen">
      <motion.div
        className="sportiva-loader-card"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.45,
          ease: "easeOut",
        }}
      >
        <motion.div
          className="sportiva-loader-mark"
          animate={{
            y: [0, -4, 0],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          S
        </motion.div>

        <h2 className="sportiva-loader-title">
          The Sportiva
        </h2>

        <p className="sportiva-loader-subtitle">
          {message}
        </p>

        <div className="sportiva-loader-bar">
          <motion.div
            className="sportiva-loader-progress"
            animate={{
              x: ["-100%", "220%"],
            }}
            transition={{
              duration: 1.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function PageTransition() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="sportiva-route-page"
        initial={{
          opacity: 0,
          y: 10,
          filter: "blur(3px)",
        }}
        animate={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
        }}
        exit={{
          opacity: 0,
          y: -8,
          filter: "blur(2px)",
        }}
        transition={{
          duration: 0.28,
          ease: "easeOut",
        }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!active) return;

      setSession(currentSession);
      setLoading(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!active) return;

        setSession(currentSession);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingScreen message="Checking your session..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <PageTransition />;
}

function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session?.user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Admin verification error:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(Boolean(data));
      }

      setLoading(false);
    }

    verifyAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      verifyAdmin();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingScreen message="Verifying admin access..." />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <PageTransition />;
}

function PublicRoute() {
  return <PageTransition />;
}

function AppRoutes() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC ROUTES
      ===================================================== */}

      <Route element={<PublicRoute />}>

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

      </Route>

      {/* =====================================================
          PROTECTED CUSTOMER ROUTES
      ===================================================== */}

      <Route element={<ProtectedRoute />}>

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/book"
          element={<Book />}
        />

        <Route
          path="/bookings"
          element={<Bookings />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/rewards"
          element={<Rewards />}
        />

      </Route>

      {/* =====================================================
          ADMIN AUTH
      ===================================================== */}

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      {/* =====================================================
          ADMIN DASHBOARD
      ===================================================== */}

      <Route element={<AdminRoute />}>

        <Route
          path="/admin"
          element={<Admin />}
        />

        {/* Coupon management */}
        <Route
          path="/admin/coupons"
          element={<Coupons />}
        />

      </Route>

      {/* =====================================================
          FALLBACK
      ===================================================== */}

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppStyles />

      <div className="sportiva-app">
        <AppBackground />

        <div className="sportiva-route-wrapper">
          <AppRoutes />
        </div>

        <div className="sportiva-route-glow" />
      </div>
    </BrowserRouter>
  );
}