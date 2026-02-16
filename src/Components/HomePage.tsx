import { useState, useEffect, useCallback, useRef } from "react";
import { CalendarPicker } from "../utils/UI/CalendarPicker";
import api from "../routeWrapper/Api"; // axios instance with auth token
import { useAppSelector } from "../store/hooks";
import Heatmap from "../utils/UI/Heatmap";

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
  deleted?: boolean;
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
  deleted?: boolean;
}

export default function ExpenseTrackerHome() {
  const hideAmounts = useAppSelector((state) => state.amount.hideAmounts);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [visibleTotal, setVisibleTotal] = useState(0);
  const [hiddenCount, setHiddenCount] = useState(0);
  
  const dummyStories = [
    { id: "story-1", name: "Aman", color: "#ff2d55" },
    { id: "story-2", name: "Nia", color: "#34d399" },
    { id: "story-3", name: "Ravi", color: "#60a5fa" },
    { id: "story-4", name: "Zara", color: "#f97316" },
    { id: "story-5", name: "Leo", color: "#a855f7" },
    { id: "story-6", name: "Mia", color: "#facc15" },
  ];

  // Income tracking
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");

  // Fetch monthly income from profile on mount
  useEffect(() => {
    const fetchIncome = async () => {
      try {
        const res = await api.get('/api/profile/view');
        // Use typeof check to handle 0 as a valid value (0 is falsy but valid)
        if (typeof res.data?.monthlyIncome === 'number') {
          setMonthlyIncome(res.data.monthlyIncome);
        }
      } catch (err) {
        console.error('Failed to fetch income:', err);
      }
    };
    fetchIncome();
  }, []);

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const displayLabel = isToday ? "Today" : formattedDate;

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const changeDateBy = (days: number) => {
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

  const fetchExpenses = useCallback(async (hidden = false) => {
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
          ...(hidden ? { onlyHidden: true } : {}),
          includeHidden: true,
        },
        signal: abortControllerRef.current.signal,
      });

      const normalized = normalizeExpenses(res.data.data || []);
      const filtered = hidden
        ? normalized.filter((e) => e.deleted)
        : normalized.filter((e) => !e.deleted);

      if (!hidden && Array.isArray(res.data?.data)) {
        const hiddenInResponse = normalized.filter(e => e.deleted).length;
        setHiddenCount(hiddenInResponse);
      }

      if (!hidden) {
        const total = filtered.reduce((sum, e) => sum + e.amount, 0);
        setVisibleTotal(total);
      }
    } catch (err: unknown) {
      // Ignore aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error("Failed to load expenses", err);
      if (!hidden) setVisibleTotal(0);
    } finally {
      // Keep silent for now since the expenses section is hidden on the home page.
    }
  }, [apiDate]);

  // Debounce API calls when date changes rapidly
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchExpenses(showHidden);
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchExpenses, showHidden]);

  const totalForDay = visibleTotal;

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <main className="max-w-6xl mx-auto px-4 lg:px-8 pt-8 lg:pt-12 pb-4 lg:pb-6 space-y-8 lg:space-y-10">

        {/* Top Bar - Premium Glass Card - Compact & Centered */}
        <section className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.04)]">
          {/* Solid dark background with subtle gradient */}
          <div className="absolute inset-0 bg-[#0a0a0a]" />
          <div className="absolute inset-0 bg-linear-to-br from-white/6 via-transparent to-white/2" />
          {/* Visible border */}
          <div className="absolute inset-0 border border-white/20 rounded-2xl" />
          {/* Top accent line */}
          <div className="absolute top-0 left-[20%] right-[20%] h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
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
                <p className="text-xs text-white/40">Today's Spending</p>
                <p className="text-2xl font-bold">
                  {hideAmounts ? "₹•••••" : `₹${totalForDay.toFixed(0)}`}
                </p>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {(showHidden || hiddenCount > 0) && (
                  <button
                    onClick={() => setShowHidden(prev => !prev)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      showHidden ? "bg-amber-500/20 text-amber-400" : "bg-white/5 hover:bg-white/10 text-white/50"
                    }`}
                  >
                    {showHidden ? "👁 Visible" : `🙈 ${hiddenCount}`}
                  </button>
                )}
                
                {/* Income Input/Display */}
                {isEditingIncome ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-emerald-500/50">
                    <span className="text-white/60">₹</span>
                    <input
                      type="number"
                      value={incomeInput}
                      onChange={(e) => setIncomeInput(e.target.value)}
                      placeholder="Monthly income"
                      className="w-28 bg-transparent text-white text-sm font-medium focus:outline-none"
                      autoFocus
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const value = parseFloat(incomeInput) || 0;
                          setMonthlyIncome(value);
                          setIsEditingIncome(false);
                          try {
                            await api.patch('/api/profile/update', { monthlyIncome: value });
                          } catch (err) {
                            console.error('Failed to save income:', err);
                          }
                        } else if (e.key === 'Escape') {
                          setIsEditingIncome(false);
                        }
                      }}
                    />
                    <button
                      onClick={async () => {
                        const value = parseFloat(incomeInput) || 0;
                        setMonthlyIncome(value);
                        setIsEditingIncome(false);
                        try {
                          await api.patch('/api/profile/update', { monthlyIncome: value });
                        } catch (err) {
                          console.error('Failed to save income:', err);
                        }
                      }}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingIncome(false)}
                      className="text-white/40 hover:text-white/60 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIncomeInput(monthlyIncome > 0 ? monthlyIncome.toString() : "");
                      setIsEditingIncome(true);
                    }}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    {monthlyIncome > 0 ? (
                      <>
                        <div className="text-left">
                          <p className="text-[10px] text-white/40">Monthly Income</p>
                          <p className="text-sm font-medium text-white">
                            {hideAmounts ? "₹•••••" : `₹${monthlyIncome.toLocaleString()}`}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-lg ${
                          (totalForDay / monthlyIncome) * 100 > 3 ? 'bg-red-500/20' : 'bg-emerald-500/20'
                        }`}>
                          <p className={`text-sm font-bold ${
                            (totalForDay / monthlyIncome) * 100 > 3 ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {hideAmounts ? "••%" : `${((totalForDay / monthlyIncome) * 100).toFixed(1)}%`}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span className="text-white/50">💰</span>
                        <span className="text-sm text-white/50 group-hover:text-white/70">Set monthly income</span>
                      </>
                    )}
                  </button>
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
                <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Today's Spending</p>
                <p className="text-2xl font-bold">
                  {hideAmounts ? "₹•••••" : `₹${totalForDay.toFixed(0)}`}
                </p>
              </div>
              
              {/* Action Buttons - Centered Row */}
              <div className="flex items-center justify-center gap-2">
                {(showHidden || hiddenCount > 0) && (
                  <button
                    onClick={() => setShowHidden(prev => !prev)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors touch-manipulation ${
                      showHidden ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/50"
                    }`}
                  >
                    {showHidden ? "👁 Visible" : `🙈 ${hiddenCount}`}
                  </button>
                )}
                
                {/* Mobile Income Button */}
                <button
                  onClick={() => {
                    setIncomeInput(monthlyIncome > 0 ? monthlyIncome.toString() : "");
                    setIsEditingIncome(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 active:bg-white/10 transition-colors touch-manipulation"
                >
                  {monthlyIncome > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <p className={`text-[10px] font-bold ${
                        (totalForDay / monthlyIncome) * 100 > 3 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {hideAmounts ? "••%" : `${((totalForDay / monthlyIncome) * 100).toFixed(1)}%`}
                      </p>
                      <p className="text-[9px] text-white/30">of income</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/50">💰 Set income</p>
                  )}
                </button>

              </div>
              
              {/* Mobile Income Input Modal */}
              {isEditingIncome && (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/20">
                  <p className="text-xs text-white/50 mb-2">Enter your monthly income</p>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">₹</span>
                    <input
                      type="number"
                      value={incomeInput}
                      onChange={(e) => setIncomeInput(e.target.value)}
                      placeholder="e.g. 50000"
                      className="flex-1 bg-black/50 text-white text-base font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={async () => {
                        const value = parseFloat(incomeInput) || 0;
                        setMonthlyIncome(value);
                        setIsEditingIncome(false);
                        try {
                          await api.patch('/api/profile/update', { monthlyIncome: value });
                        } catch (err) {
                          console.error('Failed to save income:', err);
                        }
                      }}
                      className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium active:bg-emerald-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingIncome(false)}
                      className="px-4 py-2 rounded-lg bg-white/10 text-white/70 text-sm font-medium active:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stories - Dummy Avatars */}
        <section className="max-w-4xl mx-auto">
          <div className="relative rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-[#0a0a0a]" />
            <div className="absolute inset-0 bg-linear-to-br from-white/6 via-transparent to-white/3" />
            <div className="absolute inset-0 border border-white/15 rounded-lg" />
            <div className="relative px-3 py-2.5">
              <div className="mb-2" />

              <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory">
                <div className="flex flex-col items-center gap-1 min-w-14 snap-start">
                  <button
                    type="button"
                    className="relative w-12 h-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center"
                    aria-label="Create story"
                  >
                    <span className="text-base text-white/60">+</span>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#ff2d55] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-black">
                      +
                    </span>
                  </button>
                  <span className="text-[9px] text-white/50 truncate w-14 text-center">
                    Your Story
                  </span>
                </div>

                {dummyStories.map((story) => (
                  <div key={story.id} className="flex flex-col items-center gap-1 min-w-14 snap-start">
                    <div
                      className="w-12 h-12 rounded-full p-0.5"
                      style={{ background: `conic-gradient(from 180deg, ${story.color}, #ffffff33)` }}
                    >
                      <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-white/90">
                          {story.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-white/50 truncate w-14 text-center">
                      {story.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Transaction Activity Heatmap */}
        <section className="max-w-3xl mx-auto">
          <Heatmap />
        </section>

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

    </div>
  );
}