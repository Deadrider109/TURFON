import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { supabase } from "./lib/supabase";

import Dashboard from "./pages/Dashboard";
import Book from "./pages/Book";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import Rewards from "./pages/Rewards";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";

function LoadingScreen({ message = "Loading..." }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f7f5",
        color: "#176b3a",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 46,
            height: 46,
            margin: "0 auto 14px",
            borderRadius: 12,
            border: "3px solid #dce9df",
            borderTopColor: "#176b3a",
            animation: "sportivaSpin 0.8s linear infinite",
          }}
        />

        <strong
          style={{
            display: "block",
            color: "#173022",
            fontSize: 13,
            letterSpacing: 1.5,
          }}
        >
          THE SPORTIVA
        </strong>

        <span
          style={{
            display: "block",
            marginTop: 5,
            color: "#7d8982",
            fontSize: 10,
          }}
        >
          {message}
        </span>
      </div>

      <style>
        {`
          @keyframes sportivaSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

function ProtectedRoute() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);
      } catch (error) {
        console.error("Session check failed:", error);

        if (!mounted) return;

        setSession(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingScreen message="Checking session..." />;
  }

  if (!session?.user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
        }}
      />
    );
  }

  return <Outlet />;
}

function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError || !user) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        const { data: adminRecord, error: adminError } =
          await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!mounted) return;

        if (adminError) {
          console.error(
            "Admin verification error:",
            adminError
          );

          setAllowed(false);
          setLoading(false);
          return;
        }

        setAllowed(Boolean(adminRecord));
        setLoading(false);
      } catch (error) {
        console.error(
          "Admin verification failed:",
          error
        );

        if (!mounted) return;

        setAllowed(false);
        setLoading(false);
      }
    };

    verifyAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      verifyAdmin();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <LoadingScreen message="Verifying admin access..." />
    );
  }

  if (!allowed) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

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

        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={<Admin />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;