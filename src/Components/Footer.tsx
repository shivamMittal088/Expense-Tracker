import type { FC } from "react";
import { NavLink } from "react-router-dom";
import { Home, BarChart3, User, List, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import AddExpenseModal from "./AddExpenseModal";
import Api from "../routeWrapper/Api";

const Footer: FC = () => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  const getFullPhotoURL = (photoURL?: string) => {
    if (!photoURL) return null;
    if (photoURL.startsWith("http://") || photoURL.startsWith("https://")) {
      return photoURL;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    return `${baseUrl}${photoURL}`;
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show footer when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      return;
    }

    Api.get("/api/profile/view")
      .then(({ data }) => {
        setProfilePhotoUrl(getFullPhotoURL(data?.photoURL));
      })
      .catch(() => {
        setProfilePhotoUrl(null);
      });
  }, []);

  return (
    <>
      {/* Floating Pill Navigation */}
      <nav className={`fixed bottom-3 left-3 right-3 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}>
        <div className="max-w-sm mx-auto">
          <div className="bg-[#0a0a0a] border border-white/20 rounded-2xl px-1.5 py-1.5 flex items-center justify-between shadow-2xl shadow-black/80 backdrop-blur-xl">
            
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              <Home size={16} />
              <span className="text-[10px] font-medium">Home</span>
            </NavLink>

            <NavLink 
              to="/analytics" 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              <BarChart3 size={16} />
              <span className="text-[10px] font-medium">Analytics</span>
            </NavLink>

            {/* Floating Add Button */}
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl w-10 h-10 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>

            <NavLink 
              to="/profile" 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="Profile"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <User size={16} />
              )}
              <span className="text-[10px] font-medium">Profile</span>
            </NavLink>

            <NavLink 
              to="/transactions" 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              <List size={16} />
              <span className="text-[10px] font-medium">Transactions</span>
            </NavLink>

          </div>
        </div>
      </nav>

      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
      />
    </>
  );
};

export default Footer;
