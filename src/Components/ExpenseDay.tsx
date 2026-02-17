import { useMemo } from "react";

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
  isToday: boolean;
  hideAmounts: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  totalAmount: number;
  onPageChange: (page: number) => void;
};

const ExpenseDay = ({
  dayExpenses,
  displayLabel,
  isToday,
  hideAmounts,
  page,
  totalPages,
  totalCount,
  totalAmount,
  onPageChange,
}: ExpenseDayProps) => {
  const rupeeSymbol = String.fromCharCode(0x20B9);
  const hasTransactions = dayExpenses.length > 0;
  const safeTotalAmount = useMemo(() => totalAmount || 0, [totalAmount]);

  return (
    <section className="max-w-3xl mx-auto">
      <div
        key={`expense-day-${dayExpenses.length}`}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]"
      >
        <div className="absolute inset-0 bg-linear-to-br from-white/6 via-transparent to-white/2" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_circle_at_10%_-10%,rgba(16,185,129,0.12),transparent_55%)]" />
        <div className="relative px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Daily Ledger</p>
              <h2 className="text-sm font-semibold text-white mt-1">
                {isToday ? "Today's Transactions" : "Transactions"}
              </h2>
              <p className="text-[11px] text-white/50">{displayLabel}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
                <span className="text-[11px] text-emerald-300">
                  Showing {dayExpenses.length} of {totalCount}
                </span>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <span className="text-[11px] text-white/70">
                  {hideAmounts ? `${rupeeSymbol}****` : `${rupeeSymbol}${safeTotalAmount.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {!hasTransactions ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center">
              <p className="text-xs font-semibold text-white/70">No transactions yet</p>
              <p className="text-[11px] text-white/40 mt-1">Log an expense to populate this list.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayExpenses.map((expense) => {
                const occurredAt = new Date(expense.occurredAt);
                return (
                  <div
                    key={expense._id}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/3 px-3.5 py-3 transition-all hover:border-white/20 hover:bg-white/6"
                  >
                    <div
                      className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-base"
                      style={{ backgroundColor: `${expense.category.color || "#10b981"}18` }}
                    >
                      <span>{expense.category.emoji || "\uD83D\uDCB0"}</span>
                      <span
                        className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-black"
                        style={{ backgroundColor: expense.category.color || "#10b981" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {expense.category.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wide text-emerald-300/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {expense.payment_mode === "bank_transfer" ? "Bank" : expense.payment_mode.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-white/40 truncate">
                          {expense.notes || "No notes"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        {hideAmounts ? `${rupeeSymbol}****` : `${rupeeSymbol}${expense.amount.toLocaleString()}`}
                      </p>
                      <p className="text-[10px] text-white/40">
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
          <div className="relative px-5 pb-5">
            <div className="flex items-center justify-between text-[11px] text-white/50">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExpenseDay;
