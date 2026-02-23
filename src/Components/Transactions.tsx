import { useCallback, useEffect, useRef, useState } from "react";
import { Wallet } from "lucide-react";
import api from "../routeWrapper/Api";
import { useAppSelector } from "../store/hooks";

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
  isHidden?: boolean;
};

const Transactions = () => {
  const [loading, setLoading] = useState(true);
  const rupeeSymbol = String.fromCharCode(0x20B9);
  const hideAmounts = useAppSelector((state) => state.amount.hideAmounts);
  const [transactions, setTransactions] = useState<Expense[]>([]);
  const [transactionsCursor, setTransactionsCursor] = useState<string | null>(null);
  const [transactionsHasMore, setTransactionsHasMore] = useState(true);
  const [transactionsLoadingMore, setTransactionsLoadingMore] = useState(false);
  const transactionsInFlight = useRef(false);
  const transactionsListRef = useRef<HTMLDivElement | null>(null);
  const transactionsSentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchTransactionsPage = useCallback(async (cursor: string | null, append: boolean) => {
    if (transactionsInFlight.current) return;
    transactionsInFlight.current = true;

    if (append) {
      setTransactionsLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params: Record<string, string> = {};
      if (cursor) {
        params.cursor = cursor;
      }

      const { data } = await api.get("/api/expense/paged", { params });
      const rawList: Expense[] = data?.data || [];
      const list = rawList.filter((expense) => expense?.isHidden !== true);

      setTransactions((prev) => (append ? [...prev, ...list] : list));
      setTransactionsCursor(data?.nextCursor ?? null);
      setTransactionsHasMore(Boolean(data?.nextCursor) && rawList.length > 0);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      if (!append) {
        setTransactions([]);
      }
      setTransactionsHasMore(false);
    } finally {
      transactionsInFlight.current = false;
      setLoading(false);
      setTransactionsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setTransactions([]);
    setTransactionsCursor(null);
    setTransactionsHasMore(true);
    fetchTransactionsPage(null, false);
  }, [fetchTransactionsPage]);

  useEffect(() => {
    if (!transactionsHasMore) {
      return;
    }

    const root = transactionsListRef.current;
    const target = transactionsSentinelRef.current;
    if (!root || !target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchTransactionsPage(transactionsCursor, true);
        }
      },
      { root, rootMargin: "200px 0px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchTransactionsPage, transactionsCursor, transactionsHasMore]);

  if (loading) {
    return (
      <div className="px-3 sm:px-4 pt-3 pb-28 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-36 bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-3 w-44 bg-zinc-900 rounded-md mt-2 animate-pulse" />
          </div>
        </div>
        <div className="h-64 bg-zinc-800/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 pt-3 pb-28 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-zinc-300" size={20} />
            Transactions
          </h1>
          <p className="text-zinc-500 text-xs mt-0.5">All expenses, newest first</p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-zinc-800">
              <Wallet className="text-zinc-600" size={28} />
            </div>
            <p className="text-zinc-400 text-sm font-medium">No transactions yet</p>
            <p className="text-zinc-600 text-xs mt-1">Add an expense to see it here</p>
          </div>
        ) : (
          <>
            <div
              ref={transactionsListRef}
              className="divide-y divide-zinc-800 max-h-[70vh] overflow-y-auto overscroll-contain pb-24 sm:pb-6"
            >
              {transactions.map((expense, index) => {
                const occurredAt = new Date(expense.occurredAt);
                return (
                  <div
                    key={expense._id}
                    className="group flex items-center gap-2.5 px-3 sm:px-3.5 py-2.5 transition-all hover:bg-zinc-900 active:scale-[0.995]"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <div
                      className="relative w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: `${expense.category.color || "#10b981"}18` }}
                    >
                      <span className="drop-shadow">{expense.category.emoji || "\uD83D\uDCB0"}</span>
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black"
                        style={{ backgroundColor: expense.category.color || "#10b981" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] sm:text-sm font-semibold tracking-wide truncate leading-tight">
                        {expense.category.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <span className="text-[10px] uppercase tracking-wide text-zinc-300 bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded-full shrink-0">
                          {expense.payment_mode === "bank_transfer" ? "Bank" : expense.payment_mode.toUpperCase()}
                        </span>
                        {expense.notes && (
                          <span className="text-zinc-500 text-[11px] truncate">{expense.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-semibold text-[13px] sm:text-sm leading-tight">
                          {hideAmounts ? (
                            `${rupeeSymbol}****`
                          ) : (
                            <>
                                <span className="text-zinc-300">{rupeeSymbol}</span>
                              {expense.amount.toLocaleString()}
                            </>
                          )}
                        </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">
                        {occurredAt.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                        {" \u00B7 "}
                        {occurredAt.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={transactionsSentinelRef} />
              {transactionsLoadingMore && (
                <div className="py-4 text-center text-xs text-zinc-500">Loading more...</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Transactions;
