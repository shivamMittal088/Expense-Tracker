import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator as CalculatorIcon, FileDown, FileSpreadsheet, Settings, X, ChevronRight, LogOut } from "lucide-react";
import { Calculator } from "../utils/UI/Calculator";
import api from "../routeWrapper/Api";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isCalculatorOpen, setIsCalculatorOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { icon: CalculatorIcon, label: "Calculator", description: "Quick calculations", action: "calculator" },
    { icon: FileDown, label: "Download PDF", description: "Export as PDF report", action: "pdf" },
    { icon: FileSpreadsheet, label: "Export to Excel", description: "Download spreadsheet", action: "excel" },
    { icon: Settings, label: "Settings", description: "Manage preferences", action: "settings" },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleMenuAction = (item: typeof menuItems[0]) => {
    onClose();
    if (item.action === "calculator") {
      setIsCalculatorOpen(true);
    } else if (item.action === "pdf") {
      alert("PDF download coming soon!");
    } else if (item.action === "excel") {
      alert("Excel export coming soon!");
    } else if (item.action === "settings") {
      navigate("/settings");
    }
  };

  const handleLogout = useCallback(async () => {
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
  }, [navigate]);

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className={`fixed inset-0 z-40 transition-all duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        style={{
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* Sidebar Menu */}
      <div 
        ref={menuRef}
        className={`fixed top-0 left-0 h-[100dvh] w-[72vw] max-w-[240px] z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen 
            ? 'translate-x-0 opacity-100 pointer-events-auto' 
            : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Pure black background */}
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-white/[0.02]" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        
        {/* Subtle corner glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/[0.03] rounded-full blur-[60px] pointer-events-none" />

        {/* Content */}
        <div className="relative h-full flex flex-col">
          
          {/* Header */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10">
                    <span className="text-black font-bold text-lg">₹</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-white font-bold text-base tracking-tight">Expense Tracker</h2>
                  <p className="text-white/40 text-[10px] font-medium">Smart money management</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all group"
              >
                <X size={14} className="text-white/50 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-white/10" />

          {/* Menu Items */}
          <div className="flex-1 py-4 px-3 overflow-y-auto pb-20">
            <p className="px-2 text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3">Tools</p>
            <div className="space-y-0.5">
              {menuItems.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => handleMenuAction(item)}
                  className="group relative flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden"
                  style={{
                    animation: isOpen ? `slideIn 0.5s ease-out ${index * 0.06}s both` : 'none'
                  }}
                >
                  {/* Hover background */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.05] transition-all duration-300 rounded-xl" />
                  
                  {/* Left accent bar on hover */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 group-hover:h-6 bg-white rounded-full transition-all duration-300" />
                  
                  {/* Icon */}
                  <div className="relative">
                    <div className="relative p-2 rounded-lg bg-white/10 group-hover:bg-white group-hover:scale-105 transition-all duration-300">
                      <item.icon size={16} className="text-white/70 group-hover:text-black transition-colors duration-300" strokeWidth={2} />
                    </div>
                  </div>
                  
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-all duration-300">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-white/30 group-hover:text-white/50 transition-all duration-300 truncate">
                      {item.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <ChevronRight size={14} className="text-white/50" />
                  </div>
                </div>
              ))}
            </div>

            {/* Logout Button */}
            <div className="mt-4">
              <p className="px-2 text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3">Account</p>
              <div 
                onClick={() => !isLoggingOut && handleLogout()}
                className={`group relative flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${isLoggingOut ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Hover background */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-red-500/10 transition-all duration-300 rounded-xl" />
                
                {/* Left accent bar on hover */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 group-hover:h-6 bg-red-500 rounded-full transition-all duration-300" />
                
                {/* Icon */}
                <div className="relative">
                  <div className="relative p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500 group-hover:scale-105 transition-all duration-300">
                    <LogOut size={16} className="text-red-400 group-hover:text-white transition-colors duration-300" strokeWidth={2} />
                  </div>
                </div>
                
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-red-400/80 group-hover:text-red-400 transition-all duration-300">
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </p>
                  <p className="text-[10px] text-white/30 group-hover:text-white/50 transition-all duration-300 truncate">
                    Sign out of your account
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <ChevronRight size={14} className="text-red-400/50" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Calculator Modal */}
      <Calculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />

    </>
  );
};

export default Sidebar;
