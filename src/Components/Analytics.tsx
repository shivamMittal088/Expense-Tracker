import { useState, useRef, useEffect } from "react";
import { Calendar, CreditCard, Tag, IndianRupee, X} from "lucide-react";
import type{ LucideIcon } from "lucide-react";

type DropdownType = "date" | "payment" | "category" | "amount" | null;

// Moved outside to prevent recreation on each render
const FilterButton = ({
  icon: Icon,
  label,
  value,
  isActive,
  isOpen,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
      isActive
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        : "bg-zinc-800/60 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/60"
    } ${isOpen ? "ring-2 ring-emerald-500/50" : ""}`}
  >
    <Icon size={15} />
    <span className="text-zinc-500">{label}:</span>
    <span className="font-medium">{value}</span>
  </button>
);

const Analytics = () => {
  const [dateRange, setDateRange] = useState<"week" | "month" | "year" | "all">("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health"];
  const paymentModes = ["all", "cash", "card", "UPI", "bank_transfer", "wallet"];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDateLabel = () => {
    if (dateRange === "all") return "All Time";
    if (dateRange === "week") return "This Week";
    if (dateRange === "month") return "This Month";
    return "This Year";
  };

  const getPaymentLabel = () => {
    if (paymentMode === "all") return "All Modes";
    return paymentMode === "bank_transfer" ? "Bank" : paymentMode.toUpperCase();
  };

  const getCategoryLabel = () => {
    if (selectedCategories.length === 0) return "All";
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length} selected`;
  };

  const getAmountLabel = () => {
    if (!minAmount && !maxAmount) return "Any";
    if (minAmount && maxAmount) return `₹${minAmount}-${maxAmount}`;
    if (minAmount) return `₹${minAmount}+`;
    return `Up to ₹${maxAmount}`;
  };

  const hasActiveFilters = dateRange !== "all" || paymentMode !== "all" || selectedCategories.length > 0 || minAmount || maxAmount;

  const clearAllFilters = () => {
    setDateRange("all");
    setPaymentMode("all");
    setSelectedCategories([]);
    setMinAmount("");
    setMaxAmount("");
  };

  const toggleDropdown = (type: DropdownType) => {
    setOpenDropdown(openDropdown === type ? null : type);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">Analytics</h1>

      {/* Filter Bar */}
      <div className="relative mb-6" ref={dropdownRef}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <FilterButton
            icon={Calendar}
            label="Period"
            value={getDateLabel()}
            isActive={dateRange !== "all"}
            isOpen={openDropdown === "date"}
            onClick={() => toggleDropdown("date")}
          />
          <FilterButton
            icon={CreditCard}
            label="Payment"
            value={getPaymentLabel()}
            isActive={paymentMode !== "all"}
            isOpen={openDropdown === "payment"}
            onClick={() => toggleDropdown("payment")}
          />
          <FilterButton
            icon={Tag}
            label="Category"
            value={getCategoryLabel()}
            isActive={selectedCategories.length > 0}
            isOpen={openDropdown === "category"}
            onClick={() => toggleDropdown("category")}
          />
          <FilterButton
            icon={IndianRupee}
            label="Amount"
            value={getAmountLabel()}
            isActive={!!(minAmount || maxAmount)}
            isOpen={openDropdown === "amount"}
            onClick={() => toggleDropdown("amount")}
          />

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-zinc-500 hover:text-red-400 transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        {/* Dropdown Panels */}
        {openDropdown === "date" && (
          <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl p-2 shadow-xl z-50 min-w-[160px]">
            {(["all", "week", "month", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setDateRange(range);
                  setOpenDropdown(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  dateRange === range
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {range === "all" ? "All Time" : range === "week" ? "This Week" : range === "month" ? "This Month" : "This Year"}
              </button>
            ))}
          </div>
        )}

        {openDropdown === "payment" && (
          <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl p-2 shadow-xl z-50 min-w-[180px]">
            {paymentModes.map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setPaymentMode(mode);
                  setOpenDropdown(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  paymentMode === mode
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {mode === "all" ? "All Modes" : mode === "bank_transfer" ? "Bank Transfer" : mode.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {openDropdown === "category" && (
          <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl z-50 min-w-[220px]">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategories((prev) =>
                      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedCategories.includes(cat)
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="mt-3 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear selection
              </button>
            )}
          </div>
        )}

        {openDropdown === "amount" && (
          <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-xl z-50 min-w-[240px]">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-zinc-500 mb-1 block">Min</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg pl-7 pr-3 py-2 text-sm border border-zinc-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <span className="text-zinc-600 mt-5">–</span>
              <div className="flex-1">
                <label className="text-xs text-zinc-500 mb-1 block">Max</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="Any"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg pl-7 pr-3 py-2 text-sm border border-zinc-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpenDropdown(null)}
              className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Placeholder for Analytics Content */}
      <div className="bg-zinc-900/50 rounded-2xl p-12 border border-zinc-800 text-center">
        <p className="text-zinc-500">Analytics charts and data will appear here</p>
      </div>
    </div>
  );
};

export default Analytics;