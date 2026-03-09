import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/GuestNavbar.css";

export default function GuestNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNavClick = (id) => {
    setMobileOpen(false);
    if (location.pathname === "/") {
      scrollToId(id);
      return;
    }
    navigate("/");
    setTimeout(() => scrollToId(id), 220);
  };

  return (
    <>
      <nav className="guest-navbar">
        <div className="guest-navbar-container">
          {/* Logo */}
          <div className="guest-nav-brand" onClick={() => navigate("/")}>
            <span className="guest-logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="#0D9488" />
                <path d="M14 5L9 15h4v8l6-10h-4V5z" fill="white" />
              </svg>
            </span>
            <span className="guest-logo-text">HealthAI</span>
          </div>

          {/* Navigation Links (desktop) */}
          <div className="guest-nav-center">
            <button
              className="nav-link"
              onClick={() => handleNavClick("features")}
            >
              Features
            </button>
            <button className="nav-link" onClick={() => handleNavClick("how")}>
              How it Works
            </button>
            <button
              className="nav-link"
              onClick={() => handleNavClick("stats")}
            >
              Testimonials
            </button>
          </div>

          {/* Right: Get Started (desktop) + Hamburger (mobile) */}
          <div className="guest-nav-right">
            <button
              className="guest-get-started-btn"
              style={{}}
              onClick={() => navigate("/signup")}
            >
              Get Started
            </button>
            <button
              className="guest-hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <path
                    d="M3 6h18M3 12h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile floating dropdown — outside <nav> so it doesn't expand the bar */}
      {mobileOpen && (
        <div className="guest-mobile-menu">
          <button
            className="nav-link"
            onClick={() => handleNavClick("features")}
          >
            Features
          </button>
          <button className="nav-link" onClick={() => handleNavClick("how")}>
            How it Works
          </button>
          <button className="nav-link" onClick={() => handleNavClick("stats")}>
            Testimonials
          </button>
          <button
            className="guest-get-started-btn"
            onClick={() => {
              setMobileOpen(false);
              navigate("/signup");
            }}
          >
            Get Started
          </button>
        </div>
      )}
    </>
  );
}
