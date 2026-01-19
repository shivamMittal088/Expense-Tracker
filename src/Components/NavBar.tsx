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
      <nav className="border-b transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
          {/* Left side - Menu + App Name */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            
            <a
              href="/"
              className="font-brand text-lg font-semibold tracking-wide transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Track-Expense
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <Search size={18} />
            </button>

            <button className="p-2 rounded relative transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
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
        className={`fixed top-0 left-0 h-full w-72 border-r z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Menu</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
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
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon 
                    size={20} 
                    className="transition-colors" 
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Balance</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>₹12,345.00</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default NavBar;