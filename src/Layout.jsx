import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser, useClerk } from "@clerk/clerk-react";
import { db } from "@/api/apiClient";
import {
  Home, Users, Calendar, Flag, Shield, BookOpen,
  UserPlus, Settings, ChevronDown, Moon, Sun,
  RefreshCw, LogOut, User, Menu, X
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const { user } = useUser();
  const { signOut, redirectToSignIn } = useClerk();
  const [darkMode, setDarkMode] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    loadUser();
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const configs = await db.filter('ThemeConfig', { config_key: 'global' });
      if (configs.length > 0) setTheme(configs[0]);
    } catch {}
  };

  const bgPrimary = theme?.bg_primary || "#0a0c0f";
  const bgSecondary = theme?.bg_secondary || "#111318";
  const bgCard = theme?.bg_card || "#161a21";
  const accentPrimary = theme?.accent_primary || "#4ade80";
  const textPrimary = theme?.text_primary || "#f1f5f9";
  const textSecondary = theme?.text_secondary || "#94a3b8";
  const borderColor = theme?.border_color || "#1e2530";
  const unitName = theme?.unit_name || "Task Force HQ";

  const navItems = [
    { label: "Dashboard", page: "Home", icon: Home },
    { label: "Roster", page: "Roster", icon: Users },
    { label: "Events", page: "Events", icon: Calendar },
    { label: "Campaigns", page: "Campaigns", icon: Flag },
    { label: "Training", page: "Training", icon: BookOpen },
    { label: "Recruitment", page: "Recruitment", icon: UserPlus },
    { label: "Admin", page: "Admin", icon: Shield },
  ];

  const lightBg = darkMode ? bgPrimary : "#f1f5f9";
  const lightNav = darkMode ? bgSecondary : "#ffffff";
  const lightText = darkMode ? textPrimary : "#0f172a";
  const lightSubtext = darkMode ? textSecondary : "#64748b";
  const lightBorder = darkMode ? borderColor : "#e2e8f0";

  return (
    <div style={{ backgroundColor: lightBg, color: lightText, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        :root {
          --accent: ${accentPrimary};
          --bg-card: ${darkMode ? bgCard : "#ffffff"};
          --bg-secondary: ${darkMode ? bgSecondary : "#f8fafc"};
          --text-primary: ${lightText};
          --text-secondary: ${lightSubtext};
          --border: ${lightBorder};
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${darkMode ? bgPrimary : "#f1f5f9"}; }
        ::-webkit-scrollbar-thumb { background: ${darkMode ? borderColor : "#cbd5e1"}; border-radius: 3px; }
        .nav-link:hover { color: ${accentPrimary} !important; }
        .nav-link.active { color: ${accentPrimary} !important; border-bottom: 2px solid ${accentPrimary}; }
      `}</style>

      {/* Top Nav */}
      <nav style={{ backgroundColor: darkMode ? bgSecondary : "#ffffff", borderBottom: `1px solid ${lightBorder}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
          {/* Logo */}
          <Link to={createPageUrl("Home")} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div style={{ width: "36px", height: "36px", background: theme?.unit_logo_url ? "transparent" : `linear-gradient(135deg, ${accentPrimary}, ${theme?.accent_secondary || "#22c55e"})`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {theme?.unit_logo_url ? <img src={theme.unit_logo_url} alt="Unit Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <Shield size={20} color="#000" />}
            </div>
            <span style={{ fontWeight: 700, fontSize: "1.1rem", color: lightText, letterSpacing: "0.05em" }}>ATAK-Platform</span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }} className="hidden-mobile">
            {(user ? navItems : navItems.filter(n => n.page === "Recruitment")).map(({ label, page, icon: Icon }) => (
              <Link
                key={page}
                to={createPageUrl(page)}
                className={`nav-link ${currentPageName === page ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", textDecoration: "none", color: lightSubtext, fontSize: "0.875rem", fontWeight: 500, transition: "color 0.2s", borderBottom: "2px solid transparent" }}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{ background: "none", border: `1px solid ${lightBorder}`, borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: lightSubtext, display: "flex", alignItems: "center" }}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: `1px solid ${lightBorder}`, borderRadius: "8px", padding: "5px 10px", cursor: "pointer", color: lightText }}
                >
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: accentPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={14} color="#000" />
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{user.fullName || user.primaryEmailAddress?.emailAddress?.split("@")[0]}</span>
                  <ChevronDown size={14} />
                </button>
                {profileOpen && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: darkMode ? bgCard : "#ffffff", border: `1px solid ${lightBorder}`, borderRadius: "10px", minWidth: "200px", overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.4)", zIndex: 100 }}>
                    <Link to={createPageUrl("MemberProfile") + "?me=true"} onClick={() => setProfileOpen(false)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", textDecoration: "none", color: lightText, fontSize: "0.9rem" }} className="nav-link">
                      <User size={16} /> My Profile
                    </Link>
                    <button onClick={() => setProfileOpen(false)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "none", border: "none", color: lightText, cursor: "pointer", width: "100%", fontSize: "0.9rem" }} className="nav-link">
                      <RefreshCw size={16} /> Refresh Permissions
                    </button>
                    <div style={{ height: "1px", background: lightBorder }} />
                    <button onClick={() => signOut()} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "none", border: "none", color: theme?.accent_danger || "#ef4444", cursor: "pointer", width: "100%", fontSize: "0.9rem" }}>
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => redirectToSignIn()}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: accentPrimary, color: "#000", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
              >
                Sign in with Discord
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: "none", background: "none", border: "none", color: lightText, cursor: "pointer" }} className="mobile-menu-btn">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div style={{ borderTop: `1px solid ${lightBorder}`, padding: "1rem 1.5rem" }}>
            {(user ? navItems : navItems.filter(n => n.page === "Recruitment")).map(({ label, page, icon: Icon }) => (
              <Link key={page} to={createPageUrl(page)} onClick={() => setMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", textDecoration: "none", color: lightSubtext, fontSize: "0.9rem" }}>
                <Icon size={16} /> {label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}