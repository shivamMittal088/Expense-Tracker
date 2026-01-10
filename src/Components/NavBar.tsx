import { Search, Bell } from "lucide-react";

const Navbar:React.FC = ()=> {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between text-white">
        
        {/* App Name */}
        <h1 className="font-brand text-lg font-semibold tracking-wide">
          Track-Expense
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-800"
          >
            <Search size={18} />
          </button>

          <button
            type="button"
            className="p-2 rounded hover:bg-gray-800 relative"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
