import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import api from "../routeWrapper/Api";
import { showTopToast } from "../utils/Redirecttoast";

type ExpenseDayItem = {
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

type ExpenseDayProps = {
  dayExpenses: ExpenseDayItem[];
  displayLabel: string;
  apiDate: string;
  isToday: boolean;
  hideAmounts: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  totalAmount: number;
  hiddenCount: number;
  onPageChange: (page: number) => void;
  onExpenseHidden?: () => Promise<void> | void;
};

const ExpenseDay = ({
  dayExpenses,
  displayLabel,
  apiDate,
  isToday,
  hideAmounts,
  page,
  totalPages,
  totalCount,
  totalAmount,
  hiddenCount,
  onPageChange,
  onExpenseHidden,
}: ExpenseDayProps) => {
  const rupeeSymbol = String.fromCharCode(0x20B9);
  const hasTransactions = dayExpenses.length > 0;
  const safeTotalAmount = useMemo(() => totalAmount || 0, [totalAmount]);
  const [confirmHideExpenseId, setConfirmHideExpenseId] = useState<string | null>(null);
  const [hidingExpenseId, setHidingExpenseId] = useState<string | null>(null);
  const [hiddenModalOpen, setHiddenModalOpen] = useState(false);
  const [hiddenExpenses, setHiddenExpenses] = useState<ExpenseDayItem[]>([]);
  const [hiddenLoading, setHiddenLoading] = useState(false);
  const [restoringExpenseId, setRestoringExpenseId] = useState<string | null>(null);

  const expenseToHide = useMemo(
    () => dayExpenses.find((expense) => expense._id === confirmHideExpenseId) || null,
    [dayExpenses, confirmHideExpenseId]
  );

  const handleConfirmHide = async () => {
    if (!expenseToHide || hidingExpenseId) return;

    setHidingExpenseId(expenseToHide._id);
    try {
      await api.patch(`/api/expense/${expenseToHide._id}/hide`);
      showTopToast("Expense hidden", { duration: 1700 });
      window.dispatchEvent(new CustomEvent("expense:changed"));
      setConfirmHideExpenseId(null);
      await onExpenseHidden?.();
    } catch {
      showTopToast("Failed to hide expense", { tone: "error", duration: 2200 });
    } finally {
      setHidingExpenseId(null);
    }
  };

  const fetchHiddenExpenses = useCallback(async () => {
    setHiddenLoading(true);
    try {
      const res = await api.get(`/api/expense/${apiDate}/hidden`, {
        params: {
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        },
      });
      setHiddenExpenses(res.data?.data || []);
    } catch {
      setHiddenExpenses([]);
      showTopToast("Failed to load hidden expenses", { tone: "error", duration: 2000 });
    } finally {
      setHiddenLoading(false);
    }
  }, [apiDate]);

  useEffect(() => {
    if (!hiddenModalOpen) return;
    fetchHiddenExpenses();
  }, [hiddenModalOpen, fetchHiddenExpenses]);

  useEffect(() => {
    setHiddenModalOpen(false);
    setHiddenExpenses([]);
  }, [apiDate]);

  const handleRestoreExpense = async (expenseId: string) => {
    if (restoringExpenseId) return;
    setRestoringExpenseId(expenseId);
    try {
      await api.patch(`/api/expense/${expenseId}/restore`);
      showTopToast("Expense restored", { duration: 1700 });
      window.dispatchEvent(new CustomEvent("expense:changed"));
      await fetchHiddenExpenses();
      await onExpenseHidden?.();
    } catch {
      showTopToast("Failed to restore expense", { tone: "error", duration: 2200 });
    } finally {
      setRestoringExpenseId(null);
    }
  };

  return (
    <section className="max-w-5xl mx-auto">
      <div
        key={`expense-day-${dayExpenses.length}`}
        className="rounded-2xl border border-zinc-800 bg-zinc-950"
      >
        <div className="px-5 py-5">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">Daily Ledger</p>
              <h2 className="text-sm font-semibold text-white mt-1">
                {isToday ? "Today's Transactions" : "Transactions"}
              </h2>
              <p className="text-[11px] text-zinc-500">{displayLabel}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
                <span className="text-[11px] text-zinc-300">
                  Showing {dayExpenses.length} of {totalCount}
                </span>
              </div>
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setHiddenModalOpen(true)}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] text-zinc-300 hover:text-white hover:border-zinc-500 transition-all"
                >
                  Hidden ({hiddenCount})
                </button>
              )}
              <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
                <span className="text-[11px] text-zinc-300">
                  {hideAmounts ? `${rupeeSymbol}****` : `${rupeeSymbol}${safeTotalAmount.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {!hasTransactions ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center">
              <p className="text-xs font-semibold text-zinc-300">No transactions yet</p>
              <p className="text-[11px] text-zinc-500 mt-1">Log an expense to populate this list.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayExpenses.map((expense) => {
                const occurredAt = new Date(expense.occurredAt);
                return (
                  <div
                    key={expense._id}
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-3.5 transition-all hover:border-zinc-700 hover:bg-zinc-900 active:scale-[0.995]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {expense.category.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmHideExpenseId(expense._id)}
                      className="h-7 w-7 shrink-0 rounded-full border border-zinc-700 bg-zinc-950/90 text-zinc-400 transition-all hover:border-red-400/70 hover:text-red-300"
                      aria-label="Hide expense"
                      title="Hide expense"
                    >
                      <X size={13} className="mx-auto" />
                    </button>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        {hideAmounts ? `${rupeeSymbol}****` : `${rupeeSymbol}${expense.amount.toLocaleString()}`}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {occurredAt.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="px-5 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-zinc-500">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="h-8 min-w-18 rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-300 hover:text-white hover:border-zinc-500 transition-all active:scale-95 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="h-8 min-w-18 rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-300 hover:text-white hover:border-zinc-500 transition-all active:scale-95 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {expenseToHide && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
            <h3 className="text-sm font-semibold text-white">Hide this expense?</h3>
            <p className="mt-2 text-xs text-zinc-400">
              This will soft delete it from your expense lists.
            </p>
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2">
              <p className="text-xs text-zinc-300 truncate">{expenseToHide.category.name}</p>
              <p className="text-xs text-zinc-500">
                {hideAmounts ? `${rupeeSymbol}****` : `${rupeeSymbol}${expenseToHide.amount.toLocaleString()}`}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmHideExpenseId(null)}
                disabled={Boolean(hidingExpenseId)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHide}
                disabled={Boolean(hidingExpenseId)}
                className="flex-1 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-60"
              >
                {hidingExpenseId ? "Hiding..." : "Hide"}
              </button>
            </div>
          </div>
        </div>
      )}

      {hiddenModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">Hidden Expenses</h3>
              <button
                type="button"
                onClick={() => setHiddenModalOpen(false)}
                className="h-8 w-8 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
                aria-label="Close hidden expenses"
              >
                <X size={14} className="mx-auto" />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{displayLabel}</p>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
              {hiddenLoading ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-4 text-center text-xs text-zinc-500">
                  Loading hidden expenses...
                </div>
              ) : hiddenExpenses.length === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-4 text-center">
                  <p className="text-xs font-medium text-zinc-300">No hidden expenses for this day</p>
                </div>
              ) : (
                hiddenExpenses.map((expense) => {
                  const occurredAt = new Date(expense.occurredAt);
                  return (
                    <div
                      key={expense._id}
                      className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{expense.category.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          {occurredAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-white">
                        {hideAmounts ? `${rupeeSymbol}****` : `${rupeeSymbol}${expense.amount.toLocaleString()}`}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRestoreExpense(expense._id)}
                        disabled={restoringExpenseId === expense._id}
                        className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
                      >
                        {restoringExpenseId === expense._id ? "..." : "Restore"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExpenseDay;
