import { useState, useEffect } from "react";
import { CalendarPicker } from "./UI/CalendarPicker";
import api from "./Api"; // axios instance with auth token

type Expense = {
  _id: string;
  amount: number;
  category: {
    name: string;
    color: string;
    emoji?: string;
  };
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

  // Convert JS Date → YYYY-MM-DD
  const apiDate = selectedDate.toISOString().slice(0, 10);

  /* ---------------- Fetch expenses when date changes ---------------- */

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/expense/${apiDate}`);
        setExpenses(res.data.data);
        setShowAll(false); // Reset to polygon view on date change
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

  /* ---------------- Determine which expenses to show ---------------- */
  const POLYGON_LIMIT = 8;
  const hasMoreThanLimit = expenses.length > POLYGON_LIMIT;
  const displayedExpenses = showAll ? expenses : expenses.slice(0, POLYGON_LIMIT);

  /* ---------------- Polygon shape calculation ---------------- */

  const getPolygonLayout = (count: number) => {
    if (count === 0) return { shape: 'none', positions: [] };
    if (count === 1) return { 
      shape: 'circle', 
      positions: [{ top: 50, left: 50 }] 
    };
    if (count === 2) return { 
      shape: 'line', 
      positions: [
        { top: 50, left: 40 },
        { top: 50, left: 60 }
      ] 
    };
    if (count === 3) return { 
      shape: 'triangle', 
      positions: [
        { top: 35, left: 50 },
        { top: 65, left: 35 },
        { top: 65, left: 65 }
      ] 
    };

    const centerX = 50;
    const centerY = 50;
    const radius = 32;
    const angleStep = (2 * Math.PI) / count;
    const startAngle = -Math.PI / 2;

    return {
      shape: count === 4 ? 'square' : count === 5 ? 'pentagon' : count === 6 ? 'hexagon' : count === 7 ? 'heptagon' : count === 8 ? 'octagon' : 'polygon',
      positions: Array.from({ length: count }, (_, i) => {
        const angle = startAngle + (i * angleStep);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return { top: y, left: x };
      })
    };
  };

  const layout = getPolygonLayout(displayedExpenses.length);

  /* ---------------- Date controls ---------------- */

  const changeDateBy = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate > today) return;
    setSelectedDate(newDate);
  };

  /* ---------------- Expense Tile Component ---------------- */
  const ExpenseTile = ({ e, isPolygon = false }: { e: Expense; isPolygon?: boolean }) => {
    // Convert hex to rgb for better blending
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 59, g: 130, b: 246 };
    };
    const rgb = hexToRgb(e.category.color);
    
    return (
      <div
        className={`${isPolygon ? 'group' : ''} relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer w-full h-full`}
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
        onMouseEnter={isPolygon ? (e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.zIndex = '50';
        } : undefined}
        onMouseLeave={isPolygon ? (e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.zIndex = '10';
        } : undefined}
      >
        {/* Colored background using category color */}
        <div 
          className={`absolute inset-0 opacity-40 ${isPolygon ? 'group-hover:opacity-50' : ''} transition-opacity duration-300`}
          style={{
            backgroundColor: e.category.color
          }}
        />
        
        {/* Glassmorphism overlay */}
        <div 
          className="absolute inset-0 backdrop-blur-md"
        style={{ 
            background: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) 50%, rgba(0, 0, 0, 0.6) 100%)`,
            border: `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`
        }}
      />
      
        {/* Colored accent border with glow */}
      <div 
          className={`absolute inset-0 rounded-2xl opacity-80 ${isPolygon ? 'group-hover:opacity-100' : ''} transition-all duration-300`}
        style={{ 
            boxShadow: `0 0 0 1.5px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6), inset 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
          }}
        />
        
        {/* Glow effect on hover - only for polygon view */}
        {isPolygon && (
          <div 
            className="absolute -inset-2 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-xl"
            style={{ 
              background: `radial-gradient(circle, ${e.category.color}, transparent 70%)`,
              zIndex: -1
            }}
          />
        )}

      {/* Content */}
        <div className={`relative flex flex-col h-full ${isPolygon ? 'p-3 min-h-[100px]' : 'p-2 min-h-[64px]'}`}>
        {/* Category header with color indicator */}
          <div className="flex items-center gap-2 mb-1.5">
            <div 
              className={`rounded-full transition-all duration-300 ${isPolygon ? 'w-1 h-3.5 group-hover:h-5' : 'w-0.5 h-3'}`}
              style={{ 
                backgroundColor: e.category.color,
                boxShadow: `0 0 8px ${e.category.color}40`
              }}
            />
            <h4 className={`font-bold text-white truncate flex-1 flex items-center gap-1.5 ${isPolygon ? 'text-[11px]' : 'text-[9px]'}`}>
              {e.category.emoji && (
                <span className={isPolygon ? 'text-xs' : 'text-[8px]'}>{e.category.emoji}</span>
              )}
              <span>{e.category.name}</span>
            </h4>
        </div>

        {/* Time */}
          <div className="mb-1">
            <p className={`text-gray-400 font-medium ${isPolygon ? 'text-[9px]' : 'text-[8px]'}`}>
            {new Date(e.occuredAt).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
        </div>

        {/* Notes - only show in polygon view */}
        {e.notes && isPolygon && (
            <p className="text-gray-400 mb-2 line-clamp-1 text-[9px] font-medium">
            {e.notes}
          </p>
        )}

        {/* Amount - pushed to bottom */}
          <div className="mt-auto pt-1.5 border-t border-white/5">
            <div className="flex items-baseline gap-1">
              <span className={`text-gray-500 font-semibold ${isPolygon ? 'text-[9px]' : 'text-[7px]'}`}>₹</span>
            <span 
                className={`font-black tracking-tight ${isPolygon ? 'text-base' : 'text-xs'}`}
                style={{ 
                  color: e.category.color,
                  textShadow: `0 0 10px ${e.category.color}40`
                }}
            >
              {e.amount.toFixed(2)}
            </span>
          </div>
        </div>

          {/* Shine effect on hover - only for polygon view */}
          {isPolygon && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
              <div 
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              />
            </div>
          )}
      </div>
    </div>
  );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-black to-[#0a0a0f] text-white pb-12 relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10">

        {/* Top Bar */}
        <section className="mb-6">
          <div 
            className="relative backdrop-blur-2xl rounded-2xl px-5 py-5 flex flex-wrap items-center justify-between gap-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />

            {/* Left – Date */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeDateBy(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
                style={{
                  background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <span className="text-gray-300 font-semibold text-lg leading-none">&lt;</span>
              </button>

              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {displayLabel}
              </span>

              <button
                onClick={() => changeDateBy(1)}
                disabled={isToday}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
                  isToday
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-110 active:scale-95"
                }`}
                style={{
                  background: isToday 
                    ? 'linear-gradient(145deg, rgba(17, 24, 39, 0.5), rgba(9, 9, 11, 0.5))'
                    : 'linear-gradient(145deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isToday ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <span className={`font-semibold text-lg leading-none ${isToday ? 'text-gray-600' : 'text-gray-300'}`}>&gt;</span>
              </button>
            </div>

            {/* Right – Calendar + Total */}
            <div className="flex items-center gap-4 sm:gap-8">
              <button
                onClick={() => setIsCalendarOpen(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group"
                style={{
                  background: isToday
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : 'linear-gradient(145deg, rgba(17, 24, 39, 0.8), rgba(9, 9, 11, 0.8))',
                  border: isToday ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: isToday 
                    ? '0 4px 20px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <span className="relative z-10">Open Calendar</span>
                {!isToday && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                )}
              </button>

              <div 
                className="text-right px-5 py-3 rounded-xl backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
              >
                <p className="text-xs text-gray-400 font-medium mb-1">Total Expenses</p>
                <p className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ₹{totalForDay.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Expenses */}
        <section>
          <div 
            className="relative backdrop-blur-2xl rounded-3xl p-6 sm:p-8 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.7) 0%, rgba(0, 0, 0, 0.85) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Subtle inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Expenses
                </h3>
                {expenses.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {showAll ? 'Grid View' : layout.shape} • {expenses.length} {expenses.length === 1 ? 'transaction' : 'transactions'}
                  </p>
                )}
              </div>
                
              <div className="flex items-center gap-4">
                {/* Toggle Button */}
                {hasMoreThanLimit && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="relative px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span className="relative z-10">
                    {showAll ? 'Show Less' : `Show More (+${expenses.length - POLYGON_LIMIT})`}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>
                )}
              </div>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
                </div>
                <p className="text-gray-400 font-medium">Loading expenses...</p>
              </div>
            )}

            {!loading && expenses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-center text-lg font-medium">
                No expenses for {displayLabel}
              </p>
                <p className="text-gray-600 text-sm mt-2">Start tracking your expenses today!</p>
              </div>
            )}

            {!loading && expenses.length > 0 && (
              <>
                {/* Mobile View - Always Grid */}
                <div className="block lg:hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {expenses.map((e, index) => (
                      <div 
                        key={e._id}
                        style={{ animation: `fadeInGrid 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.03}s both` }}
                      >
                        <ExpenseTile e={e} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop View - Polygon or Grid */}
                <div className="hidden lg:block">
                  {!showAll ? (
                    // Polygon Layout
                    <div className="relative w-full flex items-center justify-center" style={{ height: '480px', isolation: 'isolate' }}>
                      {/* Shape indicator lines - shortened to avoid tiles */}
                      {displayedExpenses.length >= 3 && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" style={{ zIndex: 0 }}>
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6" />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
                            </linearGradient>
                          </defs>
                          {layout.positions.map((_, i) => {
                            const nextIndex = (i + 1) % layout.positions.length;
                            const centerX = 50;
                            const centerY = 50;
                            
                            // Calculate direction vectors
                            const dx1 = layout.positions[i].left - centerX;
                            const dy1 = layout.positions[i].top - centerY;
                            const dx2 = layout.positions[nextIndex].left - centerX;
                            const dy2 = layout.positions[nextIndex].top - centerY;
                            
                            // Shorten lines by ~8% to avoid tile overlap (tile width is 112px, container is ~480px)
                            const shortenFactor = 0.92;
                            const x1 = centerX + dx1 * shortenFactor;
                            const y1 = centerY + dy1 * shortenFactor;
                            const x2 = centerX + dx2 * shortenFactor;
                            const y2 = centerY + dy2 * shortenFactor;
                            
                            return (
                              <line
                                key={i}
                                x1={`${x1}%`}
                                y1={`${y1}%`}
                                x2={`${x2}%`}
                                y2={`${y2}%`}
                                stroke="url(#lineGradient)"
                                strokeWidth="2"
                              />
                            );
                          })}
                        </svg>
                      )}

                      {/* Expense tiles positioned in polygon shape */}
                      {displayedExpenses.map((e, index) => (
                        <div
                          key={e._id}
                          className="absolute group-container"
                          style={{
                            top: `${layout.positions[index].top}%`,
                            left: `${layout.positions[index].left}%`,
                            transform: 'translate(-50%, -50%)',
                            width: '112px',
                            animation: `fadeInPolygon 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.06}s both`,
                            zIndex: 10
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.zIndex = '100';
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.zIndex = '10';
                          }}
                        >
                          <ExpenseTile e={e} isPolygon={true} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Modern List Layout (all expenses)
                    <div className="space-y-3">
                      {expenses.map((e, index) => {
                        const hexToRgb = (hex: string) => {
                          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                          return result
                            ? {
                                r: parseInt(result[1], 16),
                                g: parseInt(result[2], 16),
                                b: parseInt(result[3], 16),
                              }
                            : { r: 59, g: 130, b: 246 };
                        };
                        const rgb = hexToRgb(e.category.color);
                        const date = new Date(e.occuredAt);
                        const timeStr = date.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        });
                        
                        return (
                          <div 
                            key={e._id}
                            className="relative group overflow-hidden rounded-xl"
                            style={{
                              background: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) 50%, rgba(0, 0, 0, 0.4) 100%)`,
                              border: `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                              animation: `fadeInGrid 0.4s ease-out ${index * 0.03}s both`
                            }}
                          >
                            {/* Colored accent bar */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1"
                              style={{ backgroundColor: e.category.color }}
                            />
                            
                            <div className="pl-4 pr-5 py-4 flex items-center justify-between gap-4">
                              {/* Left section - Category and Details */}
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Category badge with emoji */}
                                <div
                                  className="shrink-0 px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-2"
                                  style={{
                                    backgroundColor: `${e.category.color}20`,
                                    color: e.category.color,
                                    border: `1px solid ${e.category.color}40`
                                  }}
                                >
                                  {e.category.emoji && (
                                    <span className="text-base">{e.category.emoji}</span>
                                  )}
                                  <span>{e.category.name}</span>
                                </div>
                                
                                {/* Time and Notes */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="text-gray-400 text-sm font-medium">{timeStr}</span>
                                  </div>
                                  {e.notes && (
                                    <p className="text-gray-300 text-sm truncate">
                                      {e.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Right section - Amount */}
                              <div className="shrink-0 text-right">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-gray-500 text-sm font-medium">₹</span>
                                  <span
                                    className="text-2xl font-black tracking-tight"
                                    style={{
                                      color: e.category.color,
                                      textShadow: `0 0 12px ${e.category.color}50`
                                    }}
                                  >
                                    {e.amount.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Subtle hover effect */}
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                              style={{
                                background: `linear-gradient(90deg, transparent 0%, ${e.category.color}10 50%, transparent 100%)`
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <style>{`
          @keyframes fadeInPolygon {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.6) rotate(-10deg);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1) rotate(0deg);
            }
          }

          @keyframes fadeInGrid {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          .animate-shimmer {
            animation: shimmer 3s ease-in-out infinite;
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