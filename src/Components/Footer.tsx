import type { FC } from "react";
import { lazy, Suspense } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, BarChart3, List, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
const AddExpenseModal = lazy(() => import("./AddExpenseModal"));
const FooterToolsPanel = lazy(() => import("./FooterToolsPanel"));
const FooterProfileIcon = lazy(() =>
  import("./FooterLazyIcons").then((module) => ({ default: module.FooterProfileIcon }))
);
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
  const lastScrollYRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);
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
    const scrollContainer = document.getElementById("app-scroll-container");
    const scrollTarget: HTMLElement | Window = scrollContainer || window;

    const getCurrentScrollY = () => {
      if (scrollTarget instanceof HTMLElement) {
        return scrollTarget.scrollTop;
      }
      return window.scrollY;
    };

    const handleScroll = () => {
      if (scrollRafRef.current !== null) {
        return;
      }

      scrollRafRef.current = window.requestAnimationFrame(() => {
        const currentScrollY = getCurrentScrollY();
        const previousScrollY = lastScrollYRef.current;

        setIsVisible((prevIsVisible) => {
          if (currentScrollY < previousScrollY || currentScrollY < 50) {
            return true;
          }
          if (currentScrollY > previousScrollY && currentScrollY > 50) {
            return false;
          }
          return prevIsVisible;
        });

        lastScrollYRef.current = currentScrollY;
        scrollRafRef.current = null;
      });
    };

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    // Sync baseline when component mounts
    lastScrollYRef.current = getCurrentScrollY();

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

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
                  loading="lazy"
                  decoding="async"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <Suspense fallback={<span className="w-4 h-4" aria-hidden="true" />}>
                  <FooterProfileIcon />
                </Suspense>
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
        <Suspense fallback={null}>
          <FooterToolsPanel
            isLoggingOut={isLoggingOut}
            onAddExpense={() => {
              setIsToolsOpen(false);
              setShowAddExpense(true);
            }}
            onCalculator={() => {
              setIsToolsOpen(false);
              setIsCalculatorOpen(true);
            }}
            onPdf={() => {
              setIsToolsOpen(false);
              alert("PDF download coming soon!");
            }}
            onExcel={() => {
              setIsToolsOpen(false);
              alert("Excel export coming soon!");
            }}
            onSettings={() => {
              setIsToolsOpen(false);
              navigate("/settings");
            }}
            onLogout={() => {
              setIsToolsOpen(false);
              handleLogout();
            }}
          />
        </Suspense>
      )}

      {showAddExpense && (
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
      )}

      {isCalculatorOpen && (
        <Suspense
          fallback={(
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-300/25 border-t-emerald-300 animate-spin shadow-[0_0_14px_rgba(52,211,153,0.35)]" />
            </div>
          )}
        >
          <Calculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default Footer;
