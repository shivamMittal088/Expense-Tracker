import React, { useState, useEffect } from "react";
import { CalendarPicker } from "./UI/CalendarPicker";
import api from "../routeWrapper/Api"; // axios instance with auth token

type Expense = {
  _id: string;
  amount: number;
  category: {
    name: string;
    color: string;
  };
  emoji?: string; // Emoji stored outside category
  notes?: string;
  occuredAt: string;
};

export default function ExpenseTrackerHome() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

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

  /* ---------------- Fetch expenses when date changes ---------------- */

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/expense/${apiDate}`);
        setExpenses(res.data. data || []);
        setShowAll(false);
      } catch (err) {
        console.error("Failed to load expenses", err);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [apiDate]);

  /* ---------------- Compute total ---------------- */

  const totalForDay = expenses.reduce((sum, e) => sum + e.amount, 0);

  /* ---------------- Determine which expenses to show ---------------- */
  const INITIAL_LIMIT = 8;
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

  /* ---------------- Initial View - Glass Card Style ---------------- */
  const GlassCard = ({ e, index }: { e: Expense; index: number }) => (
    <div
      className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
      style={{
        animation: `floatIn 0.6s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-2xl opacity-60 group-hover: opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${e.category.color}40, transparent, ${e.category. color}20)`,
          padding: '1px',
        }}
      />

      {/* Glass background */}
      <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-gray-900/80 via-gray-950/90 to-black/95 backdrop-blur-xl" />

      {/* Floating orb effect */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover: opacity-40 transition-opacity duration-700"
        style={{ backgroundColor: e.category. color }}
      />

      {/* Content */}
      <div className="relative p-5">
        {/* Top row - Emoji, Category & Time */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Emoji or Color Dot */}
            {e.emoji ? (
              <span className="text-xl" role="img" aria-label={e. category.name}>
                {e.emoji}
              </span>
            ) : (
              <div
                className="w-3 h-3 rounded-full ring-2 ring-offset-2 ring-offset-gray-900"
                style={{
                  backgroundColor:  e.category.color,
                  ringColor: `${e.category.color}50`
                }}
              />
            )}
            <h3 className="text-sm font-semibold text-white">
              {e.category.name}
            </h3>
          </div>
          <span className="text-[10px] text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
            {new Date(e.occuredAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
        </div>

        {/* Amount - Hero style */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-gray-500">₹</span>
            <span
              className="text-3xl font-bold tracking-tight"
              style={{ color: e.category. color }}
            >
              {e. amount.toLocaleString('en-IN', { minimumFractionDigits:  2 })}
            </span>
          </div>
        </div>

        {/* Notes */}
        <p className="text-[11px] text-gray-500 line-clamp-2 min-h-[32px]">
          {e.notes || 'No description added'}
        </p>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-5 right-5 h-[2px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, ${e. category.color}, transparent)`
          }}
        />
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover: opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </div>
  );

  /* ---------------- Show More View - Flippable Card ---------------- */
  const ExpenseCard = ({ e, index }:  { e: Expense; index: number }) => {
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
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-md" />

            {/* Left color accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 group-hover: w-1 transition-all duration-300"
              style={{ backgroundColor: e.category.color }}
            />

            {/* Content - Single row layout */}
            <div className="relative flex items-center px-4 py-3 gap-4">

              {/* Emoji + Category */}
              <div className="flex items-center gap-2 min-w-[120px]">
                {/* Emoji or Color Dot */}
                {e.emoji ? (
                  <span className="text-lg flex-shrink-0" role="img" aria-label={e.category.name}>
                    {e.emoji}
                  </span>
                ) : (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: e.category.color }}
                  />
                )}
                <span className="text-sm font-medium text-white truncate">
                  {e.category. name}
                </span>
              </div>

              {/* Time */}
              <span className="text-[11px] text-gray-500 flex-shrink-0">
                {new Date(e.occuredAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>

              {/* Notes - Middle section with small font */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className="text-[11px] text-gray-500 truncate">
                  {e.notes || '—'}
                </p>
                {hasLongNotes && (
                  <span className="text-[9px] text-gray-600 bg-gray-800 px-1. 5 py-0.5 rounded flex-shrink-0">
                    hover to read
                  </span>
                )}
              </div>

              {/* Amount */}
              <div className="flex items-baseline gap-0.5 flex-shrink-0">
                <span className="text-[10px] text-gray-600">₹</span>
                <span
                  className="font-semibold text-base"
                  style={{ color: e.category.color }}
                >
                  {e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
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
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />

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
                  {e.emoji ? (
                    <span className="text-lg" role="img" aria-label={e. category.name}>
                      {e. emoji}
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
                  <p className="text-[10px] text-gray-400 mb-0.5">Notes</p>
                  <p className="text-xs text-gray-300 line-clamp-2">
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
                    ₹{e. amount.toLocaleString('en-IN', { minimumFractionDigits:  2 })}
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
    <div className="min-h-screen bg-black text-white pb-12">
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* Top Bar */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">

            {/* Left – Date */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeDateBy(-1)}
                className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors flex items-center justify-center"
              >
                &lt;
              </button>

              <span className="text-lg font-semibold min-w-[120px] text-center">{displayLabel}</span>

              <button
                onClick={() => changeDateBy(1)}
                disabled={isToday}
                className={`w-9 h-9 rounded-md transition-colors flex items-center justify-center ${
                  isToday
                    ? "bg-gray-900 text-gray-600 cursor-not-allowed"
                    : "bg-gray-800 hover: bg-gray-700"
                }`}
              >
                &gt;
              </button>
            </div>

            {/* Right – Calendar + Total */}
            <div className="flex items-center gap-4 sm:gap-8">
              <button
                onClick={() => setIsCalendarOpen(true)}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-all
                  ${
                    isToday
                      ?  "bg-blue-700 border-blue-600 text-white"
                      :  "bg-black border-gray-800 hover:border-white"
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
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-bold">Expenses</h3>
                {expenses.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {showAll
                      ? `All ${expenses.length} transactions`
                      : `Showing ${Math.min(INITIAL_LIMIT, expenses.length)} of ${expenses.length}`
                    }
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Toggle Button */}
                {hasMoreThanLimit && (
                  <button
                    onClick={() => setShowAll(! showAll)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105 ${
                      showAll
                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                    }`}
                  >
                    {showAll ?  '← Back to Cards' : `View All (${expenses.length})`}
                  </button>
                )}
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}

            {!loading && expenses.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-2xl">💸</span>
                </div>
                <p className="text-gray-500">No expenses for {displayLabel}</p>
                <p className="text-xs text-gray-600 mt-1">Add your first expense to get started</p>
              </div>
            )}

            {!loading && expenses. length > 0 && (
              <>
                {! showAll ? (
                  /* Initial View - Glass Cards Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayedExpenses.map((e, index) => (
                      <GlassCard key={e._id} e={e} index={index} />
                    ))}
                  </div>
                ) : (
                  /* Show More View - Flippable Slim Rows */
                  <div className="space-y-2">
                    {expenses.map((e, index) => (
                      <ExpenseCard key={e._id} e={e} index={index} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <style jsx>{`
          @keyframes floatIn {
            from {
              opacity:  0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes slideIn {
            from {
              opacity:  0;
              transform: translateX(-20px);
            }
            to {
              opacity:  1;
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
    </div>
  );
}