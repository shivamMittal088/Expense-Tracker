import { useState, useRef, useEffect } from "react";
import { Calendar, CreditCard, Tag, IndianRupee, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import api from "../routeWrapper/Api";

type DropdownType = "date" | "payment" | "category" | "amount" | null;

type Expense = {
  _id: string;
  amount: number;
  category: {
    name: string;
    color: string;
    emoji?: string;
  };
  notes?: string;
  occurredAt: string;
  payment_mode: string;
  deleted?: boolean;
  currency?: string;
};

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
    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
      isActive
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        : "bg-theme-bg-button/60 text-theme-text-secondary border border-theme-border-subtle/50 hover:bg-theme-bg-button-hover/60"
    } ${isOpen ? "ring-1 ring-emerald-500/50" : ""}`}
  >
    <Icon size={12} />
    <span className="text-theme-text-muted">{label}:</span>
    <span className="font-medium">{value}</span>
  </button>
);

const ITEMS_PER_PAGE = 15;
// const MIN_RECURRING_COUNT = 4; // Must occur at least 4 times
// const MIN_INCOME_PERCENTAGE = 0.5; // Must be at least 0.5% of income

const Analytics = () => {
  const [dateRange, setDateRange] = useState<"week" | "month" | "year" | "all">("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // NEW: State for expenses
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic categories extracted from user's expenses
  const categories = [...new Map(
    allExpenses.map((e) => [e.category.name, { name: e.category.name, emoji: e.category.emoji }])
  ).values()];

  const paymentModes = ["cash", "card", "UPI", "bank_transfer", "wallet"];

  // NEW: Fetch expenses on mount
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        
        // Fetch last 30 days of expenses
        const today = new Date();
        const promises = [];
        
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
          promises.push(api.get(`/api/expense/${dateStr}`));
        }
        
        const responses = await Promise.all(promises);
        const allData = responses.flatMap((res) => res.data?.data || []);
        
        // Filter out deleted expenses
        const activeExpenses = allData.filter((e: Expense) => !e.deleted);
        setAllExpenses(activeExpenses);
        
        console.log("Fetched expenses:", activeExpenses.length);
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

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

  // ============================================
  // Filter expenses by all criteria
  // ============================================
  const filteredExpenses = allExpenses.filter((expense) => {
    // 1. Payment mode filter (empty array = show all)
    const paymentMatch = selectedPayments.length === 0 || selectedPayments.includes(expense.payment_mode);
    
    // 2. Category filter (if no categories selected, show all)
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(expense.category.name);
    
    // 3. Date range filter
    const expenseDate = new Date(expense.occurredAt);
    const today = new Date();
    let dateMatch = true;
    
    if (dateRange === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      dateMatch = expenseDate >= weekAgo;
    } else if (dateRange === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      dateMatch = expenseDate >= monthAgo;
    } else if (dateRange === "year") {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);
      dateMatch = expenseDate >= yearAgo;
    }
    // "all" = no date filter
    
    // 4. Amount range filter
    let amountMatch = true;
    const min = minAmount ? parseFloat(minAmount) : null;
    const max = maxAmount ? parseFloat(maxAmount) : null;
    
    if (min !== null && expense.amount < min) amountMatch = false;
    if (max !== null && expense.amount > max) amountMatch = false;
    
    return paymentMatch && categoryMatch && dateMatch && amountMatch;
  });

  const getDateLabel = () => {
    if (dateRange === "all") return "All Time";
    if (dateRange === "week") return "This Week";
    if (dateRange === "month") return "This Month";
    return "This Year";
  };

  const getPaymentLabel = () => {
    if (selectedPayments.length === 0) return "All Modes";
    if (selectedPayments.length === 1) {
      const mode = selectedPayments[0];
      return mode === "bank_transfer" ? "Bank" : mode.toUpperCase();
    }
    return `${selectedPayments.length} selected`;
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

  const hasActiveFilters = dateRange !== "all" || selectedPayments.length > 0 || selectedCategories.length > 0 || minAmount || maxAmount;

  const clearAllFilters = () => {
    setDateRange("all");
    setSelectedPayments([]);
    setSelectedCategories([]);
    setMinAmount("");
    setMaxAmount("");
  };

  const toggleDropdown = (type: DropdownType) => {
    setOpenDropdown(openDropdown === type ? null : type);
  };

  return (
    <div className="p-3 pb-20 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-3">Analytics</h1>

      {/* Filter Bar */}
      <div className="relative mb-4" ref={dropdownRef}>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
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
            isActive={selectedPayments.length > 0}
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
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        {/* Dropdown Panels */}
        {openDropdown === "date" && (
          <div className="absolute top-full left-0 mt-2 bg-theme-bg-secondary border border-theme-border-subtle rounded-xl p-2 shadow-xl z-50 min-w-[160px]">
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
                    : "text-theme-text-secondary hover:bg-theme-bg-hover"
                }`}
              >
                {range === "all" ? "All Time" : range === "week" ? "This Week" : range === "month" ? "This Month" : "This Year"}
              </button>
            ))}
          </div>
        )}

        {openDropdown === "payment" && (
          <div className="absolute top-full left-0 mt-2 bg-theme-bg-secondary border border-theme-border-subtle rounded-xl p-3 shadow-xl z-50 min-w-[200px]">
            <div className="flex flex-wrap gap-2">
              {paymentModes.map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setSelectedPayments((prev) =>
                      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedPayments.includes(mode)
                      ? "bg-emerald-500 text-white"
                      : "bg-theme-bg-button text-theme-text-secondary hover:bg-theme-bg-button-hover"
                  }`}
                >
                  {mode === "bank_transfer" ? "Bank" : mode.toUpperCase()}
                </button>
              ))}
            </div>
            {selectedPayments.length > 0 && (
              <button
                onClick={() => setSelectedPayments([])}
                className="mt-3 text-xs text-theme-text-muted hover:text-theme-text-secondary"
              >
                Clear selection
              </button>
            )}
          </div>
        )}

        {openDropdown === "category" && (
          <div className="absolute top-full left-0 mt-2 bg-theme-bg-secondary border border-theme-border-subtle rounded-xl p-3 shadow-xl z-50 min-w-[220px]">
            {categories.length === 0 ? (
              <p className="text-theme-text-muted text-sm">No categories found</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setSelectedCategories((prev) =>
                          prev.includes(cat.name) ? prev.filter((c) => c !== cat.name) : [...prev, cat.name]
                        );
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedCategories.includes(cat.name)
                          ? "bg-emerald-500 text-white"
                          : "bg-theme-bg-button text-theme-text-secondary hover:bg-theme-bg-button-hover"
                      }`}
                    >
                      <span>{cat.emoji || "📁"}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="mt-3 text-xs text-theme-text-muted hover:text-theme-text-secondary"
                  >
                    Clear selection
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {openDropdown === "amount" && (
          <div className="absolute top-full left-0 mt-2 bg-theme-bg-secondary border border-theme-border-subtle rounded-xl p-4 shadow-xl z-50 min-w-[240px]">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-theme-text-muted mb-1 block">Min</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full bg-theme-bg-button text-theme-text-primary rounded-lg pl-7 pr-3 py-2 text-sm border border-theme-border-subtle focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <span className="text-theme-text-dim mt-5">–</span>
              <div className="flex-1">
                <label className="text-xs text-theme-text-muted mb-1 block">Max</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="Any"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full bg-theme-bg-button text-theme-text-primary rounded-lg pl-7 pr-3 py-2 text-sm border border-theme-border-subtle focus:outline-none focus:border-emerald-500"
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

      {/* Recurring Payments Section */}
      <div className="bg-theme-bg-secondary/50 rounded-lg p-3 border border-theme-border mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-theme-text-primary">Recurring Payments</h2>
          <span className="text-[10px] text-theme-text-muted">Auto-detected</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Dummy recurring items - replace with real data later */}
          {[
            { emoji: "🎬", name: "Netflix", amount: 649, count: 6 },
            { emoji: "🏠", name: "Rent", amount: 15000, count: 4 },
            { emoji: "💪", name: "Gym", amount: 1200, count: 3 },
            { emoji: "📱", name: "Mobile", amount: 599, count: 5 },
            { emoji: "🌐", name: "Internet", amount: 899, count: 4 },
            { emoji: "🎵", name: "Spotify", amount: 119, count: 6 },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2 bg-theme-bg-button/40 rounded px-2 py-1.5 hover:bg-theme-bg-button/70 transition-colors cursor-pointer"
            >
              <span className="text-sm">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-theme-text-primary text-xs truncate">{item.name}</p>
                <p className="text-theme-text-muted text-[10px]">{item.count}x</p>
              </div>
              <p className="text-emerald-400 text-xs font-medium">₹{item.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Content */}
      <div className="bg-theme-bg-secondary/50 rounded-lg p-3 border border-theme-border">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary Row - Inline */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 bg-theme-bg-button/50 rounded px-2 py-1">
                <span className="text-theme-text-muted">Count:</span>
                <span className="text-theme-text-primary font-medium">{filteredExpenses.length}</span>
                <span className="text-theme-text-dim">/ {allExpenses.length}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-theme-bg-button/50 rounded px-2 py-1">
                <span className="text-theme-text-muted">Total:</span>
                <span className="text-emerald-400 font-medium">
                  ₹{filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-theme-bg-button/50 rounded px-2 py-1">
                <span className="text-theme-text-muted">Avg:</span>
                <span className="text-theme-text-primary font-medium">
                  ₹{filteredExpenses.length > 0 
                    ? Math.round(filteredExpenses.reduce((sum, e) => sum + e.amount, 0) / filteredExpenses.length).toLocaleString()
                    : 0}
                </span>
              </div>
            </div>

            {/* Expense List */}
            <div className="max-h-[300px] overflow-y-auto">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-theme-text-muted text-xs">No expenses match your filters</p>
                  <button 
                    onClick={clearAllFilters}
                    className="text-emerald-400 text-xs mt-1 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                  <table className="w-full text-xs">
                    <tbody>
                      {filteredExpenses.slice(0, displayCount).map((expense) => (
                        <tr
                          key={expense._id}
                          className="border-b border-theme-border/50 hover:bg-theme-bg-hover/40"
                        >
                          <td className="py-1 pr-2 w-6">{expense.category.emoji || "💰"}</td>
                          <td className="py-1 text-theme-text-primary">{expense.category.name}</td>
                          <td className="py-1 text-theme-text-muted hidden sm:table-cell">{expense.payment_mode}</td>
                          <td className="py-1 text-theme-text-muted text-right">{new Date(expense.occurredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                          <td className="py-1 text-emerald-400 font-medium text-right pl-3">₹{expense.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {displayCount < filteredExpenses.length && (
                    <button
                      onClick={() => setDisplayCount((prev) => prev + ITEMS_PER_PAGE)}
                      className="w-full mt-2 py-1.5 text-xs text-theme-text-secondary hover:text-emerald-400 hover:bg-theme-bg-hover/50 rounded transition-colors"
                    >
                      Load more ({filteredExpenses.length - displayCount} remaining)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;