import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Filter, Download } from "lucide-react";
import { CalendarPicker } from "./UI/CalendarPicker";

/* ---------------- TYPES ---------------- */

type Expense = {
  _id: string;
  amount: number;
  category: string;
  createdAt?: string;
};

/* ---------------- HELPERS ---------------- */

const dayjs = (date?: Date | string) => {
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

/* ---------------- MAIN ---------------- */

const HomePage: React.FC = () => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const selectedDate = dayjs(selectedDateObj).format("YYYY-MM-DD");

  const [expenses] = useState<Expense[]>([
    { _id: "1", amount: 450, category: "Food" },
    { _id: "2", amount: 1200, category: "Shopping" },
    { _id: "3", amount: 300, category: "Transport" },
    { _id: "4", amount: 850, category: "Entertainment" },
    { _id: "5", amount: 200, category: "Food" },
    { _id: "6", amount: 500, category: "Bills" },
  ]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [selectedDateObj]);

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-5">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Expense Dashboard</h1>

          <div className="flex gap-2">
            <button className="p-2 bg-slate-800 rounded">
              <Filter size={16} />
            </button>
            <button className="p-2 bg-slate-800 rounded">
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
          <button
            onClick={() => setCalendarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
          >
            <Calendar size={18} />
            <span>{dayjs(selectedDateObj).format("dddd, MMM D")}</span>
          </button>
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
              <div key={e._id} className="bg-slate-800 px-3 py-2 rounded text-sm">
                {e.category} – {INR.format(e.amount)}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Calendar Modal */}
      <CalendarPicker
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={selectedDateObj}
        onDateSelect={(date) => {
          setSelectedDateObj(date);
          setCalendarOpen(false);
        }}
        maxDate={new Date()}
      />
    </div>
  );
};

export default HomePage;
