import type { FC } from "react";
import { NavLink } from "react-router-dom";
import { Home, BarChart3, User, Settings } from "lucide-react";

const Footer: FC = () => {
  const linkBase =
    "flex flex-col items-center gap-1 text-xs transition-colors";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700">
      <div className="max-w-5xl mx-auto h-14 flex items-center justify-center gap-8">
        
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "text-white" : "text-gray-400"}`
          }
        >
          <Home size={18} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "text-white" : "text-gray-400"}`
          }
        >
          <BarChart3 size={18} />
          <span>Analytics</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "text-white" : "text-gray-400"}`
          }
        >
          <User size={18} />
          <span>Profile</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "text-white" : "text-gray-400"}`
          }
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>

      </div>
    </nav>
  );
};

export default Footer;
