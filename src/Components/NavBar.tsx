import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Heart } from "lucide-react";
import Sidebar from "./Sidebar";

interface NavBarProps {
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  notificationCount?: number;
}

const NavBar: React.FC<NavBarProps> = ({ onSearchClick, onNotificationClick, notificationCount = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Check if user is logged in - read directly from localStorage each render
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // Don't show icons on login page
  const isLoginPage = location.pathname === "/login";
  const showIcons = isLoggedIn && !isLoginPage;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl">
        {/* Subtle gradient line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Very subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="max-w-5xl mx-auto px-4 h-14 relative flex items-center justify-between">
          {/* Left side - Animated Menu Button + App Name */}
          <div className="flex items-center gap-3 relative">
            {/* Animated Hamburger Button - only show when logged in */}
            {showIcons && (
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="group relative w-9 h-9 rounded-lg bg-white/3 hover:bg-white/8 border border-white/20 hover:border-white/30 transition-all duration-300 flex items-center justify-center"
                aria-label="Toggle menu"
              >
                <div className="w-4 h-3.5 flex flex-col justify-between items-center">
                  <span 
                    className={`block h-[1.5px] bg-white/60 group-hover:bg-white/90 rounded-full transition-all duration-300 origin-center ${
                      isMenuOpen ? 'w-4 rotate-45 translate-y-1.25' : 'w-4'
                    }`} 
                  />
                  <span 
                    className={`block h-[1.5px] bg-white/60 group-hover:bg-white/90 rounded-full transition-all duration-300 ${
                      isMenuOpen ? 'w-0 opacity-0' : 'w-3'
                    }`} 
                  />
                  <span 
                    className={`block h-[1.5px] bg-white/60 group-hover:bg-white/90 rounded-full transition-all duration-300 origin-center ${
                      isMenuOpen ? 'w-4 -rotate-45 -translate-y-1.25' : 'w-3.5'
                    }`} 
                  />
                </div>
              </button>
            )}

            {/* Sidebar Component */}
            <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            
            {/* Premium Logo */}
            <a
              href="/"
              className="group flex items-center gap-2"
            >
              {/* Favicon Logo */}
              <img 
                src="/favicon.svg" 
                alt="TrackExpense" 
                className="w-8 h-8"
              />
              
              {/* Brand Name */}
              <span className="text-[15px] font-semibold tracking-wide text-white/90">
                Track<span className="text-white/50">Expense</span>
              </span>
            </a>
          </div>

          {/* Actions - only show when logged in */}
          {showIcons && (
            <div className="flex items-center gap-1.5 md:absolute md:left-1/2 md:-translate-x-1/2">
              {/* Search Button */}
              <button
                className="group relative p-2 rounded-lg bg-white/3 hover:bg-white/8 border border-white/20 hover:border-white/30 transition-all duration-300"
                onClick={onSearchClick}
                aria-label="Search people"
              >
                <Search size={16} className="text-white/60 group-hover:text-white/90 transition-colors" />
              </button>

              {/* Notification Button */}
              <button
                className="group relative p-2 rounded-lg bg-white/3 hover:bg-white/8 border border-white/20 hover:border-white/30 transition-all duration-300"
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
      </nav>
    </>
  );
};

export default NavBar;