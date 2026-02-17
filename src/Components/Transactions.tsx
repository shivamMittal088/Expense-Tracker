import { useCallback, useEffect, useRef, useState } from "react";
import { Wallet } from "lucide-react";
import api from "../routeWrapper/Api";
import { showTopToast } from "../utils/Redirecttoast";

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
};

const Transactions = () => {
  const [loading, setLoading] = useState(true);
  const rupeeSymbol = String.fromCharCode(0x20B9);
  const [transactions, setTransactions] = useState<Expense[]>([]);
  const [transactionsCursor, setTransactionsCursor] = useState<string | null>(null);
  const [transactionsHasMore, setTransactionsHasMore] = useState(true);
  const [transactionsLoadingMore, setTransactionsLoadingMore] = useState(false);
  const [transactionsSeeding, setTransactionsSeeding] = useState(false);
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

      const { data } = await api.get("/api/expenses/paged", { params });
      const list = data?.data || [];

      setTransactions((prev) => (append ? [...prev, ...list] : list));
      setTransactionsCursor(data?.nextCursor ?? null);
      setTransactionsHasMore(Boolean(data?.nextCursor) && list.length > 0);
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

  const handleSeedTransactions = useCallback(async () => {
    if (transactionsSeeding) return;
    setTransactionsSeeding(true);
    try {
      await api.post("/api/seed/transactions");
      showTopToast("Seeded 200 transactions", { tone: "success" });
      setTransactions([]);
      setTransactionsCursor(null);
      setTransactionsHasMore(true);
      fetchTransactionsPage(null, false);
    } catch {
      showTopToast("Failed to seed transactions", { tone: "error" });
    } finally {
      setTransactionsSeeding(false);
    }
  }, [fetchTransactionsPage, transactionsSeeding]);

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
      <div className="p-4 pb-28 max-w-2xl mx-auto">
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
    <div className="p-4 pb-28 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-emerald-400" size={24} />
            Transactions
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">All expenses, newest first</p>
        </div>
        <button
          type="button"
          onClick={handleSeedTransactions}
          disabled={transactionsSeeding}
          className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
        >
          {transactionsSeeding ? "Seeding..." : "Seed 200"}
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_-20%,#1f2937_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_90%_10%,#0f172a_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-linear-to-b from-white/4 via-transparent to-white/2" />
        {transactions.length === 0 ? (
          <div className="relative text-center py-14">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
              <Wallet className="text-zinc-600" size={28} />
            </div>
            <p className="text-zinc-400 text-sm font-medium">No transactions yet</p>
            <p className="text-zinc-600 text-xs mt-1">Add an expense to see it here</p>
          </div>
        ) : (
          <>
            <div
              ref={transactionsListRef}
              className="relative divide-y divide-white/5 max-h-140 overflow-y-auto"
            >
              {transactions.map((expense, index) => {
                const occurredAt = new Date(expense.occurredAt);
                return (
                  <div
                    key={expense._id}
                    className="group flex items-center gap-3 px-4 py-4 transition-all hover:bg-white/5"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <div
                      className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${expense.category.color || "#10b981"}18` }}
                    >
                      <span className="drop-shadow">{expense.category.emoji || "\uD83D\uDCB0"}</span>
                      <span
                        className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-black"
                        style={{ backgroundColor: expense.category.color || "#10b981" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold tracking-wide truncate">
                        {expense.category.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] uppercase tracking-wide text-emerald-300/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {expense.payment_mode === "bank_transfer" ? "Bank" : expense.payment_mode.toUpperCase()}
                        </span>
                        {expense.notes && (
                          <span className="text-zinc-500 text-xs truncate">{expense.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-semibold">
                          <span className="text-emerald-300">{rupeeSymbol}</span>{expense.amount.toLocaleString()}
                        </p>
                      <p className="text-[11px] text-zinc-500">
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
