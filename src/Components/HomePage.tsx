import React, { useState, useEffect } from "react";
import { CalendarPicker } from "./UI/CalendarPicker";
import api from "./Api"; // axios instance with auth token

type Expense = {
  _id: string;
  amount: number;
  category: {
    name: string;
    color: string;
  };
  notes?: string;
  occuredAt: string;
};

export default function ExpenseTrackerHome() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const displayLabel = isToday ? "Today" : formattedDate;

  // Convert JS Date → YYYY-MM-DD
  const apiDate = selectedDate.toISOString().slice(0, 10);

  /* ---------------- Fetch expenses when date changes ---------------- */

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/expense/${apiDate}`);
        setExpenses(res.data.data);
      } catch (err) {
        console.error("Failed to load expenses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [apiDate]);

  /* ---------------- Compute total ---------------- */

  const totalForDay = expenses.reduce((sum, e) => sum + e.amount, 0);

  /* ---------------- Polygon shape calculation ---------------- */

  const getPolygonLayout = (count: number) => {
    if (count === 0) return { shape: 'none', positions: [] };
    if (count === 1) return { shape: 'circle', positions: [{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }] };
    if (count === 2) return { 
      shape: 'line', 
      positions: [
        { top: '50%', left: '35%', transform: 'translate(-50%, -50%)' },
        { top: '50%', left: '65%', transform: 'translate(-50%, -50%)' }
      ] 
    };
    if (count === 3) return { 
      shape: 'triangle', 
      positions: [
        { top: '25%', left: '50%', transform: 'translate(-50%, -50%)' },
        { top: '65%', left: '30%', transform: 'translate(-50%, -50%)' },
        { top: '65%', left: '70%', transform: 'translate(-50%, -50%)' }
      ] 
    };

    // For 4+ items, arrange in polygon shape
    const centerX = 50;
    const centerY = 50;
    const radius = 38; // percentage - increased for more spacing
    const angleStep = (2 * Math.PI) / count;
    const startAngle = -Math.PI / 2; // Start from top

    return {
      shape: count === 4 ? 'square' : count === 5 ? 'pentagon' : count === 6 ? 'hexagon' : count === 7 ? 'heptagon' : count === 8 ? 'octagon' : 'polygon',
      positions: Array.from({ length: count }, (_, i) => {
        const angle = startAngle + (i * angleStep);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return {
          top: `${y}%`,
          left: `${x}%`,
          transform: 'translate(-50%, -50%)'
        };
      })
    };
  };

  const layout = getPolygonLayout(expenses.length);

  /* ---------------- Date controls ---------------- */

  const changeDateBy = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate > today) return;
    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* Top Bar */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">

            {/* Left – Date */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeDateBy(-1)}
                className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              >
                &lt;
              </button>

              <span className="text-lg font-semibold">{displayLabel}</span>

              <button
                onClick={() => changeDateBy(1)}
                disabled={isToday}
                className={`w-9 h-9 rounded-md transition-colors ${
                  isToday
                    ? "bg-gray-900 text-gray-600 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                &gt;
              </button>
            </div>

            {/* Right – Calendar + Total */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => setIsCalendarOpen(true)}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-all
                  ${
                    isToday
                      ? "bg-blue-700 border-blue-600 text-white"
                      : "bg-black border-gray-800 hover:border-white"
                  }
                `}
              >
                Open Calendar
              </button>

              <div className="text-right">
                <p className="text-xs text-gray-400">Total Expenses</p>
                <p className="text-2xl font-bold">
                  ₹{totalForDay.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Expenses */}
        <section>
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Expenses</h3>
              {expenses.length > 0 && (
                <span className="text-sm text-gray-400 capitalize">
                  {layout.shape} • {expenses.length} {expenses.length === 1 ? 'transaction' : 'transactions'}
                </span>
              )}
            </div>

            {loading && (
              <p className="text-gray-400 text-center py-20">Loading...</p>
            )}

            {!loading && expenses.length === 0 && (
              <p className="text-gray-500 text-center py-20">
                No expenses for {displayLabel}
              </p>
            )}

            {!loading && expenses.length > 0 && (
              <>
                {/* Mobile View - Normal Tiles */}
                <div className="block lg:hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {expenses.map((e, index) => (
                      <div
                        key={e._id}
                        className="group relative overflow-hidden rounded-xl transition-all duration-500 hover:scale-105 cursor-pointer"
                        style={{
                          animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
                        }}
                      >
                        {/* Background with gradient overlay */}
                        <div 
                          className="absolute inset-0 opacity-10"
                          style={{ backgroundColor: e.category.color }}
                        />
                        
                        {/* Premium black glass background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-950/95 backdrop-blur-xl" />
                        
                        {/* Colored accent border */}
                        <div 
                          className="absolute inset-0 rounded-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500"
                          style={{ 
                            boxShadow: `inset 0 0 0 1.5px ${e.category.color}`,
                          }}
                        />
                        
                        {/* Glow effect on hover */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl"
                          style={{ backgroundColor: e.category.color }}
                        />

                        {/* Content */}
                        <div className="relative p-4 flex flex-col h-full min-h-[140px]">
                          {/* Category header with color indicator */}
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-1 h-6 rounded-full group-hover:h-7 transition-all duration-300"
                              style={{ backgroundColor: e.category.color }}
                            />
                            <h4 className="font-bold text-xs text-white truncate flex-1">
                              {e.category.name}
                            </h4>
                          </div>

                          {/* Time */}
                          <div className="mb-2">
                            <p className="text-[9px] text-gray-500 font-medium">
                              {new Date(e.occuredAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </p>
                          </div>

                          {/* Notes */}
                          {e.notes && (
                            <p className="text-[10px] text-gray-400 mb-2 line-clamp-2 leading-snug">
                              {e.notes}
                            </p>
                          )}

                          {/* Amount - pushed to bottom */}
                          <div className="mt-auto pt-2 border-t border-gray-800/50">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] text-gray-500 font-medium">INR</span>
                              <span 
                                className="text-lg font-bold tracking-tight"
                                style={{ color: e.category.color }}
                              >
                                {e.amount.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop View - Polygon Layout */}
                <div className="hidden lg:block">
                  <div className="relative w-full h-[700px] flex items-center justify-center my-8">
                    {/* Shape indicator lines (optional visual guide) */}
                    {expenses.length >= 3 && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
                        {layout.positions.map((_, i) => {
                          const nextIndex = (i + 1) % layout.positions.length;
                          const x1 = parseFloat(layout.positions[i].left);
                          const y1 = parseFloat(layout.positions[i].top);
                          const x2 = parseFloat(layout.positions[nextIndex].left);
                          const y2 = parseFloat(layout.positions[nextIndex].top);
                          
                          return (
                            <line
                              key={i}
                              x1={`${x1}%`}
                              y1={`${y1}%`}
                              x2={`${x2}%`}
                              y2={`${y2}%`}
                              stroke="currentColor"
                              strokeWidth="1"
                              className="text-gray-600"
                            />
                          );
                        })}
                      </svg>
                    )}

                    {/* Expense tiles positioned in polygon shape */}
                    {expenses.map((e, index) => (
                      <div
                        key={e._id}
                        className="absolute group overflow-hidden rounded-xl transition-all duration-500 hover:scale-110 hover:z-10 cursor-pointer w-[150px]"
                        style={{
                          top: layout.positions[index].top,
                          left: layout.positions[index].left,
                          transform: layout.positions[index].transform,
                          animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
                        }}
                      >
                        {/* Background with gradient overlay */}
                        <div 
                          className="absolute inset-0 opacity-10"
                          style={{ backgroundColor: e.category.color }}
                        />
                        
                        {/* Premium black glass background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-950/95 backdrop-blur-xl" />
                        
                        {/* Colored accent border */}
                        <div 
                          className="absolute inset-0 rounded-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500"
                          style={{ 
                            boxShadow: `inset 0 0 0 1.5px ${e.category.color}`,
                          }}
                        />
                        
                        {/* Glow effect on hover */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl"
                          style={{ backgroundColor: e.category.color }}
                        />

                        {/* Content */}
                        <div className="relative p-4 flex flex-col h-full">
                          {/* Category header with color indicator */}
                          <div className="flex items-center gap-2 mb-3">
                            <div 
                              className="w-1 h-7 rounded-full group-hover:h-8 transition-all duration-300"
                              style={{ backgroundColor: e.category.color }}
                            />
                            <h4 className="font-bold text-sm text-white truncate flex-1">
                              {e.category.name}
                            </h4>
                          </div>

                          {/* Time */}
                          <div className="mb-2">
                            <p className="text-[10px] text-gray-500 font-medium">
                              {new Date(e.occuredAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </p>
                          </div>

                          {/* Notes */}
                          {e.notes && (
                            <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                              {e.notes}
                            </p>
                          )}

                          {/* Amount - pushed to bottom */}
                          <div className="mt-auto pt-3 border-t border-gray-800/50">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs text-gray-500 font-medium">INR</span>
                              <span 
                                className="text-xl font-bold tracking-tight"
                                style={{ color: e.category.color }}
                              >
                                {e.amount.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.8);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
        `}</style>
      </main>

      <CalendarPicker
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onDateSelect={(date) => setSelectedDate(date)}
        maxDate={today}
      />
    </div>
  );
}