import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { supabase } from "./lib/supabase";

import Dashboard from "./pages/Dashboard";
import Book from "./pages/Book";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
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
            animation: "spin 0.8s linear infinite",
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
          @keyframes spin {
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
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession);
      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setLoading(false);
    });

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
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

function AdminRoute() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setAllowed(false);
            setLoading(false);
          }
          return;
        }

        const { data: adminRecord, error } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Admin verification error:", error);
        }

        if (!mounted) return;

        setAllowed(Boolean(adminRecord));
        setLoading(false);
      } catch (error) {
        console.error("Admin verification failed:", error);

        if (mounted) {
          setAllowed(false);
          setLoading(false);
        }
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
    return <LoadingScreen message="Verifying admin access..." />;
  }

  if (!allowed) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/book" element={<Book />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;