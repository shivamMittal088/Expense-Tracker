import type { FC } from "react";
import { NavLink } from "react-router-dom";
import { Home, BarChart3, User, Settings, Plus } from "lucide-react";
import { useState } from "react";
import AddExpenseModal from "./AddExpenseModal";

const Footer: FC = () => {
  const [showAddExpense, setShowAddExpense] = useState(false);

  const linkBase =
    "flex flex-col items-center gap-1 text-xs transition-colors";

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="relative max-w-md mx-auto h-16 flex items-center justify-center">
          <div className="flex items-center gap-6">

            <NavLink to="/" end className={({ isActive }) =>
              `${linkBase} ${isActive ? "" : ""}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' })}>
              <Home size={18} />
              <span>Home</span>
            </NavLink>

            <NavLink to="/analytics" className={({ isActive }) =>
              `${linkBase} ${isActive ? "" : ""}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' })}>
              <BarChart3 size={18} />
              <span>Analytics</span>
            </NavLink>

            {/* + Button */}
            <button
              onClick={() => setShowAddExpense(true)}
              className="-mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg border-4"
              style={{ borderColor: 'var(--bg-secondary)' }}
            >
              <Plus size={28} />
            </button>

            <NavLink to="/profile" className={({ isActive }) =>
              `${linkBase} ${isActive ? "" : ""}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' })}>
              <User size={18} />
              <span>Profile</span>
            </NavLink>

            <NavLink to="/settings" className={({ isActive }) =>
              `${linkBase} ${isActive ? "" : ""}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' })}>
              <Settings size={18} />
              <span>Settings</span>
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
