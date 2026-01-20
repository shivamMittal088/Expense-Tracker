import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Calculator as CalculatorIcon, FileDown, TrendingUp, Settings, User, PlusCircle, X, ChevronRight } from "lucide-react";
import { Calculator } from "../utils/UI/Calculator";
import AddExpenseModal from "./AddExpenseModal";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [isCalculatorOpen, setIsCalculatorOpen] = React.useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { icon: PlusCircle, label: "Add Expense", description: "Track new spending", action: "addExpense" },
    { icon: CalculatorIcon, label: "Calculator", description: "Quick calculations", action: "calculator" },
    { icon: FileDown, label: "Download PDF", description: "Export reports", action: "pdf" },
    { icon: TrendingUp, label: "Analytics", description: "View insights", href: "/analytics" },
    { icon: User, label: "Profile", description: "Your account", href: "/profile" },
    { icon: Settings, label: "Settings", description: "Preferences", href: "/settings" },
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
    } else if (item.action === "addExpense") {
      setIsAddExpenseOpen(true);
    } else if (item.action === "pdf") {
      alert("PDF download coming soon!");
    }
  };

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
        className={`fixed top-0 left-0 h-full w-80 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen 
            ? 'translate-x-0' 
            : '-translate-x-full'
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
          <div className="px-5 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Logo */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-white/10">
                    <span className="text-black font-bold text-xl">₹</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg tracking-tight">Expense Tracker</h2>
                  <p className="text-white/40 text-xs font-medium">Smart money management</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
              >
                <X size={16} className="text-white/50 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-white/10" />

          {/* Menu Items */}
          <div className="flex-1 py-6 px-4 overflow-y-auto">
            <p className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Navigation</p>
            <div className="space-y-1">
              {menuItems.map((item, index) => {
                const content = (
                  <div 
                    className="group relative flex items-center gap-4 w-full px-3 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                    style={{
                      animation: isOpen ? `slideIn 0.5s ease-out ${index * 0.06}s both` : 'none'
                    }}
                  >
                    {/* Hover background */}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.05] transition-all duration-300 rounded-2xl" />
                    
                    {/* Left accent bar on hover */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 group-hover:h-8 bg-white rounded-full transition-all duration-300" />
                    
                    {/* Icon */}
                    <div className="relative">
                      <div className="relative p-2.5 rounded-xl bg-white/10 group-hover:bg-white group-hover:scale-105 transition-all duration-300">
                        <item.icon size={18} className="text-white/70 group-hover:text-black transition-colors duration-300" strokeWidth={2} />
                      </div>
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-white/70 group-hover:text-white transition-all duration-300">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-white/30 group-hover:text-white/50 transition-all duration-300 truncate">
                        {item.description}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <ChevronRight size={16} className="text-white/50" />
                    </div>
                  </div>
                );

                return item.href ? (
                  <Link key={index} to={item.href} onClick={onClose}>
                    {content}
                  </Link>
                ) : (
                  <div key={index} onClick={() => handleMenuAction(item)}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Premium Footer */}
          <div className="px-5 py-5">
            {/* Pro Badge Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black text-sm font-bold shadow-lg shadow-white/10">
                  U
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/90">Premium User</p>
                  <p className="text-[10px] text-white/40">Version 1.0.0</p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white shadow-lg">
                  <span className="text-[10px] font-bold text-black uppercase tracking-wider">Pro</span>
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

      {/* Add Expense Modal */}
      <AddExpenseModal open={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} />
    </>
  );
};

export default Sidebar;
