import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import { Activity, Plus } from "lucide-react";
const loadAddExpenseModal = () => import("./AddExpenseModal");
const AddExpenseModal = lazy(loadAddExpenseModal);
import api from "../routeWrapper/Api"; // axios instance with auth token
import { useAppSelector } from "../store/hooks";
import { useIdlePrefetch } from "../hooks/useIdlePrefetch";
import ExpenseDay from "./ExpenseDay";
import HomeTopBar from "./HomeTopBar.tsx";

const CalendarPicker = lazy(() =>
  import("../utils/UI/CalendarPicker").then((module) => ({
    default: module.CalendarPicker,
  }))
);
const ExpenseHeatmap = lazy(() => import("./ExpenseHeatmap"));

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
  const [showActivity, setShowActivity] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("showActivity") === "true";
  });
  const dayLimit = 8;

  useIdlePrefetch(loadAddExpenseModal, {
    idleTimeoutMs: 3000,
    fallbackDelayMs: 2500,
  });

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

  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) {
      return new Date();
    }
    return new Date(year, month - 1, day);
  };

  const handleHeatmapSelect = (dateStr: string) => {
    setDayPage(1);
    setSelectedDate(parseLocalDate(dateStr));
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
    const handleExpenseAdded = () => {
      fetchExpenses();
    };

    window.addEventListener("expense:added", handleExpenseAdded as EventListener);
    return () => {
      window.removeEventListener("expense:added", handleExpenseAdded as EventListener);
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
        <div className="absolute top-24 right-[-10%] h-112 w-md rounded-full bg-sky-500/10 blur-[160px]" />
        <div className="absolute bottom-[-15%] left-[10%] h-104 w-104 rounded-full bg-amber-500/8 blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.04),transparent_35%)]" />
      </div>

      <main className="relative max-w-5xl mx-auto px-4 lg:px-8 pt-4 pb-4 lg:pb-6 space-y-10 lg:space-y-12">

        <HomeTopBar
          displayLabel={displayLabel}
          hideAmounts={hideAmounts}
          totalForDay={totalForDay}
          isToday={isToday}
          ribbonLoading={ribbonLoading}
          ribbonDays={ribbonDays}
          ribbonMap={ribbonMap}
          apiDate={apiDate}
          today={today}
          onChangeDate={changeDateBy}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          onSelectRibbonDay={handleRibbonSelect}
          getFormattedDate={getFormattedDate}
        />

        <section className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/12 bg-[#0b0b0b] backdrop-blur-xl p-2">
            <ul className="space-y-2">
              <li className="rounded-xl border border-white/10 bg-white/2 px-3 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 flex items-center justify-center">
                    <Plus size={16} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Quick Add</p>
                    <p className="text-sm font-semibold text-white">Add Expense</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="h-8 rounded-lg bg-white text-black px-3 text-[11px] font-semibold hover:bg-white/90 transition-colors"
                  aria-label="Add expense"
                >
                  Open
                </button>
              </li>

              <li className="rounded-xl border border-white/10 bg-white/2 px-3 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-200 flex items-center justify-center">
                    <Activity size={16} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Activity</p>
                    <p className="text-sm font-semibold text-white">Expense Heatmap</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowActivity((prev) => {
                      const next = !prev;
                      localStorage.setItem("showActivity", String(next));
                      return next;
                    });
                  }}
                  className={
                    "h-8 rounded-lg border px-3 text-[11px] font-semibold transition-colors " +
                    (showActivity
                      ? "border-sky-300/60 bg-sky-400/20 text-sky-200 hover:bg-sky-400/30"
                      : "border-white/15 text-white/70 hover:text-white hover:border-white/30")
                  }
                >
                  {showActivity ? "Hide" : "Show"}
                </button>
              </li>
            </ul>
          </div>
        </section>

        {showActivity && (
          <Suspense
            fallback={(
              <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/3 px-4 py-6 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-emerald-300/25 border-t-emerald-300 animate-spin" />
              </div>
            )}
          >
            <ExpenseHeatmap onDateClick={(dateStr) => handleHeatmapSelect(dateStr)} />
          </Suspense>
        )}


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

      {isCalendarOpen && (
        <Suspense
          fallback={(
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-300/25 border-t-emerald-300 animate-spin shadow-[0_0_14px_rgba(52,211,153,0.35)]" />
            </div>
          )}
        >
          <CalendarPicker
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            maxDate={today}
          />
        </Suspense>
      )}

      {showAddExpense && (
        <Suspense
          fallback={(
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-300/25 border-t-emerald-300 animate-spin shadow-[0_0_14px_rgba(52,211,153,0.35)]" />
            </div>
          )}
        >
          <AddExpenseModal
            open={showAddExpense}
            onClose={() => setShowAddExpense(false)}
          />
        </Suspense>
      )}

    </div>
  );
}