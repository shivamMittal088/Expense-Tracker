import type { FC } from "react";
import { NavLink } from "react-router-dom";
import { Home, BarChart3, User, Settings, Plus } from "lucide-react";
import { useState } from "react";
import AddExpenseModal from "./AddExpenseModal";

const Footer: FC = () => {
  const [showAddExpense, setShowAddExpense] = useState(false);

  return (
    <>
      {/* Floating Pill Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 z-50">
        <div className="max-w-md mx-auto">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl px-2 py-2 flex items-center justify-between shadow-2xl shadow-black/80 backdrop-blur-xl">
            
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              <Home size={20} />
              <span className="text-[10px] font-medium">Home</span>
            </NavLink>

            <NavLink 
              to="/analytics" 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              <BarChart3 size={20} />
              <span className="text-[10px] font-medium">Analytics</span>
            </NavLink>

            {/* Floating Add Button */}
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>

            <NavLink 
              to="/profile" 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              <User size={20} />
              <span className="text-[10px] font-medium">Profile</span>
            </NavLink>

            <NavLink 
              to="/settings" 
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              <Settings size={20} />
              <span className="text-[10px] font-medium">Settings</span>
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
