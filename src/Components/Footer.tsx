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

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const fetchProfilePhoto = () => {
      Api.get("/api/profile/view")
        .then((response) => {
          setProfilePhotoUrl(getFullPhotoURL(response.data?.photoURL));
        })
        .catch(() => {
          setProfilePhotoUrl(null);
        });
    };

    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (browserWindow.requestIdleCallback) {
      idleId = browserWindow.requestIdleCallback(() => {
        fetchProfilePhoto();
      }, { timeout: 3500 });
    } else {
      timeoutId = setTimeout(() => {
        fetchProfilePhoto();
      }, 2000);
    }

    return () => {
      if (idleId !== null) {
        browserWindow.cancelIdleCallback?.(idleId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
          onClick={() => setIsToolsOpen(false)}
        />
      )}

      {/* Floating Pill Navigation */}
      <nav className={`fixed bottom-2 left-3 right-3 z-50 transition-all duration-300 pb-[max(env(safe-area-inset-bottom),0.25rem)] ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}>
        <div className="max-w-sm mx-auto">
          <div className="bg-zinc-950/95 border border-zinc-700 rounded-2xl px-1.5 py-1.5 flex items-center justify-between shadow-2xl shadow-black/80 backdrop-blur-xl">
            
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 ${
                  isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`
              }
            >
              <Home size={16} />
              <span className="text-[10px] font-medium">Home</span>
            </NavLink>

            <NavLink 
              to="/analytics" 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 ${
                  isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`
              }
            >
              <BarChart3 size={16} />
              <span className="text-[10px] font-medium">Analytics</span>
            </NavLink>

            {/* Floating Add Button */}
            <button
              onClick={() => setIsToolsOpen((prev) => !prev)}
              className={`rounded-xl w-11 h-11 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-92 ${
                isToolsOpen
                  ? "bg-zinc-100 text-black shadow-white/20 ring-2 ring-white/35"
                  : "bg-white text-black shadow-black/60"
              }`}
              aria-label="Open tools"
            >
              <Plus size={20} strokeWidth={2.5} className={`transition-transform ${isToolsOpen ? "rotate-45" : "rotate-0"}`} />
            </button>

            <NavLink 
              to="/profile" 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 ${
                  isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
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
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 ${
                  isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
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
            onExcel={() => {
              setIsToolsOpen(false);
              navigate("/exports");
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
