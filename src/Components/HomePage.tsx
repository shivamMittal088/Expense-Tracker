import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { CalendarPicker } from "../utils/UI/CalendarPicker";
import AddExpenseModal from "./AddExpenseModal";
import api from "../routeWrapper/Api"; // axios instance with auth token
import { useAppSelector } from "../store/hooks";
import ExpenseHeatmap from "./ExpenseHeatmap";
import ExpenseDay from "./ExpenseDay";

type Expense = {
  _id: string;
  amount: number;
  category: {
    name: string;
    color: string;
    emoji?: string;
  };
  emoji?: string; // Emoji may also be stored on category
  notes?: string;
  occurredAt: string;
  payment_mode: string;
};

interface RawExpense {
  _id: string;
  amount: number;
  category: {
    name: string;
    color: string;
    emoji?: string;
  };
  emoji?: string;
  notes?: string;
  occurredAt?: string;
  occuredAt?: string;  // Handle typo from API
  createdAt?: string;
  updatedAt?: string;
  payment_mode: string;
}

type RibbonDay = {
  date: string;
  count: number;
  totalAmount: number;
};

export default function ExpenseTrackerHome() {
  const hideAmounts = useAppSelector((state) => state.amount.hideAmounts);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [visibleTotal, setVisibleTotal] = useState(0);
  const [dayExpenses, setDayExpenses] = useState<Expense[]>([]);
  const [dayPage, setDayPage] = useState(1);
  const [dayTotalCount, setDayTotalCount] = useState(0);
  const [dayTotalAmount, setDayTotalAmount] = useState(0);
  const [ribbonData, setRibbonData] = useState<RibbonDay[]>([]);
  const [ribbonLoading, setRibbonLoading] = useState(false);
  const dayLimit = 8;

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const displayLabel = isToday ? "Today" : formattedDate;

  const handleDateSelect = (date: Date) => {
    setDayPage(1);
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const changeDateBy = (days: number) => {
    setDayPage(1);
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + days);
      return next;
    });
  };

  // Convert JS Date → YYYY-MM-DD (using local date to avoid timezone issues)
  const getFormattedDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const apiDate = getFormattedDate(selectedDate);

  const handleRibbonSelect = (date: Date) => {
    setDayPage(1);
    setSelectedDate(date);
  };

  /* ---------------- Fetch expenses when date changes ---------------- */

  const normalizeExpenses = (items: RawExpense[]): Expense[] => {
    const normalized = (items || []).map((e: RawExpense) => ({
      ...e,
      occurredAt: e.occurredAt || e.occuredAt || e.createdAt || e.updatedAt || new Date().toISOString(),
    }));
    normalized.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    return normalized;
  };

  // Abort controller ref for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchExpenses = useCallback(async () => {
    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      const res = await api.get(`/api/expense/${apiDate}`, {
        params: {
          tzOffsetMinutes: new Date().getTimezoneOffset(),
          page: dayPage,
          limit: dayLimit,
        },
        signal: abortControllerRef.current.signal,
      });

      const normalized = normalizeExpenses(res.data.data || []);
      const meta = res.data?.meta || {};
      const totalCount = Number(meta.totalCount || 0);
      const totalAmount = Number(meta.totalAmount || 0);

      setVisibleTotal(totalAmount);

      setDayExpenses(normalized);
      setDayTotalCount(totalCount);
      setDayTotalAmount(totalAmount);
    } catch (err: unknown) {
      // Ignore aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error("Failed to load expenses", err);
      setVisibleTotal(0);
      setDayExpenses([]);
      setDayTotalCount(0);
      setDayTotalAmount(0);
    } finally {
      // Keep silent for now since the expenses section is hidden on the home page.
    }
  }, [apiDate, dayLimit, dayPage]);

  // Debounce API calls when date changes rapidly
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchExpenses();
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchExpenses]);

  useEffect(() => {
    const fetchRibbonData = async () => {
      setRibbonLoading(true);
      try {
        const year = selectedDate.getFullYear();
        const tzOffsetMinutes = new Date().getTimezoneOffset();
        const res = await api.get(`/api/expenses/heatmap?year=${year}&tzOffsetMinutes=${tzOffsetMinutes}`);
        setRibbonData(res.data.data || []);
      } catch (err) {
        console.error("Failed to load ribbon data", err);
        setRibbonData([]);
      } finally {
        setRibbonLoading(false);
      }
    };

    fetchRibbonData();
  }, [selectedDate]);

  const ribbonMap = useMemo(() => {
    const map = new Map<string, RibbonDay>();
    ribbonData.forEach((d) => map.set(d.date, d));
    return map;
  }, [ribbonData]);

  const ribbonDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() - i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const totalForDay = visibleTotal;

  return (
    <div className="relative min-h-screen bg-black text-white pb-28 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute top-24 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-sky-500/10 blur-[160px]" />
        <div className="absolute bottom-[-15%] left-[10%] h-[26rem] w-[26rem] rounded-full bg-amber-500/8 blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.04),transparent_35%)]" />
      </div>

      <main className="relative max-w-5xl mx-auto px-4 lg:px-8 pt-8 lg:pt-12 pb-4 lg:pb-6 space-y-10 lg:space-y-12">

        {/* Top Bar - Premium Glass Card - Compact & Centered */}
        <section className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.08)]">
          {/* Solid dark background with subtle gradient */}
          <div className="absolute inset-0 bg-[#0a0a0a]" />
          <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-white/2" />
          {/* Visible border */}
          <div className="absolute inset-0 border border-white/15 rounded-2xl" />
          {/* Top accent line */}
          <div className="absolute top-0 left-[18%] right-[18%] h-px bg-linear-to-r from-transparent via-emerald-400/40 to-transparent" />
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-12 h-12 bg-linear-to-br from-white/8 to-transparent" />
          <div className="absolute bottom-0 right-0 w-12 h-12 bg-linear-to-tl from-white/5 to-transparent" />
          
          <div className="relative px-4 lg:px-5 py-3 lg:py-4">
            {/* Desktop Layout - Compact */}
            <div className="hidden lg:flex items-center justify-between gap-4">
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeDateBy(-1)}
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/60 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <svg className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-base font-bold">{displayLabel}</p>
                  <svg className="w-3 h-3 text-white/30 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => changeDateBy(1)}
                  disabled={isToday}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isToday ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-white/5 hover:bg-white/10 text-white/60"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Center - Total */}
              <div className="flex-1 text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Today's Spending</p>
                <p className="text-2xl font-bold tracking-wide">
                  {hideAmounts ? "₹•••••" : `₹${totalForDay.toFixed(0)}`}
                </p>
              </div>

              <div className="flex items-center gap-2" />
            </div>

            {/* Compact Week Grid - Desktop */}
            <div className="hidden lg:block mt-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Last 7 Days</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Tap a day</p>
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {ribbonLoading ? (
                  Array.from({ length: 7 }).map((_, idx) => (
                    <div key={idx} className="h-10 rounded-lg border border-white/10 bg-white/[0.03]" />
                  ))
                ) : (
                  ribbonDays.map((day) => {
                    const dateKey = getFormattedDate(day);
                    const data = ribbonMap.get(dateKey);
                    const count = data?.count || 0;
                    const isSelected = dateKey === apiDate;
                    const isCurrentDay = day.toDateString() === today.toDateString();
                    const level = Math.min(4, count);
                    const tone = [
                      "bg-white/[0.04]",
                      "bg-white/[0.08]",
                      "bg-white/[0.14]",
                      "bg-white/[0.22]",
                      "bg-white/[0.32]",
                    ][level];

                    return (
                      <button
                        key={dateKey}
                        onClick={() => handleRibbonSelect(day)}
                        className={`rounded-lg border px-1.5 py-1.5 text-center transition-all ${
                          isSelected ? "border-white/50" : "border-white/10 hover:border-white/30"
                        } ${tone}`}
                      >
                        <div className={`text-[9px] uppercase ${isCurrentDay ? "text-white" : "text-white/50"}`}>
                          {day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                        </div>
                        <div className={`text-[12px] font-semibold ${isCurrentDay ? "text-white" : "text-white/70"}`}>
                          {day.getDate()}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Mobile Layout - Compact & Centered */}
            <div className="lg:hidden flex flex-col items-center text-center">
              {/* Date Navigation Row - Centered */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  onClick={() => changeDateBy(-1)}
                  className="w-8 h-8 bg-white/5 active:bg-white/10 rounded-lg flex items-center justify-center text-white/60 transition-colors touch-manipulation"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsCalendarOpen(true)}
                  className="py-1.5 px-3 bg-white/5 active:bg-white/10 rounded-lg transition-colors touch-manipulation flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-xs font-semibold">{displayLabel}</p>
                  <svg className="w-2 h-2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => changeDateBy(1)}
                  disabled={isToday}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors touch-manipulation ${
                    isToday ? "bg-white/5 text-white/20" : "bg-white/5 active:bg-white/10 text-white/60"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Spending Amount - Centered */}
              <div className="mb-3">
                <p className="text-[9px] text-white/40 uppercase tracking-[0.18em] mb-0.5">Today's Spending</p>
                <p className="text-2xl font-bold tracking-wide">
                  {hideAmounts ? "₹•••••" : `₹${totalForDay.toFixed(0)}`}
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-2" />
            </div>

            {/* Compact Week Grid - Mobile */}
            <div className="lg:hidden mt-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.24em] text-white/40">Last 7 Days</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">Tap a day</p>
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {ribbonLoading ? (
                  Array.from({ length: 7 }).map((_, idx) => (
                    <div key={idx} className="h-9 rounded-lg border border-white/10 bg-white/[0.03]" />
                  ))
                ) : (
                  ribbonDays.map((day) => {
                    const dateKey = getFormattedDate(day);
                    const data = ribbonMap.get(dateKey);
                    const count = data?.count || 0;
                    const isSelected = dateKey === apiDate;
                    const isCurrentDay = day.toDateString() === today.toDateString();
                    const level = Math.min(4, count);
                    const tone = [
                      "bg-white/[0.04]",
                      "bg-white/[0.08]",
                      "bg-white/[0.14]",
                      "bg-white/[0.22]",
                      "bg-white/[0.32]",
                    ][level];

                    return (
                      <button
                        key={dateKey}
                        onClick={() => handleRibbonSelect(day)}
                        className={`rounded-lg border px-1 py-1.5 text-center transition-all ${
                          isSelected ? "border-white/50" : "border-white/10"
                        } ${tone}`}
                      >
                        <div className={`text-[8px] uppercase ${isCurrentDay ? "text-white" : "text-white/50"}`}>
                          {day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                        </div>
                        <div className={`text-[11px] font-semibold ${isCurrentDay ? "text-white" : "text-white/70"}`}>
                          {day.getDate()}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Add Expense Card */}
        <section className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/12 bg-white/[0.03] backdrop-blur-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Quick Add</p>
              <p className="text-sm font-semibold text-white">Add Expense</p>
            </div>
            <button
              onClick={() => setShowAddExpense(true)}
              className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center text-lg font-semibold hover:bg-white/90 transition-colors"
              aria-label="Add expense"
            >
              +
            </button>
          </div>
        </section>


        {/* Transaction Activity Heatmap */}
        <ExpenseHeatmap />


        {/* Day Transactions */}
        <ExpenseDay
          dayExpenses={dayExpenses}
          displayLabel={displayLabel}
          isToday={isToday}
          hideAmounts={hideAmounts}
          page={dayPage}
          totalCount={dayTotalCount}
          totalAmount={dayTotalAmount}
          totalPages={Math.max(1, Math.ceil(dayTotalCount / dayLimit))}
          onPageChange={setDayPage}
        />

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-12px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </main>

      <CalendarPicker
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        maxDate={today}
      />

      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
      />

    </div>
  );
}