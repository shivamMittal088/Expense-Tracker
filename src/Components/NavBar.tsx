import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import Sidebar from "./Sidebar";

const NavBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  // Check if user is logged in
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(loggedIn === "true");
  }, [location.pathname]);

  // Don't show icons on login page
  const isLoginPage = location.pathname === "/login";
  const showIcons = isLoggedIn && !isLoginPage;

  return (
    <>
      <nav className="border-b border-white/5 bg-black sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left side - Animated Menu Button + App Name */}
          <div className="flex items-center gap-3 relative">
            {/* Animated Hamburger Button - only show when logged in */}
            {showIcons && (
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="relative w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
                aria-label="Toggle menu"
              >
                <div className="w-5 h-4 flex flex-col justify-between items-center">
                  <span 
                    className={`block h-0.5 bg-white/70 rounded-full transition-all duration-300 origin-center ${
                      isMenuOpen ? 'w-5 rotate-45 translate-y-[7px]' : 'w-5'
                    }`} 
                  />
                  <span 
                    className={`block h-0.5 bg-white/70 rounded-full transition-all duration-300 ${
                      isMenuOpen ? 'w-0 opacity-0' : 'w-3.5'
                    }`} 
                  />
                  <span 
                    className={`block h-0.5 bg-white/70 rounded-full transition-all duration-300 origin-center ${
                      isMenuOpen ? 'w-5 -rotate-45 -translate-y-[7px]' : 'w-4'
                    }`} 
                  />
                </div>
              </button>
            )}

            {/* Sidebar Component */}
            <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            
            <a
              href="/"
              className="font-brand text-lg font-bold tracking-wide bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
            >
              Track-Expense
            </a>
          </div>

          {/* Actions - only show when logged in */}
          {showIcons && (
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70">
                <Search size={18} />
              </button>

              <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 relative transition-colors text-white/70">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-black" />
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default NavBar;