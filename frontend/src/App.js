import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Map from "./pages/Map";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import DoctorAgent from "./pages/DoctorAgent";
import Emergency from "./pages/Emergency";
import NearbyFinder from "./pages/NearbyFinder";
import Appointment from "./pages/Appointment";
import MyAppointment from "./pages/MyAppointment";
import HospitalAppointment from "./pages/HospitalAppointment";
import AdminUpdates from "./pages/AdminUpdates";
import AdminAppointments from "./pages/AdminAppointments";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import Settings from "./pages/Settings";

import Navbar from "./components/Navbar";
import GuestNavbar from "./components/GuestNavbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import { AuthProvider, useAuth } from "./context/AuthContext";

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close nav on route change
  // (handled inside Navbar via onClose prop)

  if (loading) {
    return <div style={{ padding: "30px" }}>Loading...</div>;
  }

  // Show GuestNavbar on public pages (landing, login, signup)
  const isPublicPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  // Hide navbar on auth pages when not logged in
  const shouldShowNavbar = user && !isPublicPage;

  return (
    <>
      {/* Public pages: GuestNavbar on top */}
      {isPublicPage && <GuestNavbar />}

      {/* Authenticated pages: sidebar + content layout */}
      <div className={shouldShowNavbar ? "app-layout" : ""}>
        {shouldShowNavbar && (
          <Navbar
            isOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />
        )}
        {/* Backdrop — closes sidebar when tapped on mobile */}
        {shouldShowNavbar && mobileNavOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setMobileNavOpen(false)}
          />
        )}
        <main className={shouldShowNavbar ? "app-main" : ""}>
          {/* Mobile top bar */}
          {shouldShowNavbar && (
            <div className="mobile-topbar">
              <button
                className="mobile-hamburger"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
              >
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <path
                    d="M3 6h18M3 12h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div className="mobile-topbar-logo">
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="8" fill="#0D9488" />
                  <path d="M14 5L9 15h4v8l6-10h-4V5z" fill="white" />
                </svg>
                <span>HealthAI</span>
              </div>
            </div>
          )}
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor-agent"
              element={
                <ProtectedRoute>
                  <DoctorAgent />
                </ProtectedRoute>
              }
            />

            <Route
              path="/nearby"
              element={
                <ProtectedRoute>
                  <NearbyFinder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointment"
              element={
                <ProtectedRoute>
                  <Appointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-appointments"
              element={
                <ProtectedRoute>
                  <MyAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital-appointments"
              element={
                <AdminRoute>
                  <HospitalAppointment />
                </AdminRoute>
              }
            />
            <Route path="/map" element={<Map />} />

            <Route
              path="/emergency"
              element={
                <ProtectedRoute>
                  <Emergency />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminUpdates />
                </AdminRoute>
              }
            />

            <Route
              path="/admin-dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            <Route
              path="/admin-appointments"
              element={
                <AdminRoute>
                  <AdminAppointments />
                </AdminRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <SpeedInsights />
      </Router>
    </AuthProvider>
  );
}
