import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

export default function Navbar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
    onClose?.();
  };

  const go = (path) => {
    navigate(path);
    onClose?.();
  };
  const active = (path) =>
    location.pathname === path ? "sidebar-link active" : "sidebar-link";

  if (!user) return null;

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const role = isAdmin ? "Admin" : "Premium Member";

  return (
    <aside className={`sidebar${isOpen ? " sidebar-open" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => go("/home")}>
        <span className="sidebar-logo-icon">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#0D9488" />
            <path d="M14 5L9 15h4v8l6-10h-4V5z" fill="white" />
          </svg>
        </span>
        <span className="sidebar-logo-text">HealthAI</span>
      </div>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        <button className={active("/home")} onClick={() => go("/home")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="3"
              width="7"
              height="7"
              rx="1.5"
              fill="currentColor"
            />
            <rect
              x="14"
              y="3"
              width="7"
              height="7"
              rx="1.5"
              fill="currentColor"
            />
            <rect
              x="3"
              y="14"
              width="7"
              height="7"
              rx="1.5"
              fill="currentColor"
            />
            <rect
              x="14"
              y="14"
              width="7"
              height="7"
              rx="1.5"
              fill="currentColor"
            />
          </svg>
          Overview
        </button>

        <button
          className={active("/doctor-agent")}
          onClick={() => go("/doctor-agent")}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="8"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="10"
              y="14"
              width="4"
              height="1.5"
              rx="0.75"
              fill="currentColor"
            />
            <rect
              x="11.25"
              y="12.75"
              width="1.5"
              height="4"
              rx="0.75"
              fill="currentColor"
            />
          </svg>
          Doctor AI Agent
        </button>

        <button className={active("/nearby")} onClick={() => go("/nearby")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 12h3l3-9 4 18 3-9h5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Vitals &amp; Nearby
        </button>

        <button
          className={active("/appointment")}
          onClick={() => go("/appointment")}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="4"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16 2v4M8 2v4M3 10h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Appointments
        </button>

        <button
          className={active("/my-appointments")}
          onClick={() => go("/my-appointments")}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="14 2 14 8 20 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Reports
        </button>

        <button className={active("/map")} onClick={() => go("/map")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
            <polygon
              points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="8"
              y1="2"
              x2="8"
              y2="18"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="16"
              y1="6"
              x2="16"
              y2="22"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          Map
        </button>

        <button
          className={active("/emergency")}
          onClick={() => go("/emergency")}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="12"
              y1="9"
              x2="12"
              y2="13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="17"
              x2="12.01"
              y2="17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Emergency
        </button>

        <button className={active("/feedback")} onClick={() => go("/feedback")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Feedback
        </button>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="sidebar-divider">
              <span>Admin Panel</span>
            </div>

            <button
              className={active("/admin-dashboard")}
              onClick={() => go("/admin-dashboard")}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="3"
                  width="7"
                  height="7"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <rect
                  x="14"
                  y="3"
                  width="7"
                  height="7"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <rect
                  x="3"
                  y="14"
                  width="7"
                  height="7"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <rect
                  x="14"
                  y="14"
                  width="7"
                  height="7"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              Admin Dashboard
            </button>

            <button
              className={active("/admin-appointments")}
              onClick={() => go("/admin-appointments")}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 11l3 3L22 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Manage Appointments
            </button>

            <button
              className={active("/hospital-appointments")}
              onClick={() => go("/hospital-appointments")}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="9 22 9 12 15 12 15 22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Hospital Dashboard
            </button>

            <button className={active("/admin")} onClick={() => go("/admin")}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.5 2.5a2.121 2.121 0 013 3L12 14l-4 1 1-4 8.5-8.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Hospital Updates
            </button>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        {/* Upgrade Plan Card */}
        <div className="upgrade-card">
          <div className="upgrade-title">Upgrade Plan</div>
          <div className="upgrade-sub">
            Get advanced AI doctor consultations.
          </div>
          <button className="upgrade-btn" onClick={() => go("/doctor-agent")}>
            View Pro Plans
          </button>
        </div>

        {/* Settings & Logout */}
        <button className={active("/settings")} onClick={() => go("/settings")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          Settings
        </button>

        <button className="sidebar-link logout-link" onClick={handleLogout}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="16 17 21 12 16 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="21"
              y1="12"
              x2="9"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Log Out
        </button>

        {/* User Profile */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-role">{role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
