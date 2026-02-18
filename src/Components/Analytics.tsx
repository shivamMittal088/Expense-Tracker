import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Calendar, 
  CreditCard, 
  Tag, 
  IndianRupee, 
  X, 
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  RefreshCw,
  Sparkles,
  Filter
} from "lucide-react";
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
};

type RecurringPayment = {
  name: string;
  emoji: string;
  color: string;
  amount: number;
  count: number;
  frequency: "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "irregular";
  frequencyLabel: string;
  nextExpectedDate: string | null;
  estimatedMonthlyAmount: number;
  lastOccurrence: string;
  confidenceScore: number;
};

type PaymentBreakdown = {
  mode: string;
  label: string;
  color: string;
  icon: string;
  totalAmount: number;
  count: number;
  avgAmount: number;
  percentage: number;
};

type SpendingTrend = {
  period: string;
  totalAmount: number;
  count: number;
  avgAmount: number;
  maxAmount: number;
};

type SpendingTrendsSummary = {
  view: string;
  totalSpent: number;
  totalTransactions: number;
  avgPerPeriod: number;
  highestPeriod: SpendingTrend;
  lowestPeriod: SpendingTrend;
  trendPercentage: number;
  trendDirection: "up" | "down" | "flat";
};

// Donut Chart Component
const DonutChart = ({ data, size = 120 }: { data: { name: string; value: number; color: string; emoji?: string }[]; size?: number }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Pre-calculate offsets to avoid reassignment during render
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const strokeDasharray = (percentage / 100) * circumference;
    const offset = data.slice(0, index).reduce((acc, d) => {
      return acc + ((d.value / total) * circumference);
    }, 0);
    return { ...item, strokeDasharray, offset };
  });
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((item, index) => {
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={16}
              strokeDasharray={`${item.strokeDasharray} ${circumference}`}
              strokeDashoffset={-item.offset}
              className="transition-all duration-700 ease-out"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg font-bold">₹{(total / 1000).toFixed(1)}k</p>
          <p className="text-zinc-500 text-[10px]">Total</p>
        </div>
      </div>
    </div>
  );
};

// Spending Trends Chart Component
const SpendingTrendsChart = ({ 
  data, 
  view,
}: { 
  data: SpendingTrend[]; 
  view: "daily" | "monthly" | "yearly";
}) => {
  const maxAmount = Math.max(...data.map(d => d.totalAmount), 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Format period label based on view
  const formatLabel = (period: string, index: number) => {
    if (view === "daily") {
      // Show only every 5th day or first/last
      if (index % 5 === 0 || index === data.length - 1) {
        // Parse date manually to avoid timezone issues (period is "YYYY-MM-DD")
        const [, month, day] = period.split("-");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
      }
      return "";
    } else if (view === "monthly") {
      // period is "YYYY-MM"
      const [, month] = period.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[parseInt(month) - 1]}`;
    } else {
      // yearly - just show the full year (e.g., 2022, 2023)
      return period;
    }
  };

  // Get bar color based on amount intensity
  const getBarColor = (amount: number, index: number) => {
    if (hoveredIndex === index) return "bg-white/90";
    if (amount === 0) return "bg-zinc-700";
    
    // Create a gradient of colors based on the amount relative to max
    const intensity = amount / maxAmount;
    
    if (intensity > 0.8) return "bg-emerald-400"; // Highest - bright green
    if (intensity > 0.6) return "bg-emerald-500"; // High - green
    if (intensity > 0.4) return "bg-teal-500"; // Medium-high - teal
    if (intensity > 0.2) return "bg-cyan-500"; // Medium - cyan
    if (intensity > 0.1) return "bg-blue-500"; // Low - blue
    return "bg-blue-400"; // Lowest - light blue
  };

  // Calculate bar height in pixels
  const chartHeight = 128; // h-32 = 8rem = 128px
  const getBarHeight = (amount: number) => {
    if (amount === 0) return 2;
    return Math.max(4, (amount / maxAmount) * chartHeight);
  };

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-32 w-10 flex flex-col justify-between text-[9px] text-zinc-500">
        <span>₹{maxAmount >= 1000 ? `${(maxAmount / 1000).toFixed(0)}k` : maxAmount}</span>
        <span>₹{maxAmount >= 2000 ? `${(maxAmount / 2000).toFixed(0)}k` : Math.round(maxAmount / 2)}</span>
        <span>₹0</span>
      </div>
      
      {/* Chart area */}
      <div className="ml-12 relative">
        {/* Grid lines */}
        <div className="absolute inset-0 h-32 flex flex-col justify-between pointer-events-none">
          <div className="border-b border-zinc-800/50" />
          <div className="border-b border-zinc-800/30" />
          <div className="border-b border-zinc-800/50" />
        </div>
        
        {/* Bars */}
        <div className={`flex items-end h-32 ${view === "yearly" ? "justify-between gap-4" : "gap-0.5"}`}>
          {data.map((item, index) => (
            <div 
              key={item.period} 
              className={`relative flex flex-col items-center justify-end ${view === "yearly" ? "flex-1" : view === "daily" ? "flex-1 min-w-1" : "flex-1"}`}
              style={{ height: chartHeight }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {hoveredIndex === index && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 shadow-xl z-20 whitespace-nowrap">
                  <p className="text-white text-xs font-semibold">₹{item.totalAmount.toLocaleString()}</p>
                  <p className="text-zinc-400 text-[10px]">{item.count} transactions</p>
                  <p className="text-zinc-500 text-[10px]">{item.period}</p>
                </div>
              )}
              
              {/* Bar */}
              <div
                className={`${view === "yearly" ? "w-full max-w-10" : "w-full"} ${getBarColor(item.totalAmount, index)} rounded-t-sm transition-all duration-300 cursor-pointer hover:opacity-80`}
                style={{ height: getBarHeight(item.totalAmount) }}
              />
            </div>
          ))}
        </div>
        
        {/* X-axis labels */}
        <div className={`flex mt-1.5 ${view === "yearly" ? "justify-between" : ""}`}>
          {data.map((item, index) => {
            const label = formatLabel(item.period, index);
            return (
              <div 
                key={item.period} 
                className={`text-[9px] text-zinc-500 text-center flex-1`}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Filter Chip Component
const FilterChip = ({
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
    className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-colors ${
      isActive
        ? "bg-zinc-800 text-zinc-100 border border-zinc-600"
        : "bg-zinc-900 text-zinc-300 border border-zinc-700 hover:bg-zinc-800"
    } ${isOpen ? "border-zinc-500" : ""}`}
  >
    <Icon size={14} className="text-zinc-300" />
    <span className="text-zinc-400">{label}</span>
    <span className="font-semibold">{value}</span>
  </button>
);

const CATEGORY_COLORS = [
  "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6", 
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"
];

const Analytics = () => {
  const [dateRange, setDateRange] = useState<"week" | "month" | "year" | "all">("month");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);

  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [totalMonthlyRecurring, setTotalMonthlyRecurring] = useState(0);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
  const [paymentBreakdownLoading, setPaymentBreakdownLoading] = useState(true);
  const [paymentPeriod, setPaymentPeriod] = useState<"week" | "month" | "3month" | "6month" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [recurringLoading, setRecurringLoading] = useState(true);

  // Spending Trends State
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrend[]>([]);
  const [spendingTrendsSummary, setSpendingTrendsSummary] = useState<SpendingTrendsSummary | null>(null);
  const [trendsView, setTrendsView] = useState<"daily" | "monthly" | "yearly">("daily");
  const [trendsLoading, setTrendsLoading] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic categories extracted from user's expenses
  const categories = [...new Map(
    allExpenses.map((e) => [e.category.name, { name: e.category.name, emoji: e.category.emoji, color: e.category.color }])
  ).values()];

  const paymentModes = ["cash", "card", "UPI", "bank_transfer", "wallet"];

  // Fetch expenses on mount - using date range endpoint (1 API call instead of 30)
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 365); // Fetch 1 year of data
        
        const formatDate = (d: Date) => d.toISOString().split("T")[0];
        
        const response = await api.get('/api/expenses/range', {
          params: {
            startDate: formatDate(startDate),
            endDate: formatDate(today),
          },
        });
        
        const allData = response.data?.data || [];
        setAllExpenses(allData);
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecurringPayments = async () => {
      try {
        setRecurringLoading(true);
        const response = await api.get('/api/expenses/recurring');
        const data = response.data?.data || [];
        const summary = response.data?.summary || {};
        
        setRecurringPayments(data);
        setTotalMonthlyRecurring(summary.totalMonthlyEstimate || 0);
      } catch (error) {
        console.error("Failed to fetch recurring payments:", error);
      } finally {
        setRecurringLoading(false);
      }
    };

    fetchExpenses();
    fetchRecurringPayments();
  }, []);

  // Fetch payment breakdown when period changes
  useEffect(() => {
    const fetchPaymentBreakdown = async () => {
      try {
        setPaymentBreakdownLoading(true);
        const response = await api.get('/api/expenses/payment-breakdown', {
          params: { period: paymentPeriod },
        });
        setPaymentBreakdown(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch payment breakdown:", error);
      } finally {
        setPaymentBreakdownLoading(false);
      }
    };

    fetchPaymentBreakdown();
  }, [paymentPeriod]);

  // Fetch spending trends when view changes
  useEffect(() => {
    const fetchSpendingTrends = async () => {
      try {
        setTrendsLoading(true);
        const response = await api.get('/api/expenses/spending-trends', {
          params: { view: trendsView },
        });
        setSpendingTrends(response.data?.data || []);
        setSpendingTrendsSummary(response.data?.summary || null);
      } catch (error) {
        console.error("Failed to fetch spending trends:", error);
      } finally {
        setTrendsLoading(false);
      }
    };

    fetchSpendingTrends();
  }, [trendsView]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredExpenses = allExpenses.filter((expense) => {
    const paymentMatch = selectedPayments.length === 0 || selectedPayments.includes(expense.payment_mode);
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(expense.category.name);
    
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
    
    let amountMatch = true;
    const min = minAmount ? parseFloat(minAmount) : null;
    const max = maxAmount ? parseFloat(maxAmount) : null;
    
    if (min !== null && expense.amount < min) amountMatch = false;
    if (max !== null && expense.amount > max) amountMatch = false;
    
    return paymentMatch && categoryMatch && dateMatch && amountMatch;
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avg = filteredExpenses.length > 0 ? total / filteredExpenses.length : 0;
    const highest = Math.max(...filteredExpenses.map(e => e.amount), 0);
    const count = filteredExpenses.length;
    
    // Calculate category breakdown
    const categoryMap = new Map<string, { amount: number; emoji?: string; color: string }>();
    filteredExpenses.forEach((e, index) => {
      const existing = categoryMap.get(e.category.name) || { amount: 0, emoji: e.category.emoji, color: e.category.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
      categoryMap.set(e.category.name, {
        ...existing,
        amount: existing.amount + e.amount
      });
    });
    
    const categoryData = Array.from(categoryMap.entries())
      .map(([name, data], index) => ({
        name,
        value: data.amount,
        emoji: data.emoji,
        color: data.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    
    return { total, avg, highest, count, categoryData };
  }, [filteredExpenses]);

  const getDateLabel = () => {
    if (dateRange === "all") return "All Time";
    if (dateRange === "week") return "This Week";
    if (dateRange === "month") return "This Month";
    return "This Year";
  };

  const getPaymentLabel = () => {
    if (selectedPayments.length === 0) return "All";
    if (selectedPayments.length === 1) {
      const mode = selectedPayments[0];
      return mode === "bank_transfer" ? "Bank" : mode.toUpperCase();
    }
    return `${selectedPayments.length}`;
  };

  const getCategoryLabel = () => {
    if (selectedCategories.length === 0) return "All";
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length}`;
  };

  const getAmountLabel = () => {
    if (!minAmount && !maxAmount) return "Any";
    if (minAmount && maxAmount) return `₹${minAmount}-${maxAmount}`;
    if (minAmount) return `₹${minAmount}+`;
    return `≤₹${maxAmount}`;
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-4 pb-28 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-zinc-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-zinc-800/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 max-w-5xl mx-auto">
      <div>
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-zinc-200" size={22} />
                Analytics
              </h1>
              <p className="text-zinc-400 text-sm mt-0.5">Track your spending patterns</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-700 transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

      {/* Spending Trends Chart */}
      <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 mb-6 overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-zinc-200" />
            <div>
              <h3 className="text-sm font-semibold text-white">Spending Trends</h3>
              <p className="text-[10px] text-zinc-500">
                {trendsView === "daily" ? "Last 30 days" : trendsView === "monthly" ? "Last 12 months" : "Last 5 years"}
              </p>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-700">
            {(["daily", "monthly", "yearly"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setTrendsView(view)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                  trendsView === view
                    ? "bg-zinc-100 text-black"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                {view === "daily" ? "Days" : view === "monthly" ? "Months" : "Years"}
              </button>
            ))}
          </div>
        </div>

          {/* Chart */}
          {trendsLoading ? (
            <div className="h-40 bg-white/[0.04] rounded-xl animate-pulse" />
          ) : spendingTrends.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-white/50 text-sm">
              No data available
            </div>
          ) : (
            <SpendingTrendsChart data={spendingTrends} view={trendsView} />
          )}

          {/* Summary Stats */}
          {spendingTrendsSummary && !trendsLoading && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-800">
              <div className="text-center">
                <p className="text-[10px] text-zinc-500 mb-0.5">Total</p>
                <p className="text-white text-sm font-bold">
                  ₹{spendingTrendsSummary.totalSpent >= 100000 
                    ? `${(spendingTrendsSummary.totalSpent / 100000).toFixed(1)}L` 
                    : spendingTrendsSummary.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-zinc-500 mb-0.5">
                  Avg/{trendsView === "daily" ? "Day" : trendsView === "monthly" ? "Month" : "Year"}
                </p>
                <p className="text-white text-sm font-bold">
                  ₹{spendingTrendsSummary.avgPerPeriod >= 1000 
                    ? `${(spendingTrendsSummary.avgPerPeriod / 1000).toFixed(1)}K` 
                    : spendingTrendsSummary.avgPerPeriod.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-zinc-500 mb-0.5">Trend</p>
                <p className={`text-sm font-bold flex items-center justify-center gap-1 ${
                  spendingTrendsSummary.trendDirection === "up" 
                    ? "text-rose-400" 
                    : spendingTrendsSummary.trendDirection === "down" 
                      ? "text-emerald-400" 
                      : "text-white/40"
                }`}>
                  {spendingTrendsSummary.trendDirection === "up" ? (
                    <ArrowUpRight size={14} />
                  ) : spendingTrendsSummary.trendDirection === "down" ? (
                    <ArrowDownRight size={14} />
                  ) : null}
                  {Math.abs(spendingTrendsSummary.trendPercentage)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative mb-6" ref={dropdownRef}>
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-zinc-500" />
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Filters</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <FilterChip
            icon={Calendar}
            label=""
            value={getDateLabel()}
            isActive={dateRange !== "all"}
            isOpen={openDropdown === "date"}
            onClick={() => toggleDropdown("date")}
          />
          <FilterChip
            icon={CreditCard}
            label=""
            value={getPaymentLabel()}
            isActive={selectedPayments.length > 0}
            isOpen={openDropdown === "payment"}
            onClick={() => toggleDropdown("payment")}
          />
          <FilterChip
            icon={Tag}
            label=""
            value={getCategoryLabel()}
            isActive={selectedCategories.length > 0}
            isOpen={openDropdown === "category"}
            onClick={() => toggleDropdown("category")}
          />
          <FilterChip
            icon={IndianRupee}
            label=""
            value={getAmountLabel()}
            isActive={!!(minAmount || maxAmount)}
            isOpen={openDropdown === "amount"}
            onClick={() => toggleDropdown("amount")}
          />

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-300 hover:text-zinc-100 bg-zinc-900 rounded-xl border border-zinc-700 transition-colors hover:bg-zinc-800"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        {/* Dropdown Panels */}
        {openDropdown === "date" && (
          <div className="absolute top-full left-0 mt-2 bg-zinc-950 border border-zinc-700 rounded-2xl p-2 shadow-xl z-50 min-w-45">
            {(["week", "month", "year", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setDateRange(range);
                  setOpenDropdown(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  dateRange === range
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {range === "all" ? "All Time" : range === "week" ? "This Week" : range === "month" ? "This Month" : "This Year"}
              </button>
            ))}
          </div>
        )}

        {openDropdown === "payment" && (
          <div className="absolute top-full left-0 mt-2 bg-zinc-950 border border-zinc-700 rounded-2xl p-4 shadow-xl z-50 min-w-60">
            <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Payment Methods</p>
            <div className="flex flex-wrap gap-2">
              {paymentModes.map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setSelectedPayments((prev) =>
                      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
                    );
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selectedPayments.includes(mode)
                      ? "bg-zinc-100 text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {mode === "bank_transfer" ? "Bank" : mode.toUpperCase()}
                </button>
              ))}
            </div>
            {selectedPayments.length > 0 && (
              <button
                onClick={() => setSelectedPayments([])}
                className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>
        )}

        {openDropdown === "category" && (
          <div className="absolute top-full left-0 mt-2 bg-zinc-950 border border-zinc-700 rounded-2xl p-4 shadow-xl z-50 min-w-65">
            <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Categories</p>
            {categories.length === 0 ? (
              <p className="text-zinc-500 text-sm">No categories found</p>
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
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedCategories.includes(cat.name)
                          ? "bg-zinc-100 text-black"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
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
                    className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {openDropdown === "amount" && (
          <div className="absolute top-full left-0 mt-2 bg-zinc-950 border border-zinc-700 rounded-2xl p-5 shadow-xl z-50 min-w-70">
            <p className="text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wider">Amount Range</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-zinc-400 mb-2 block font-medium">Minimum</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full bg-zinc-900 text-white rounded-xl pl-8 pr-3 py-2.5 text-sm border border-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>
              <span className="text-zinc-600 mt-6 text-lg">–</span>
              <div className="flex-1">
                <label className="text-xs text-zinc-400 mb-2 block font-medium">Maximum</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="Any"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full bg-zinc-900 text-white rounded-xl pl-8 pr-3 py-2.5 text-sm border border-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpenDropdown(null)}
              className="w-full mt-4 bg-zinc-100 hover:bg-zinc-200 text-black py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Category Breakdown */}
        <div className="rounded-2xl p-4 border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart size={16} className="text-zinc-200" />
              <h3 className="text-sm font-semibold text-white">By Category</h3>
            </div>
          </div>
          
          {stats.categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <DonutChart data={stats.categoryData} />
              <div className="flex-1 space-y-2">
                {stats.categoryData.slice(0, 4).map((cat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-zinc-400 flex-1 truncate">{cat.emoji} {cat.name}</span>
                    <span className="text-xs text-white font-medium">₹{cat.value.toLocaleString()}</span>
                  </div>
                ))}
                {stats.categoryData.length > 4 && (
                  <p className="text-[10px] text-zinc-500">+{stats.categoryData.length - 4} more</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
              No data available
            </div>
          )}
          </div>
        </div>

      </div>

      {/* Payment Mode Breakdown - Compact Premium */}
      <div className="rounded-2xl p-4 border border-zinc-800 bg-zinc-950 mb-6 overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-zinc-200" />
            <h2 className="text-xs font-semibold text-white">Payment Methods</h2>
          </div>
          <div className="flex items-center gap-0.5 bg-zinc-900 rounded-md p-0.5 border border-zinc-700">
            {(["week", "month", "3month", "6month", "year"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setPaymentPeriod(period)}
                className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors ${
                  paymentPeriod === period
                    ? "bg-zinc-100 text-black"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {period === "week" ? "7D" : period === "month" ? "1M" : period === "3month" ? "3M" : period === "6month" ? "6M" : "1Y"}
              </button>
            ))}
          </div>
        </div>

        {paymentBreakdownLoading ? (
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-16 bg-zinc-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : paymentBreakdown.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-zinc-500 text-xs">No data</p>
          </div>
        ) : (
          <>
            {/* Horizontal bar showing all payment modes */}
            <div className="h-3 rounded-full overflow-hidden flex mb-3">
              {paymentBreakdown.map((item, index) => (
                <div
                  key={item.mode}
                  className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                    marginLeft: index > 0 ? '2px' : '0',
                  }}
                />
              ))}
            </div>

            {/* Compact grid of payment modes */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {paymentBreakdown.map((item) => (
                <div
                  key={item.mode}
                  className="group relative bg-zinc-900 hover:bg-zinc-800 rounded-xl p-2 transition-colors cursor-pointer border border-zinc-800"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] text-zinc-400 font-medium">{item.label}</span>
                  </div>
                  <p className="text-white text-sm font-bold">₹{item.totalAmount >= 1000 ? `${(item.totalAmount / 1000).toFixed(1)}k` : item.totalAmount}</p>
                  <p className="text-zinc-600 text-[9px]">{item.percentage}% • {item.count}x</p>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>

      {/* Recurring Payments Section */}
      <div className="rounded-2xl p-4 border border-zinc-800 bg-zinc-950 mb-6 overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-zinc-200" />
            <h2 className="text-sm font-semibold text-white">Recurring Payments</h2>
          </div>
          <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={10} />
            Auto-detected
          </span>
        </div>
        
        {recurringLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-zinc-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recurringPayments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="text-zinc-600" size={20} />
            </div>
            <p className="text-zinc-400 text-sm font-medium">No recurring payments detected</p>
            <p className="text-zinc-600 text-xs mt-1">Keep tracking to find patterns</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recurringPayments.slice(0, 6).map((item) => (
                <div
                  key={item.name}
                  className="group flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg sm:rounded-2xl px-2 py-2 sm:px-3 sm:py-3 transition-colors cursor-pointer border border-zinc-800"
                >
                  <div 
                    className="w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-xl flex items-center justify-center text-[13px]"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-[12px] sm:text-sm font-medium truncate">{item.name}</p>
                      <span className="text-[9px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded-full">
                        {item.frequencyLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-100 text-[12px] sm:text-sm font-semibold">₹{item.amount.toLocaleString()}</p>
                    <p className="text-[8px] text-zinc-500 sm:hidden">~₹{item.estimatedMonthlyAmount.toLocaleString()}/mo</p>
                    {item.nextExpectedDate && (
                      <p className={`hidden sm:block text-[10px] ${item.nextExpectedDate.includes('Overdue') ? 'text-rose-400' : 'text-amber-400'}`}>
                        {item.nextExpectedDate}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Estimated monthly total</span>
              <span className="text-emerald-400 font-bold text-sm">₹{totalMonthlyRecurring.toLocaleString()}/month</span>
            </div>
          </>
        )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Analytics;