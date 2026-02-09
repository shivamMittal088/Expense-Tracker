import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Calendar, 
  CreditCard, 
  Tag, 
  IndianRupee, 
  X, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  RefreshCw,
  Sparkles,
  ChevronRight,
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
  deleted?: boolean;
  currency?: string;
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

// Stat Card Component
const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = "emerald",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: number; isPositive: boolean };
  color?: "emerald" | "violet" | "amber" | "rose";
  delay?: number;
}) => {
  const colorClasses = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400",
  };

  const iconBgClasses = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    violet: "bg-violet-500/20 text-violet-400",
    amber: "bg-amber-500/20 text-amber-400",
    rose: "bg-rose-500/20 text-rose-400",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-xl p-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-${color}-500/10`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${iconBgClasses[color]}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trend.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-zinc-400 text-xs font-medium mb-1">{label}</p>
      <p className="text-white text-xl font-bold tracking-tight">{value}</p>
      {subValue && <p className="text-zinc-500 text-xs mt-1">{subValue}</p>}
      
      {/* Decorative glow */}
      <div className={`absolute -top-12 -right-12 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl`} />
    </div>
  );
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

// Mini Bar Chart for Weekly Trend
const WeeklyTrendChart = ({ data }: { data: { day: string; amount: number }[] }) => {
  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  
  return (
    <div className="flex items-end justify-between gap-1 h-16">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm transition-all duration-500 hover:from-emerald-400 hover:to-emerald-300"
            style={{ 
              height: `${(item.amount / maxAmount) * 100}%`,
              minHeight: item.amount > 0 ? '4px' : '0px',
              animationDelay: `${index * 50}ms`
            }}
          />
          <span className="text-[9px] text-zinc-500 font-medium">{item.day}</span>
        </div>
      ))}
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
    className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-300 ${
      isActive
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
        : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/80 hover:border-zinc-600"
    } ${isOpen ? "ring-2 ring-emerald-500/40 ring-offset-1 ring-offset-black" : ""}`}
  >
    <Icon size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-12" : "group-hover:scale-110"}`} />
    <span className="text-zinc-500">{label}</span>
    <span className="font-semibold">{value}</span>
  </button>
);

const ITEMS_PER_PAGE = 15;

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
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [activeView, setActiveView] = useState<"list" | "chart">("chart");

  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [totalMonthlyRecurring, setTotalMonthlyRecurring] = useState(0);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
  const [paymentBreakdownLoading, setPaymentBreakdownLoading] = useState(true);
  const [paymentPeriod, setPaymentPeriod] = useState<"week" | "month" | "3month" | "6month" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [recurringLoading, setRecurringLoading] = useState(true);

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
        const activeExpenses = allData.filter((e: Expense) => !e.deleted);
        setAllExpenses(activeExpenses);
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
    
    // Calculate weekly trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });
    
    const weeklyData = last7Days.map(date => {
      const dayExpenses = filteredExpenses.filter(e => {
        const expDate = new Date(e.occurredAt);
        return expDate.toDateString() === date.toDateString();
      });
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
        amount: dayExpenses.reduce((sum, e) => sum + e.amount, 0)
      };
    });
    
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
    
    return { total, avg, highest, count, weeklyData, categoryData };
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
      <div className="p-4 pb-28 max-w-3xl mx-auto">
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
    <div className="p-4 pb-28 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-emerald-400" size={24} />
            Analytics
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">Track your spending patterns</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="p-2 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={Wallet}
          label="Total Spent"
          value={`₹${stats.total.toLocaleString()}`}
          subValue={`${stats.count} transactions`}
          color="emerald"
          delay={0}
        />
        <StatCard
          icon={TrendingUp}
          label="Average"
          value={`₹${Math.round(stats.avg).toLocaleString()}`}
          subValue="per transaction"
          trend={{ value: 12, isPositive: false }}
          color="violet"
          delay={100}
        />
        <StatCard
          icon={TrendingDown}
          label="Highest"
          value={`₹${stats.highest.toLocaleString()}`}
          subValue="single expense"
          color="amber"
          delay={200}
        />
        <StatCard
          icon={Sparkles}
          label="Categories"
          value={categories.length.toString()}
          subValue="spending areas"
          color="rose"
          delay={300}
        />
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
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-xl border border-rose-500/20 transition-all hover:bg-rose-500/20"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        {/* Dropdown Panels */}
        {openDropdown === "date" && (
          <div className="absolute top-full left-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-2 shadow-2xl z-50 min-w-[180px]">
            {(["week", "month", "year", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setDateRange(range);
                  setOpenDropdown(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
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
          <div className="absolute top-full left-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-4 shadow-2xl z-50 min-w-[240px]">
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
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedPayments.includes(mode)
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
          <div className="absolute top-full left-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-4 shadow-2xl z-50 min-w-[260px]">
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
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedCategories.includes(cat.name)
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
          <div className="absolute top-full left-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-5 shadow-2xl z-50 min-w-[280px]">
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
                    className="w-full bg-zinc-800 text-white rounded-xl pl-8 pr-3 py-2.5 text-sm border border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
                    className="w-full bg-zinc-800 text-white rounded-xl pl-8 pr-3 py-2.5 text-sm border border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpenDropdown(null)}
              className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Category Breakdown */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart size={16} className="text-violet-400" />
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

        {/* Weekly Trend */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Weekly Trend</h3>
            </div>
            <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">Last 7 days</span>
          </div>
          
          <WeeklyTrendChart data={stats.weeklyData} />
          
          <div className="mt-4 pt-3 border-t border-zinc-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Daily average</span>
              <span className="text-emerald-400 font-semibold">
                ₹{Math.round(stats.weeklyData.reduce((sum, d) => sum + d.amount, 0) / 7).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Mode Breakdown - Compact Premium */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 backdrop-blur-xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-blue-400" />
            <h2 className="text-xs font-semibold text-white">Payment Methods</h2>
          </div>
          <div className="flex items-center gap-0.5 bg-zinc-800/70 rounded-md p-0.5">
            {(["week", "month", "3month", "6month", "year"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setPaymentPeriod(period)}
                className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-all ${
                  paymentPeriod === period
                    ? "bg-blue-500/90 text-white shadow-sm"
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
                  className="group relative bg-zinc-800/30 hover:bg-zinc-800/50 rounded-xl p-2 transition-all cursor-pointer border border-transparent hover:border-zinc-700/50"
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

      {/* Recurring Payments Section */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 backdrop-blur-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Recurring Payments</h2>
          </div>
          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full flex items-center gap-1">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {recurringPayments.slice(0, 6).map((item) => (
                <div
                  key={item.name}
                  className="group flex items-center gap-3 bg-zinc-800/40 hover:bg-zinc-800/70 rounded-xl px-3 py-2.5 transition-all cursor-pointer border border-transparent hover:border-zinc-700/50"
                >
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.name}</p>
                    <p className="text-zinc-500 text-[11px]">
                      {item.frequencyLabel}
                    </p>
                    {item.nextExpectedDate && (
                      <p className={`text-[10px] ${item.nextExpectedDate.includes('Overdue') ? 'text-rose-400' : 'text-amber-400'}`}>
                        {item.nextExpectedDate}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-sm font-semibold">₹{item.amount.toLocaleString()}</p>
                    <p className="text-zinc-600 text-[10px]">~₹{item.estimatedMonthlyAmount.toLocaleString()}/mo</p>
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

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          All Transactions
          <span className="text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
            {filteredExpenses.length}
          </span>
        </h2>
        <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
          <button
            onClick={() => setActiveView("chart")}
            className={`p-1.5 rounded-md transition-all ${activeView === "chart" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"}`}
            title="Grid View"
          >
            <PieChart size={14} />
          </button>
          <button
            onClick={() => setActiveView("list")}
            className={`p-1.5 rounded-md transition-all ${activeView === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"}`}
            title="List View"
          >
            <BarChart3 size={14} />
          </button>
        </div>
      </div>

      {/* Expense Views */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 rounded-2xl border border-zinc-800/50 backdrop-blur-xl overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
              <Wallet className="text-zinc-600" size={28} />
            </div>
            <p className="text-zinc-400 text-sm font-medium">No expenses match your filters</p>
            <p className="text-zinc-600 text-xs mt-1">Try adjusting your filter criteria</p>
            <button 
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-all"
            >
              Clear all filters
            </button>
          </div>
        ) : activeView === "chart" ? (
          /* Grid/Card View */
          <>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
              {filteredExpenses.slice(0, displayCount).map((expense, index) => (
                <div
                  key={expense._id}
                  className="bg-zinc-800/50 hover:bg-zinc-800/80 rounded-xl p-3 transition-all cursor-pointer border border-zinc-700/30 hover:border-zinc-600/50 group"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${expense.category.color || '#10b981'}20` }}
                    >
                      {expense.category.emoji || "💰"}
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(expense.occurredAt).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </span>
                  </div>
                  <p className="text-white text-xs font-medium truncate mb-1">{expense.category.name}</p>
                  <p className="text-emerald-400 font-bold text-sm">₹{expense.amount.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-zinc-500 bg-zinc-700/50 px-1.5 py-0.5 rounded">
                      {expense.payment_mode === "bank_transfer" ? "Bank" : expense.payment_mode.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {displayCount < filteredExpenses.length && (
              <button
                onClick={() => setDisplayCount((prev) => prev + ITEMS_PER_PAGE)}
                className="w-full py-3 text-sm text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/30 transition-all font-medium border-t border-zinc-800/50"
              >
                Load more ({filteredExpenses.length - displayCount} remaining)
              </button>
            )}
          </>
        ) : (
          /* List View */
          <>
            <div className="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto">
              {filteredExpenses.slice(0, displayCount).map((expense, index) => (
                <div
                  key={expense._id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-all group"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${expense.category.color || '#10b981'}20` }}
                  >
                    {expense.category.emoji || "💰"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{expense.category.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-zinc-500 text-xs">{expense.payment_mode}</span>
                      {expense.notes && (
                        <>
                          <span className="text-zinc-700">•</span>
                          <span className="text-zinc-600 text-xs truncate">{expense.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-semibold">₹{expense.amount.toLocaleString()}</p>
                    <p className="text-zinc-600 text-[11px]">
                      {new Date(expense.occurredAt).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                </div>
              ))}
            </div>
            {displayCount < filteredExpenses.length && (
              <button
                onClick={() => setDisplayCount((prev) => prev + ITEMS_PER_PAGE)}
                className="w-full py-3 text-sm text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/30 transition-all font-medium border-t border-zinc-800/50"
              >
                Load more ({filteredExpenses.length - displayCount} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;