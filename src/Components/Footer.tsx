import type { FC } from "react";
import { lazy, Suspense } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, BarChart3, User, List, Plus, Calculator as CalculatorIcon, FileDown, FileSpreadsheet, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
const AddExpenseModal = lazy(() => import("./AddExpenseModal"));
import Api from "../routeWrapper/Api";
const Calculator = lazy(() =>
  import("../utils/UI/Calculator").then((module) => ({
    default: module.Calculator,
  }))
);

const Footer: FC = () => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await Api.post("/api/auth/logout");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("authToken");
      navigate("/login");
    } catch {
      alert("Failed to logout. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {isToolsOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsToolsOpen(false)}
        />
      )}

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
              onClick={() => setIsToolsOpen((prev) => !prev)}
              className="bg-white text-black rounded-xl w-10 h-10 flex items-center justify-center shadow-lg shadow-black/60 transition-all hover:scale-105 active:scale-95"
              aria-label="Open tools"
            >
              <Plus size={20} strokeWidth={2.5} className={`transition-transform ${isToolsOpen ? "rotate-45" : "rotate-0"}`} />
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

      {isToolsOpen && (
        <div className="fixed bottom-22 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-sm">
          <div className="rounded-2xl border border-white/15 bg-white/6 backdrop-blur-xl p-3 shadow-2xl">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  setShowAddExpense(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-3 py-2 text-[11px] text-white/80 hover:bg-white/8 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Plus size={14} className="text-white/80" />
                </span>
                Add Expense
              </button>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  setIsCalculatorOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-3 py-2 text-[11px] text-white/80 hover:bg-white/8 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <CalculatorIcon size={14} className="text-white/80" />
                </span>
                Calculator
              </button>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  alert("PDF download coming soon!");
                }}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-3 py-2 text-[11px] text-white/80 hover:bg-white/8 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileDown size={14} className="text-white/80" />
                </span>
                PDF Report
              </button>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  alert("Excel export coming soon!");
                }}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-3 py-2 text-[11px] text-white/80 hover:bg-white/8 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileSpreadsheet size={14} className="text-white/80" />
                </span>
                Export Excel
              </button>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  navigate("/settings");
                }}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-3 py-2 text-[11px] text-white/80 hover:bg-white/8 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Settings size={14} className="text-white/80" />
                </span>
                Settings
              </button>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300 hover:bg-red-500/20 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <LogOut size={14} className="text-red-300" />
                </span>
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Suspense
        fallback={(
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-300/25 border-t-emerald-300 animate-spin shadow-[0_0_14px_rgba(52,211,153,0.35)]" />
          </div>
        )}
      >
        <AddExpenseModal
          open={showAddExpense}
          onClose={() => setShowAddExpense(false)}
        />
      </Suspense>

      <Suspense
        fallback={(
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-300/25 border-t-emerald-300 animate-spin shadow-[0_0_14px_rgba(52,211,153,0.35)]" />
          </div>
        )}
      >
        <Calculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
      </Suspense>
    </>
  );
};

export default Footer;
