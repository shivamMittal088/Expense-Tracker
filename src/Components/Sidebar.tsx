import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Calculator as CalculatorIcon, FileDown, TrendingUp, Settings, User, PlusCircle } from "lucide-react";
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
    { icon: PlusCircle, label: "Add Expense", color: "bg-emerald-500/20", iconColor: "text-emerald-400", action: "addExpense" },
    { icon: CalculatorIcon, label: "Calculator", color: "bg-orange-500/20", iconColor: "text-orange-400", action: "calculator" },
    { icon: FileDown, label: "Download PDF", color: "bg-blue-500/20", iconColor: "text-blue-400", action: "pdf" },
    { icon: TrendingUp, label: "Analytics", color: "bg-purple-500/20", iconColor: "text-purple-400", href: "/analytics" },
    { icon: User, label: "Profile", color: "bg-pink-500/20", iconColor: "text-pink-400", href: "/profile" },
    { icon: Settings, label: "Settings", color: "bg-gray-500/20", iconColor: "text-gray-400", href: "/settings" },
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
      {/* Dropdown Menu */}
      <div 
        ref={menuRef}
        className={`absolute top-12 left-0 w-52 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-200 origin-top-left z-50 ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="py-2">
          {menuItems.map((item, index) => (
            item.href ? (
              <Link
                key={index}
                to={item.href}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/5 transition-colors group"
                onClick={onClose}
              >
                <div className={`p-2 rounded-lg ${item.color} group-hover:brightness-125 transition-all`}>
                  <item.icon size={16} className={item.iconColor} />
                </div>
                <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </Link>
            ) : (
              <button
                key={index}
                onClick={() => handleMenuAction(item)}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/5 transition-colors group"
              >
                <div className={`p-2 rounded-lg ${item.color} group-hover:brightness-125 transition-all`}>
                  <item.icon size={16} className={item.iconColor} />
                </div>
                <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </button>
            )
          ))}
        </div>
      </div>

      {/* Calculator Modal */}
      <Calculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />

      {/* Add Expense Modal */}
      <AddExpenseModal open={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} />
    </>
  );
};

export default Sidebar;
