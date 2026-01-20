import { useState, useEffect, useCallback } from "react";
import { CalendarPicker } from "../utils/UI/CalendarPicker";
import api from "../routeWrapper/Api"; // axios instance with auth token
import { showTopToast } from "../utils/Redirecttoast";
import EditExpenseModal from "./EditExpenseModal";
import { AmountText } from "./Amount";
import { useAppSelector } from "../store/hooks";

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
  const hideAmounts = useAppSelector((state) => state.amount.hideAmounts);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
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
      setShowAll(false);

      if (!hidden) {
        const total = filtered.reduce((sum, e) => sum + e.amount, 0);
        setVisibleTotal(total);
      }
    } catch (err) {
      console.error("Failed to load expenses", err);
      setExpenses([]);
      if (!hidden) setVisibleTotal(0);
    } finally {
      setLoading(false);
    }
  }, [apiDate]);

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
  const INITIAL_LIMIT = 6;
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

  /* ---------------- Expense Card (Responsive) ---------------- */
  const MobileExpenseCard = ({ e, index, onAction, isPending }: { e: Expense; index: number; onAction: (id: string) => void; isPending: boolean }) => {
    const emoji = e.emoji || e.category?.emoji || "✨";
    const timeLabel = formatLocalTime(e.occurredAt);
    const [showActions, setShowActions] = useState(false);

    return (
      <div
        className="group relative bg-[#0a0a0a] rounded-2xl overflow-hidden active:scale-[0.98] lg:active:scale-100 lg:hover:bg-[#111] transition-all touch-manipulation cursor-pointer"
        style={{ animation: `slideUp 0.3s ease-out ${index * 0.05}s both` }}
        onClick={() => setShowActions(!showActions)}
      >
        {/* Subtle gradient accent */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 opacity-80"
          style={{ background: `linear-gradient(90deg, ${e.category.color}, transparent)` }}
        />
        
        <div className="p-4">
          {/* Main content row */}
          <div className="flex items-center gap-3">
            {/* Emoji avatar */}
            <div 
              className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${e.category.color}15` }}
            >
              {emoji}
            </div>
            
            {/* Category & Notes */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-white truncate">{e.category.name}</p>
              <p className="text-[13px] text-white/40 truncate">
                {e.notes || "No notes"}
              </p>
            </div>
            
            {/* Amount */}
            <div className="text-right shrink-0">
              <p className="text-lg font-bold" style={{ color: e.category.color }}>
                <AmountText value={e.amount} />
              </p>
              <p className="text-[11px] text-white/30">{timeLabel}</p>
            </div>
          </div>
          
          {/* Payment mode tag */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span 
              className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide"
              style={{ background: `${e.category.color}12`, color: e.category.color }}
            >
              {e.payment_mode || "Cash"}
            </span>
            <span className="text-[11px] text-white/25 lg:hidden">tap for actions</span>
            
            {/* Desktop hover actions */}
            <div className="hidden lg:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                onClick={(ev) => { ev.stopPropagation(); onAction(e._id); }}
                disabled={isPending}
                className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isPending ? "..." : "🗑️ Hide"}
              </button>
            </div>
          </div>
          
          {/* Mobile slide-up actions */}
          <div className={`lg:hidden overflow-hidden transition-all duration-200 ${showActions ? 'max-h-16 mt-3' : 'max-h-0'}`}>
            <div className="flex gap-2">
              <button
                onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 active:bg-white/10 text-white/70 text-sm font-medium transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                onClick={(ev) => { ev.stopPropagation(); onAction(e._id); }}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500/10 active:bg-red-500/20 text-red-400 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isPending ? "..." : "🗑️ Hide"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---------------- Quick Expense Row (for inline list) ---------------- */
  const QuickExpenseRow = ({ e, index, onAction, isPending }: { e: Expense; index: number; onAction: (id: string) => void; isPending: boolean }) => {
    const emoji = e.emoji || e.category?.emoji || "✨";
    const timeLabel = formatLocalTime(e.occurredAt);

    return (
      <div
        className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 active:bg-white/5 transition-colors touch-manipulation"
        style={{ animation: `fadeIn 0.2s ease-out ${index * 0.03}s both` }}
        onClick={() => openEdit(e)}
      >
        {/* Emoji */}
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ background: `${e.category.color}12` }}
        >
          {emoji}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-white truncate">{e.category.name}</p>
          <p className="text-[11px] text-white/35">{timeLabel} • {e.payment_mode || "Cash"}</p>
        </div>
        
        {/* Amount */}
        <p className="text-[15px] font-bold shrink-0" style={{ color: e.category.color }}>
          <AmountText value={e.amount} />
        </p>
        
        {/* Quick hide button */}
        <button
          onClick={(ev) => { ev.stopPropagation(); onAction(e._id); }}
          disabled={isPending}
          className="p-2 rounded-lg text-white/20 active:text-red-400 active:bg-red-500/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  /* ---------------- Responsive Expense List ---------------- */
  const MobileExpenseList = () => {
    const action = showHidden ? handleRestore : handleHide;
    if (displayedExpenses.length === 0) return null;

    return (
      <>
        {/* Desktop Grid Layout - 3 columns */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-3 gap-4">
            {displayedExpenses.map((e, idx) => (
              <MobileExpenseCard
                key={e._id}
                e={e}
                index={idx}
                onAction={action}
                isPending={pendingId === e._id}
              />
            ))}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-4">
          {/* Featured cards - first 2 */}
          <div className="space-y-3">
            {displayedExpenses.slice(0, 2).map((e, idx) => (
              <MobileExpenseCard
                key={e._id}
                e={e}
                index={idx}
                onAction={action}
                isPending={pendingId === e._id}
              />
            ))}
          </div>
          
          {/* Compact list for remaining */}
          {displayedExpenses.length > 2 && (
            <div className="bg-[#0a0a0a] rounded-2xl px-4">
              {displayedExpenses.slice(2).map((e, idx) => (
                <QuickExpenseRow
                  key={e._id}
                  e={e}
                  index={idx + 2}
                  onAction={action}
                  isPending={pendingId === e._id}
                />
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  /* ---------------- Show More View - Flippable Card ---------------- */
  const FlippableCard = ({ e, index, onAction, isPending, actionLabel }:  { e: Expense; index: number; onAction: (id: string) => void; isPending: boolean; actionLabel: string }) => {
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
            <div className="absolute inset-0 bg-gradient-to-r from-theme-bg-secondary/95 to-theme-bg-primary/95 backdrop-blur-md" />

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
                <span className="text-sm font-medium text-theme-text-primary truncate">
                  {e.category. name}
                </span>
              </div>

              {/* Time */}
              <span className="text-[11px] text-theme-text-muted flex-shrink-0">
                {formatLocalTime(e.occurredAt)}
              </span>

              {/* Notes + Payment */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className="text-[11px] text-theme-text-muted truncate">
                  {e.notes || '—'}
                </p>
                {hasLongNotes && (
                  <span className="text-[9px] text-theme-text-dim bg-theme-bg-button px-1.5 py-0.5 rounded shrink-0">
                    hover to read
                  </span>
                )}
                <span className="inline-flex shrink-0 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] bg-theme-bg-button/60" style={{ color: e.category.color }}>
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
                    <AmountText value={e.amount} />
                  </span>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  {confirmActionId === e._id ? (
                    <>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); onAction(e._id); setConfirmActionId(null); }}
                        disabled={isPending}
                        className="px-2.5 py-1 text-[10px] rounded-md bg-theme-accent hover:bg-theme-accent-hover border border-blue-900 text-white disabled:opacity-50 whitespace-nowrap text-right"
                      >
                        Confirm {actionLabel}
                      </button>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setConfirmActionId(null); }}
                        className="px-2 py-1 text-[10px] rounded-md bg-theme-bg-button hover:bg-theme-bg-button-hover border border-theme-border-subtle text-theme-text-secondary whitespace-nowrap text-right ml-1"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setConfirmActionId(e._id); }}
                        disabled={isPending}
                        className="px-2.5 py-1 text-[10px] rounded-md bg-theme-bg-button hover:bg-theme-bg-button-hover border border-theme-border-subtle text-theme-text-secondary disabled:opacity-50 whitespace-nowrap text-right"
                      >
                        {isPending ? "Saving…" : actionLabel}
                      </button>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                        className="px-2.5 py-1 text-[10px] rounded-md bg-theme-bg-tertiary hover:bg-theme-bg-button border border-theme-border-subtle text-theme-text-secondary whitespace-nowrap text-right"
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
              <div className="absolute inset-0 bg-gradient-to-br from-theme-bg-secondary to-theme-bg-primary" />

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
                  <p className="text-[10px] text-theme-text-secondary mb-0.5">Notes</p>
                  <p className="text-xs text-theme-text-secondary line-clamp-2">
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
                    <AmountText value={e.amount} />
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
    <div className="min-h-screen bg-black text-white pb-28">
      <main className="max-w-6xl mx-auto px-4 lg:px-8 pt-6 lg:pt-8 pb-4 lg:pb-6 space-y-6 lg:space-y-8">

        {/* Top Bar - Premium Glass Card */}
        <section className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.03)]">
          {/* Solid dark background with subtle gradient */}
          <div className="absolute inset-0 bg-[#0a0a0a]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.02]" />
          {/* Visible border */}
          <div className="absolute inset-0 border border-white/10 rounded-2xl lg:rounded-3xl" />
          {/* Top accent line */}
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-white/[0.08] to-transparent" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/[0.05] to-transparent" />
          
          <div className="relative px-4 lg:px-6 pt-4 pb-4 lg:pt-5 lg:pb-5">
            {/* Desktop Layout */}
            <div className="hidden lg:flex items-center justify-between gap-8">
              {/* Date Navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => changeDateBy(-1)}
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/60 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
                >
                  <svg className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-xl font-bold">{displayLabel}</p>
                  <svg className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => changeDateBy(1)}
                  disabled={isToday}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isToday ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-white/5 hover:bg-white/10 text-white/60"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Center - Total */}
              <div className="flex-1 text-center">
                <p className="text-sm text-white/40">Today's Spending</p>
                <p className="text-3xl font-bold">
                  {hideAmounts ? "₹•••••" : `₹${totalForDay.toFixed(0)}`}
                </p>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-4">
                {(showHidden || hiddenCount > 0) && (
                  <button
                    onClick={() => setShowHidden(prev => !prev)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      showHidden ? "bg-amber-500/20 text-amber-400" : "bg-white/5 hover:bg-white/10 text-white/50"
                    }`}
                  >
                    {showHidden ? "👁 Show Visible" : `🙈 ${hiddenCount} Hidden`}
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

            {/* Mobile Layout */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => changeDateBy(-1)}
                  className="w-10 h-10 bg-white/5 active:bg-white/10 rounded-xl flex items-center justify-center text-white/60 transition-colors touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex-1 mx-2 py-2.5 px-4 bg-white/5 active:bg-white/10 rounded-xl transition-colors touch-manipulation flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-base font-bold">{displayLabel}</p>
                  <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => changeDateBy(1)}
                  disabled={isToday}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors touch-manipulation ${
                    isToday ? "bg-white/5 text-white/20" : "bg-white/5 active:bg-white/10 text-white/60"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider">Today's Spending</p>
                  <p className="text-2xl font-bold">
                    {hideAmounts ? "₹•••••" : `₹${totalForDay.toFixed(0)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {(showHidden || hiddenCount > 0) && (
                    <button
                      onClick={() => setShowHidden(prev => !prev)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors touch-manipulation ${
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
                    className="px-3 py-1.5 rounded-xl bg-white/5 active:bg-white/10 transition-colors touch-manipulation"
                  >
                    {monthlyIncome > 0 ? (
                      <>
                        <p className={`text-xs font-bold ${
                          (totalForDay / monthlyIncome) * 100 > 3 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {hideAmounts ? "••%" : `${((totalForDay / monthlyIncome) * 100).toFixed(1)}%`}
                        </p>
                        <p className="text-[9px] text-white/30">of income</p>
                      </>
                    ) : (
                      <p className="text-xs text-white/50">💰 Set</p>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Mobile Income Input Modal */}
              {isEditingIncome && (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
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

        {/* Expenses Section - Separate Card */}
        <section className="relative">
          {/* Section divider line - more visible */}
          <div className="absolute -top-3 lg:-top-4 left-0 right-0 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-white/5 via-white/20 to-white/5" />
          </div>
          {/* Section header - Premium style */}
          <div className="flex items-center justify-between mb-4 lg:mb-6 pt-2">
            <div className="flex items-center gap-3">
              {/* Icon badge - more visible */}
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#111] border border-white/15 flex items-center justify-center shadow-sm">
                <span className="text-base lg:text-lg">📝</span>
              </div>
              <div>
                <h3 className="text-base lg:text-xl font-semibold text-white">Expenses</h3>
                {expenses.length > 0 && (
                  <p className="text-[10px] lg:text-xs text-white/40">
                    {showAll
                      ? `All ${expenses.length} transactions`
                      : `${Math.min(INITIAL_LIMIT, expenses.length)} of ${expenses.length}`
                    }
                  </p>
                )}
              </div>
            </div>

            {hasMoreThanLimit && (
              <button
                onClick={() => setShowAll(!showAll)}
                className={`px-3 py-1.5 lg:px-5 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-medium transition-all touch-manipulation ${
                  showAll
                    ? 'bg-white/[0.04] border border-white/[0.08] text-white/70 hover:bg-white/[0.08]'
                    : 'bg-white/90 text-black hover:bg-white'
                }`}
              >
                {showAll ? '← Cards' : `View All ${expenses.length}`}
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 lg:py-32">
              <div className="animate-spin rounded-full h-8 w-8 lg:h-10 lg:w-10 border-2 border-white/20 border-t-white"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && expenses.length === 0 && (
            <div className="text-center py-16 lg:py-24 px-6">
              <div className="w-20 h-20 lg:w-28 lg:h-28 mx-auto mb-4 lg:mb-6 rounded-2xl lg:rounded-3xl bg-white/5 flex items-center justify-center">
                <span className="text-4xl lg:text-6xl">💸</span>
              </div>
              <p className="text-white/60 font-medium lg:text-lg">No expenses for {displayLabel}</p>
              <p className="text-xs lg:text-sm text-white/30 mt-1 lg:mt-2">Tap + to add your first expense</p>
            </div>
          )}

          {/* Expense List */}
          {!loading && expenses.length > 0 && (
            <>
              {!showAll ? (
                <MobileExpenseList />
              ) : (
                <div className="space-y-2">
                  {expenses.map((e, index) => (
                    <FlippableCard
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

      <EditExpenseModal
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        onUpdate={handleEditUpdate}
      />
    </div>
  );
}