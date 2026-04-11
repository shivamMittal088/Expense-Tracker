import { useCallback, useEffect, useRef } from "react";
import { Loader2, ReceiptText } from "lucide-react";
import api from "../routeWrapper/Api";
import { cacheTransactions, appendCachedTransactions, getCachedTransactions } from "../utils/indexedDB/transactionsDB";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  setMonthlyTransactions,
  setMonthlyTransactionsLoading,
  appendMonthlyTransactions,
  setLoadingMore,
} from "../store/slices/monthlyTransactionsSlice";

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

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: "Bank",
  cash: "Cash",
  card: "Card",
  wallet: "Wallet",
  upi: "UPI",
  UPI: "UPI",
};

const Transactions = () => {
  const dispatch = useAppDispatch();
  const rupeeSymbol = String.fromCharCode(0x20B9);
  const hideAmounts = useAppSelector((state) => state.amount.hideAmounts);
  const transactions = useAppSelector((state) => state.monthlyTransactions.items);
  const loading = useAppSelector((state) => state.monthlyTransactions.loading);
  const isLoaded = useAppSelector((state) => state.monthlyTransactions.isLoaded);
  const nextCursor = useAppSelector((state) => state.monthlyTransactions.nextCursor);
  const loadingMore = useAppSelector((state) => state.monthlyTransactions.loadingMore);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchTransactions = useCallback(async (force = false) => {
    if (!force && isLoaded) return;
    dispatch(setMonthlyTransactionsLoading(true));

    try {
      const response = await api.get("/api/expense/paged");
      const data: Expense[] = response.data?.data || [];
      const cursor: string | null = response.data?.nextCursor || null;
      dispatch(setMonthlyTransactions({ data, nextCursor: cursor }));
      cacheTransactions(data).catch(() => {});
    } catch (error) {
      try {
        const cached = await getCachedTransactions();
        if (cached.length) {
          dispatch(setMonthlyTransactions({ data: cached, nextCursor: null }));
          return;
        }
      } catch { /* ignore */ }
      console.error("Failed to fetch transactions:", error);
      dispatch(setMonthlyTransactionsLoading(false));
    }
  }, [dispatch, isLoaded]);

  const fetchMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    dispatch(setLoadingMore(true));

    try {
      const response = await api.get("/api/expense/paged", {
        params: { cursor: nextCursor },
      });
      const data: Expense[] = response.data?.data || [];
      const cursor: string | null = response.data?.nextCursor || null;
      dispatch(appendMonthlyTransactions({ data, nextCursor: cursor }));
      appendCachedTransactions(data).catch(() => {});
    } catch (error) {
      console.error("Failed to fetch more transactions:", error);
      dispatch(setLoadingMore(false));
    }
  }, [dispatch, nextCursor, loadingMore]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const handleExpenseChange = () => void fetchTransactions(true);
    window.addEventListener("expense:changed", handleExpenseChange);
    return () => window.removeEventListener("expense:changed", handleExpenseChange);
  }, [fetchTransactions]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) void fetchMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, fetchMore]);

  if (loading) {
    return (
      <div className="px-3 sm:px-4 pt-5 pb-28 max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="h-7 w-36 bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-3 w-48 bg-zinc-800/60 rounded-lg mt-2.5 animate-pulse" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900/60 rounded-2xl animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 pt-5 pb-28 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-0.5">
          <ReceiptText size={19} className="text-zinc-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Transactions</h1>
        </div>
        <p className="text-zinc-500 text-xs ml-7">
          {transactions.length > 0
            ? `${transactions.length} records — newest first`
            : "All transactions, newest first"}
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-zinc-800">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
            <ReceiptText className="text-zinc-600" size={24} />
          </div>
          <p className="text-zinc-400 text-sm font-medium">No transactions yet</p>
          <p className="text-zinc-600 text-xs mt-1">Add an expense to see it here</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="divide-y divide-zinc-800/80 max-h-[72vh] overflow-y-auto overscroll-contain pb-24 sm:pb-6">
            {transactions.map((expense) => {
              const occurredAt = new Date(expense.occurredAt);
              const paymentLabel = PAYMENT_LABELS[expense.payment_mode] || expense.payment_mode.toUpperCase();
              const colorHex = expense.category.color || "#10b981";

              return (
                <div
                  key={expense._id}
                  className="group flex items-center gap-3 px-3.5 sm:px-4 py-3 hover:bg-zinc-900/60 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-[18px] shrink-0 relative"
                    style={{ backgroundColor: `${colorHex}1a` }}
                  >
                    {expense.category.emoji || "💰"}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-1 ring-zinc-950"
                      style={{ backgroundColor: colorHex }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] sm:text-sm font-semibold text-white truncate leading-tight">
                      {expense.category.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${colorHex}18`,
                          color: colorHex,
                        }}
                      >
                        {paymentLabel}
                      </span>
                      {expense.notes && (
                        <span className="text-zinc-500 text-[11px] truncate max-w-[120px]">
                          {expense.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount + time */}
                  <div className="text-right shrink-0">
                    <p className="text-[13px] sm:text-sm font-bold text-white leading-tight">
                      {hideAmounts ? (
                        <span className="text-zinc-500 tracking-wider">••••</span>
                      ) : (
                        <>
                          <span className="text-zinc-500 font-normal">{rupeeSymbol}</span>
                          {expense.amount.toLocaleString("en-IN")}
                        </>
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight tabular-nums">
                      {occurredAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      {" · "}
                      {occurredAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={sentinelRef} />
            {loadingMore && (
              <div className="flex justify-center py-5">
                <Loader2 className="animate-spin text-zinc-600" size={18} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
