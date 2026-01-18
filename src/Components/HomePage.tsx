import { useState, useEffect, useCallback } from "react";
import { CalendarPicker } from "../utils/UI/CalendarPicker";
import api from "../routeWrapper/Api"; // axios instance with auth token
import { showTopToast } from "../utils/Redirecttoast";
import EditExpenseModal from "./EditExpenseModal";
import { AmountText } from "./Amount";
import { useAmountVisibility } from "../store/amountStore";

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
  currency?: string;
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
  currency?: string;
}

export default function ExpenseTrackerHome() {
  const { hideAmounts } = useAmountVisibility();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmActionId, setConfirmActionId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [visibleTotal, setVisibleTotal] = useState(0);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
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

  // Convert JS Date → YYYY-MM-DD (using local date to avoid timezone issues)
  const getFormattedDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const apiDate = getFormattedDate(selectedDate);

  const formatLocalTime = (iso: string) => {
    const d = new Date(iso);
    // Backend stores IST time directly, just display it as-is
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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

  const fetchExpenses = useCallback(async (hidden = false) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/expense/${apiDate}`, {
        params: {
          tzOffsetMinutes: new Date().getTimezoneOffset(),
          ...(hidden ? { onlyHidden: true } : {}),
          includeHidden: true,
        },
      });

      const normalized = normalizeExpenses(res.data.data || []);
      const filtered = hidden
        ? normalized.filter((e) => e.deleted)
        : normalized.filter((e) => !e.deleted);

      if (!hidden && Array.isArray(res.data?.data)) {
        const hiddenInResponse = normalized.filter(e => e.deleted).length;
        setHiddenCount(hiddenInResponse);
      }

      setExpenses(filtered);
      setHasNext(false);
      setLoadingMore(false);
      setShowAll(false);

      if (!hidden) {
        const total = filtered.reduce((sum, e) => sum + e.amount, 0);
        setVisibleTotal(total);
      }
    } catch (err) {
      console.error("Failed to load expenses", err);
      setExpenses([]);
      setHasNext(false);
      setLoadingMore(false);
      if (!hidden) setVisibleTotal(0);
    } finally {
      setLoading(false);
    }
  }, [apiDate]);

  const loadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    // No pagination for daily view now
    setLoadingMore(false);
  };

  const handleHide = async (id: string) => {
    if (pendingId === id) return;
    setPendingId(id);
    const target = expenses.find(exp => exp._id === id);
    try {
      await api.patch(`/api/expense/${id}/hide`, { hide: true });
      setExpenses(prev => prev.filter(exp => exp._id !== id));
      if (!showHidden && target) {
        setVisibleTotal(prev => Math.max(0, prev - target.amount));
      }
      setHiddenCount(prev => prev + 1);
      showTopToast("Expense hidden from history", { tone: "info" });
    } catch (err) {
      console.error("Failed to hide expense", err);
      showTopToast("Failed to hide expense", { tone: "error" });
    } finally {
      setPendingId(null);
    }
  };

  const handleRestore = async (id: string) => {
    if (pendingId === id) return;
    setPendingId(id);
    const target = expenses.find(exp => exp._id === id);
    const remainingHidden = Math.max(0, hiddenCount - 1);
    try {
      await api.patch(`/api/expense/${id}/hide`, { hide: false });
      setExpenses(prev => prev.filter(exp => exp._id !== id));
      if (target) {
        setVisibleTotal(prev => prev + target.amount);
      }
      setHiddenCount(remainingHidden);
      showTopToast("Expense restored", { tone: "success" });

      // If we just restored the last hidden expense, switch back to visible view
      if (showHidden && remainingHidden === 0) {
        setShowHidden(false);
        await fetchExpenses(false);
      }
    } catch (err) {
      console.error("Failed to restore expense", err);
      showTopToast("Failed to restore expense", { tone: "error" });
    } finally {
      setPendingId(null);
    }
  };

  const openEdit = (exp: Expense) => {
    setEditingExpense(exp);
  };

  const handleEditUpdate = () => {
    fetchExpenses(showHidden);
    setEditingExpense(null);
  };

  useEffect(() => {
    fetchExpenses(showHidden);
  }, [fetchExpenses, showHidden]);

  useEffect(() => {
    const handler = () => fetchExpenses(showHidden);
    window.addEventListener("expense:added", handler);
    return () => window.removeEventListener("expense:added", handler);
  }, [fetchExpenses, showHidden]);

  /* ---------------- Compute total ---------------- */

  const visibleSum = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalForDay = showHidden ? visibleTotal : visibleSum;

  /* ---------------- Determine which expenses to show ---------------- */
  const INITIAL_LIMIT = 8;
  const hasMoreThanLimit = expenses.length > INITIAL_LIMIT;
  const displayedExpenses = showAll ?  expenses : expenses.slice(0, INITIAL_LIMIT);

  /* ---------------- Date controls ---------------- */

  const changeDateBy = (days: number) => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate. setDate(newDate.getDate() + days);
      if (newDate > today) {
        return prevDate;
      }
      return newDate;
    });
  };

  /* ---------------- Handle Calendar Date Selection ---------------- */
  const handleDateSelect = (date: Date) => {
    const normalizedDate = new Date(date. getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(normalizedDate);
    setIsCalendarOpen(false);
  };

  /* ---------------- Initial View - Compact Tile Style ---------------- */
  const GlassCard = ({ e, index, onAction, isPending, actionLabel }: { e: Expense; index: number; onAction: (id: string) => void; isPending: boolean; actionLabel: string }) => {
    const emoji = e.emoji || e.category?.emoji || "✨";
    const timeLabel = formatLocalTime(e.occurredAt);

    return (
      <div
        className="group relative overflow-hidden rounded-lg border border-gray-800 bg-[#0f1117] cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg/30"
        style={{ animation: `floatIn 0.5s ease-out ${index * 0.06}s both` }}
      >
        {confirmActionId === e._id ? (
          <div className="absolute top-2 right-2 z-20 flex gap-1">
            <button
              onClick={(ev) => { ev.stopPropagation(); onAction(e._id); setConfirmActionId(null); }}
              disabled={isPending}
              className="px-2 py-1 text-[10px] rounded-md bg-blue-700 hover:bg-blue-800 border border-blue-900 text-white disabled:opacity-50 whitespace-nowrap text-right"
            >
              Confirm {actionLabel}
            </button>
            <button
              onClick={(ev) => { ev.stopPropagation(); setConfirmActionId(null); }}
              className="px-2 py-1 text-[10px] rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 whitespace-nowrap text-right"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={(ev) => { ev.stopPropagation(); setConfirmActionId(e._id); }}
            disabled={isPending}
            className="absolute top-2 right-2 z-20 px-2 py-1 text-[10px] rounded-md bg-gray-800/90 hover:bg-gray-700 border border-gray-700 text-gray-200 disabled:opacity-50"
          >
            {isPending ? "Saving…" : actionLabel}
          </button>
        )}
        {/* Pattern + tint */}
        {/* Content */}
        <div className="relative z-10 p-2.5 sm:p-3 space-y-1.5 pr-2">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-semibold"
                style={{
                  background: `${e.category.color}22`,
                  color: e.category.color,
                }}
              >
                {emoji}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-400 leading-tight">{timeLabel}</p>
                <p className="text-sm font-semibold text-white truncate">{e.category.name}</p>
              </div>
            </div>

            <div className="ml-auto flex items-start gap-2">
              <div className="text-right shrink-0 pr-1">
                <p className="text-[10px] text-gray-500">Amount</p>
                <p className="text-sm sm:text-base font-bold" style={{ color: e.category.color }}>
                  <AmountText value={e.amount} className="" />
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0 pt-0.5 sm:pt-0">
                <button
                  onClick={(ev) => { ev.stopPropagation(); onAction(e._id); }}
                  disabled={isPending}
                  className="px-2.5 py-1 text-[10px] rounded-md bg-gray-800/90 hover:bg-gray-700 border border-gray-700 text-gray-200 disabled:opacity-50 whitespace-nowrap text-right"
                >
                  {isPending ? "Saving…" : actionLabel}
                </button>
                <button
                  onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                  className="px-2.5 py-1 text-[10px] rounded-md bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 whitespace-nowrap text-right"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-400 flex-wrap">
            <span className="truncate leading-tight flex-1 min-w-0">
              {e.notes || "No notes"}
            </span>
            <span className="inline-flex shrink-0 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap" style={{ background: `${e.category.color}1a`, color: e.category.color }}>
              {e.payment_mode?.toUpperCase?.() || ""}
            </span>
          </div>
        </div>
      </div>
    );
  };

  /* ---------------- Show More View - Flippable Card ---------------- */
  const ExpenseCard = ({ e, index, onAction, isPending, actionLabel }:  { e: Expense; index: number; onAction: (id: string) => void; isPending: boolean; actionLabel: string }) => {
    const emoji = e.emoji || e.category?.emoji || "✨";
    const hasLongNotes = e.notes && e.notes.length > 30;

    return (
      <div
        className="group relative cursor-pointer"
        style={{
          animation:  `slideIn 0.4s ease-out ${index * 0.05}s both`,
          perspective: '1000px',
        }}
      >
        <div
          className={`relative transition-transform duration-500 ${hasLongNotes ?  'group-hover:[transform:rotateX(180deg)]' : ''}`}
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Front Side */}
          <div
            className="relative overflow-hidden rounded-xl"
            style={{
              backfaceVisibility:  'hidden',
            }}
          >
            {/* Gradient background based on category color */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                background:  `linear-gradient(90deg, ${e. category.color} 0%, transparent 40%)`
              }}
            />

            {/* Dark glass background */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-md" />

            {/* Left color accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 group-hover: w-1 transition-all duration-300"
              style={{ backgroundColor: e.category.color }}
            />

            {/* Content - Single row layout */}
            <div className="relative flex items-center px-4 py-3 gap-3 sm:gap-4">

              {/* Emoji + Category */}
              <div className="flex items-center gap-2 min-w-[120px]">
                {/* Emoji or Color Dot */}
                {emoji ? (
                  <span className="text-lg flex-shrink-0" role="img" aria-label={e.category.name}>
                    {emoji}
                  </span>
                ) : (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: e.category.color }}
                  />
                )}
                <span className="text-sm font-medium text-white truncate">
                  {e.category. name}
                </span>
              </div>

              {/* Time */}
              <span className="text-[11px] text-gray-500 flex-shrink-0">
                {formatLocalTime(e.occurredAt)}
              </span>

              {/* Notes + Payment */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className="text-[11px] text-gray-500 truncate">
                  {e.notes || '—'}
                </p>
                {hasLongNotes && (
                  <span className="text-[9px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded shrink-0">
                    hover to read
                  </span>
                )}
                <span className="inline-flex shrink-0 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] bg-gray-800/60" style={{ color: e.category.color }}>
                  {e.payment_mode?.toUpperCase?.() || ''}
                </span>
              </div>

              {/* Amount */}
              <div className="ml-auto flex items-start gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                <div className="flex items-baseline gap-0.5 shrink-0 pr-1 text-right">
                  <span
                    className="font-semibold text-base"
                    style={{ color: e.category.color }}
                  >
                    <AmountText value={e.amount} className="" />
                  </span>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  {confirmActionId === e._id ? (
                    <>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); onAction(e._id); setConfirmActionId(null); }}
                        disabled={isPending}
                        className="px-2.5 py-1 text-[10px] rounded-md bg-blue-700 hover:bg-blue-800 border border-blue-900 text-white disabled:opacity-50 whitespace-nowrap text-right"
                      >
                        Confirm {actionLabel}
                      </button>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setConfirmActionId(null); }}
                        className="px-2 py-1 text-[10px] rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 whitespace-nowrap text-right ml-1"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setConfirmActionId(e._id); }}
                        disabled={isPending}
                        className="px-2.5 py-1 text-[10px] rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 disabled:opacity-50 whitespace-nowrap text-right"
                      >
                        {isPending ? "Saving…" : actionLabel}
                      </button>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                        className="px-2.5 py-1 text-[10px] rounded-md bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 whitespace-nowrap text-right"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Hover border effect */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                boxShadow: `inset 0 0 0 1px ${e.category.color}30`,
              }}
            />
          </div>

          {/* Back Side - Full Notes */}
          {hasLongNotes && (
            <div
              className="absolute inset-0 overflow-hidden rounded-xl [transform:rotateX(180deg)]"
              style={{
                backfaceVisibility: 'hidden',
              }}
            >
              {/* Background */}
              <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                  background: `linear-gradient(135deg, ${e. category.color} 0%, transparent 60%)`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />

              {/* Left color accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: e.category. color }}
              />

              {/* Content */}
              <div className="relative flex items-center px-4 py-3 gap-4 h-full">
                {/* Emoji or Notes icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${e.category. color}20` }}
                >
                  {emoji ? (
                    <span className="text-lg" role="img" aria-label={e.category.name}>
                      {emoji}
                    </span>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      style={{ color: e.category.color }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>

                {/* Full notes text */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 mb-0.5">Notes</p>
                  <p className="text-xs text-gray-300 line-clamp-2">
                    {e.notes}
                  </p>
                </div>

                {/* Amount badge */}
                <div
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: `${e.category. color}20` }}
                >
                  <span
                    className="font-semibold text-sm"
                    style={{ color: e.category.color }}
                  >
                    <AmountText value={e.amount} className="" />
                  </span>
                </div>
              </div>

              {/* Border */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 0 1px ${e.category.color}40`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* Top Bar */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">

            {/* Left – Date */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => changeDateBy(-1)}
                className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors flex items-center justify-center"
              >
                &lt;
              </button>

              <span className="text-lg font-semibold min-w-[120px] text-center flex-1">{displayLabel}</span>

              <button
                onClick={() => changeDateBy(1)}
                disabled={isToday}
                className={`w-9 h-9 rounded-md transition-colors flex items-center justify-center ${
                  isToday
                    ? "bg-gray-900 text-gray-600 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                &gt;
              </button>
            </div>

            {/* Right – Calendar + Total */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  onTouchEnd={(e) => { e.preventDefault(); setIsCalendarOpen(true); }}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${isToday
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600"
                    }
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Calendar
                </button>

                {(showHidden || hiddenCount > 0) && (
                  <button
                    onClick={() => setShowHidden(prev => !prev)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${showHidden
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                      }
                    `}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {showHidden ? (
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z" />
                      ) : (
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22" />
                      )}
                    </svg>
                    {showHidden ? "Show visible" : `${hiddenCount} hidden`}
                  </button>
                )}
              </div>

              {/* Income & Percentage */}
              <div className="flex items-center gap-3">
                {isEditingIncome ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 text-xs">₹</span>
                    <input
                      type="number"
                      value={incomeInput}
                      onChange={(e) => setIncomeInput(e.target.value)}
                      placeholder="Monthly income"
                      className="w-24 bg-zinc-800 text-white text-xs px-2 py-1 rounded border border-zinc-700 focus:outline-none focus:border-emerald-500"
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
                      className="text-emerald-400 text-xs hover:text-emerald-300"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIncomeInput(monthlyIncome > 0 ? monthlyIncome.toString() : "");
                      setIsEditingIncome(true);
                    }}
                    className="text-right hover:bg-zinc-800/50 rounded px-2 py-1 transition-colors"
                  >
                    {monthlyIncome > 0 ? (
                      <>
                        <p className="text-[10px] text-zinc-500">Monthly Income</p>
                        <p className="text-sm font-medium text-white">
                          {hideAmounts ? "₹•••••" : `₹${monthlyIncome.toLocaleString()}`}
                        </p>
                        <p className={`text-[10px] font-medium ${
                          (totalForDay / monthlyIncome) * 100 > 2.5 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {hideAmounts ? "••%" : `${((totalForDay / monthlyIncome) * 100).toFixed(1)}% today`}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-zinc-500 hover:text-zinc-300">+ Set income</p>
                    )}
                  </button>
                )}
              </div>

              <div className="text-right w-full sm:w-auto">
                <p className="text-xs text-gray-400">Total Expenses</p>
                <p className="text-2xl font-bold">
                  {hideAmounts ? "₹•••••" : `₹${totalForDay.toFixed(2)}`}
                </p>
                {showHidden && (
                  <p className="text-[10px] text-gray-500">Hidden items not counted</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Expenses */}
        <section>
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-bold">Expenses</h3>
                {expenses.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {showAll
                      ? `All ${expenses.length} transactions`
                      : `Showing ${Math.min(INITIAL_LIMIT, expenses.length)} of ${expenses.length}`
                    }
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Toggle Button */}
                <div className="flex items-center gap-3 flex-wrap">
                  {hasMoreThanLimit && (
                    <button
                      onClick={() => setShowAll(! showAll)}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105 ${
                        showAll
                          ? 'bg-gray-800 hover:bg-gray-700 text-white'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                      }`}
                    >
                      {showAll ?  '← Back to Cards' : `View All (${expenses.length})`}
                    </button>
                  )}

                  {showAll && hasNext && (
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}

            {!loading && expenses.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-2xl">💸</span>
                </div>
                <p className="text-gray-500">No expenses for {displayLabel}</p>
                <p className="text-xs text-gray-600 mt-1">Add your first expense to get started</p>
              </div>
            )}

            {!loading && expenses. length > 0 && (
              <>
                {! showAll ? (
                  /* Initial View - Glass Cards Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                    {displayedExpenses.map((e, index) => (
                      <GlassCard
                        key={e._id}
                        e={e}
                        index={index}
                        onAction={showHidden ? handleRestore : handleHide}
                        isPending={pendingId === e._id}
                        actionLabel={showHidden ? "Restore" : "Hide"}
                      />
                    ))}
                  </div>
                ) : (
                  /* Show More View - Flippable Slim Rows */
                  <div className="space-y-2">
                    {expenses.map((e, index) => (
                      <ExpenseCard
                        key={e._id}
                        e={e}
                        index={index}
                        onAction={showHidden ? handleRestore : handleHide}
                        isPending={pendingId === e._id}
                        actionLabel={showHidden ? "Restore" : "Hide"}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <style>{`
          @keyframes floatIn {
            from {
              opacity:  0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes slideIn {
            from {
              opacity:  0;
              transform: translateX(-20px);
            }
            to {
              opacity:  1;
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

      <EditExpenseModal
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        onUpdate={handleEditUpdate}
      />
    </div>
  );
}