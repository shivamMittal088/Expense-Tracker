import { useState, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Calculator as CalculatorIcon, FileDown, FileSpreadsheet, Settings, LogOut } from "lucide-react";
const Calculator = lazy(() =>
  import("../utils/UI/Calculator").then((module) => ({
    default: module.Calculator,
  }))
);
import api from "../routeWrapper/Api";

const FloatingActionMenu = () => {
  const [open, setOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const isLoginPage = location.pathname === "/login";
  if (!isLoggedIn || isLoginPage) return null;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.post("/api/auth/logout");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("authToken");
      navigate("/login");
    } catch {
      alert("Failed to logout. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const handleAction = (action: string) => {
    setOpen(false);
    if (action === "calculator") {
      setIsCalculatorOpen(true);
      return;
    }
    if (action === "pdf") {
      alert("PDF download coming soon!");
      return;
    }
    if (action === "excel") {
      alert("Excel export coming soon!");
      return;
    }
    if (action === "settings") {
      navigate("/settings");
      return;
    }
    if (action === "logout") {
      handleLogout();
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed right-4 top-20 z-50 flex flex-col items-end">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl shadow-black/40 transition-transform hover:scale-105"
          aria-label="Open tools"
        >
          <Plus size={20} strokeWidth={2.5} className={`transition-transform ${open ? "rotate-45" : "rotate-0"}`} />
        </button>

        <div className={`flex flex-col items-end gap-2 mt-3 transition-all ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <button
            onClick={() => handleAction("calculator")}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] text-white/80 hover:bg-white/15 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <CalculatorIcon size={16} className="text-white/80" />
            </span>
            Calculator
          </button>
          <button
            onClick={() => handleAction("pdf")}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] text-white/80 hover:bg-white/15 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <FileDown size={16} className="text-white/80" />
            </span>
            Download PDF
          </button>
          <button
            onClick={() => handleAction("excel")}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] text-white/80 hover:bg-white/15 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <FileSpreadsheet size={16} className="text-white/80" />
            </span>
            Export Excel
          </button>
          <button
            onClick={() => handleAction("settings")}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] text-white/80 hover:bg-white/15 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Settings size={16} className="text-white/80" />
            </span>
            Settings
          </button>
          <button
            onClick={() => handleAction("logout")}
            className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-300 hover:bg-red-500/20 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <LogOut size={16} className="text-red-300" />
            </span>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>

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

export default FloatingActionMenu;
