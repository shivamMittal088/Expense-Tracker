import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Menu, X, Home, TrendingUp, PieChart, Settings, CreditCard, FileText, User } from "lucide-react";

const NavBar: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: CreditCard, label: "Expenses", href: "/" },
    { icon: TrendingUp, label: "Analytics", href: "/analytics" },
    { icon: PieChart, label: "Budget", href: "/" },
    { icon: FileText, label: "Reports", href: "/" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-700 relative z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between text-white">
          {/* Left side - Menu + App Name */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            
            <a
              href="/"
              className="font-brand text-lg font-semibold tracking-wide hover:text-blue-400 transition-colors"
            >
              Track-Expense
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded hover:bg-gray-800 transition-colors">
              <Search size={18} />
            </button>

            <button className="p-2 rounded hover:bg-gray-800 relative transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg">Menu</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 group"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon 
                    size={20} 
                    className="text-gray-500 group-hover:text-blue-500 transition-colors" 
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Total Balance</p>
            <p className="text-xl font-bold text-white">₹12,345.00</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default NavBar;