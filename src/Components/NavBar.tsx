import React from "react";
import { useLocation } from "react-router-dom";
import { Search, Heart } from "lucide-react";

interface NavBarProps {
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  notificationCount?: number;
}

const NavBar: React.FC<NavBarProps> = ({ onSearchClick, onNotificationClick, notificationCount = 0 }) => {
  const location = useLocation();

  // Check if user is logged in - read directly from localStorage each render
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // Don't show icons on login page
  const isLoginPage = location.pathname === "/login";
  const showIcons = isLoggedIn && !isLoginPage;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full">
        <div className="w-full px-4 py-3">
          <div className="relative rounded-2xl border border-white/15 bg-white/[0.03] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-white/10 via-transparent to-white/5" />
            <div className="absolute top-0 left-[12%] right-[12%] h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />

            <div className="relative px-3 h-14 flex items-center justify-between">
              {/* Left side - App Name */}
              <div className="flex items-center gap-3 relative">
                {/* Logo */}
                <a
                  href="/"
                  className="group flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
                    <img 
                      src="/favicon.svg" 
                      alt="TrackExpense" 
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-[13px] uppercase tracking-[0.28em] text-white/50">Track</span>
                    <span className="text-[15px] font-semibold tracking-wide text-white">Expense</span>
                  </div>
                </a>
              </div>

              {/* Actions - only show when logged in */}
              {showIcons && (
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-2 py-1.5">
                  {/* Search Button */}
                  <button
                    className="group relative p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all duration-300"
                    onClick={onSearchClick}
                    aria-label="Search people"
                  >
                    <Search size={16} className="text-white/60 group-hover:text-white/90 transition-colors" />
                  </button>

                  {/* Notification Button */}
                  <button
                    className="group relative p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all duration-300"
                    onClick={onNotificationClick}
                    aria-label="View notifications"
                  >
                    <Heart
                      size={16}
                      className="text-[#ff2d55] group-hover:text-[#ff5b7a] transition-colors"
                      fill="currentColor"
                    />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 rounded-full bg-[#ff2d55] text-white text-[10px] font-semibold flex items-center justify-center ring-1 ring-black/50">
                        {notificationCount}
                      </span>
                    )}
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;