import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Filter, Download } from "lucide-react";

/* ---------------- TYPES ---------------- */

type Expense = {
  _id: string;
  amount: number;
  category: string;
  createdAt?: string;
};

/* ---------------- HELPERS & CONSTANTS ---------------- */

const EMOJI_MAP: Record<string, string> = {
  Food: "🍔",
  Shopping: "🛍️",
  Transport: "🚗",
  Entertainment: "🎮",
  Bills: "💡",
  Health: "⚕️",
  Education: "📚",
};

const COLOR_MAP: Record<string, string> = {
  Food: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  Shopping: "bg-pink-500/10 border-pink-500/30 text-pink-400",
  Transport: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  Entertainment: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  Bills: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  Health: "bg-green-500/10 border-green-500/30 text-green-400",
  Education: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
};

const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

// Minimal dayjs-like mock used in the original
const dayjs = (date?: string) => {
  const d = date ? new Date(date) : new Date();
  return {
    format: (fmt: string) => {
      if (fmt === "YYYY-MM-DD") return d.toISOString().split("T")[0];
      if (fmt === "dddd, MMM D") {
        return d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
      }
      return d.toISOString();
    },
  };
};

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/* ---------------- TRANSACTION TILE ---------------- */

type TransactionTileProps = {
  expense: Expense;
  categoryTotal: number;
  maxCategoryTotal: number;
};

const TransactionTile: React.FC<TransactionTileProps> = React.memo(
  ({ expense, categoryTotal, maxCategoryTotal }) => {
    const emoji = EMOJI_MAP[expense.category] ?? "💰";
    const colorClass = COLOR_MAP[expense.category] ?? "bg-slate-500/10 border-slate-500/30";
    const percentage = maxCategoryTotal > 0 ? (categoryTotal / maxCategoryTotal) * 100 : 0;
    const widthPercent = 14 + (percentage / 100) * 12; // scaled width for visual variety

    return (
      <div
        role="article"
        aria-label={`${expense.category} transaction`}
        className={cn(
          "flex items-center justify-between rounded-md border px-2 py-1.5 hover:bg-slate-800/60 transition",
          colorClass
        )}
        style={{ flex: `1 1 ${widthPercent}%`, minWidth: 140, maxWidth: 260 }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-sm">
            {emoji}
          </div>

          <div className="truncate">
            <p className="text-xs font-medium truncate">{expense.category}</p>
            <p className="text-[10px] text-slate-500">
              {INR.format(categoryTotal)}
            </p>
          </div>
        </div>

        <p className="text-xs font-semibold tabular-nums">
          {INR.format(expense.amount)}
        </p>
      </div>
    );
  }
);

/* ---------------- MAIN ---------------- */

const HomePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);

  // Static dataset (kept as state to match original example)
  const [expenses] = useState<Expense[]>([
    { _id: "1", amount: 450, category: "Food" },
    { _id: "2", amount: 1200, category: "Shopping" },
    { _id: "3", amount: 300, category: "Transport" },
    { _id: "4", amount: 850, category: "Entertainment" },
    { _id: "5", amount: 200, category: "Food" },
    { _id: "6", amount: 500, category: "Bills" },
    { _id: "7", amount: 150, category: "Transport" },
    { _id: "8", amount: 600, category: "Health" },
    { _id: "9", amount: 350, category: "Food" },
    { _id: "10", amount: 800, category: "Shopping" },
    { _id: "11", amount: 250, category: "Transport" },
    { _id: "12", amount: 400, category: "Entertainment" },
  ]);

  const handleDateChange = (value: string) => {
    if (value === selectedDate) return;
    setSelectedDate(value);
    setLoading(true);
  };

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [selectedDate]);

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const categoryTotals = useMemo(() => {
    return expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
  }, [expenses]);

  const maxCategoryTotal = useMemo(
    () => Math.max(0, ...Object.values(categoryTotals)),
    [categoryTotals]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-5">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Expense Dashboard</h1>

          <div className="flex gap-2" role="toolbar" aria-label="actions">
            <button
              title="Filter"
              aria-label="Filter expenses"
              className="p-2 bg-slate-800 rounded"
            >
              <Filter size={16} />
            </button>

            <button
              title="Download"
              aria-label="Download report"
              className="p-2 bg-slate-800 rounded"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-xs text-red-400">Total</p>
            <p className="text-xl font-bold">{INR.format(total)}</p>
          </div>

          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-xs text-green-400">Transactions</p>
            <p className="text-xl font-bold">{expenses.length}</p>
          </div>
        </div>

        {/* Date */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Calendar size={18} />
            <span>{dayjs(selectedDate).format("dddd, MMM D")}</span>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-slate-800 px-2 py-1 rounded text-sm"
            aria-label="Select date"
          />
        </div>

        {/* Transactions */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex justify-between mb-2 text-sm text-slate-400">
            <span>Transactions</span>
            <span>{expenses.length}</span>
          </div>

          {loading && <p className="text-xs text-slate-500">Loading…</p>}

          <div className="flex flex-wrap gap-1">
            {expenses.map((e) => (
              <TransactionTile
                key={e._id}
                expense={e}
                categoryTotal={categoryTotals[e.category]}
                maxCategoryTotal={maxCategoryTotal}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;