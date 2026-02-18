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
    <section className="max-w-5xl mx-auto">
      <div
        key={`expense-day-${dayExpenses.length}`}
        className="rounded-2xl border border-zinc-800 bg-zinc-950"
      >
        <div className="px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">Daily Ledger</p>
              <h2 className="text-sm font-semibold text-white mt-1">
                {isToday ? "Today's Transactions" : "Transactions"}
              </h2>
              <p className="text-[11px] text-zinc-500">{displayLabel}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
                <span className="text-[11px] text-zinc-300">
                  Showing {dayExpenses.length} of {totalCount}
                </span>
              </div>
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
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-3 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {expense.category.name}
                      </p>
                    </div>
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
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50"
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
