import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import api from "../../routeWrapper/Api";

type HeatmapData = {
  date: string;
  count: number;
  totalAmount: number;
};

type HeatmapProps = {
  onDateClick?: (date: string, count: number, amount: number) => void;
};

const Heatmap = ({ onDateClick }: HeatmapProps) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; amount: number; x: number; y: number } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch heatmap data
  useEffect(() => {
    const fetchHeatmapData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/expenses/heatmap?year=${year}`);
        setHeatmapData(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch heatmap data:", err);
        setHeatmapData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmapData();
  }, [year, refreshKey]);

  // Refetch when expense is added/updated
  useEffect(() => {
    const handleExpenseChange = () => setRefreshKey((k) => k + 1);
    window.addEventListener("expense:added", handleExpenseChange);
    return () => window.removeEventListener("expense:added", handleExpenseChange);
  }, []);

  // Create a map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapData>();
    heatmapData.forEach((d) => map.set(d.date, d));
    return map;
  }, [heatmapData]);

  // Generate all weeks for the year
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Adjust start to Sunday
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - startDate.getDay());

    const currentDate = new Date(firstSunday);
    let currentWeek: Date[] = [];

    while (currentDate <= endDate || currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }

      if (currentDate <= endDate) {
        currentWeek.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        break;
      }
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [year]);

  // Get color intensity based on transaction count
  const getColorClass = (count: number): string => {
    if (count === 0) return "bg-zinc-800/80 border border-zinc-700/50";
    if (count === 1) return "bg-emerald-900";
    if (count === 2) return "bg-emerald-700";
    if (count === 3) return "bg-emerald-600";
    if (count <= 5) return "bg-emerald-500";
    return "bg-emerald-400"; // 6+ transactions
  };

  // Format date for display (use local date, not UTC)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Get today's date in local timezone
  const getTodayStr = (): string => {
    const now = new Date();
    return formatDate(now);
  };

  // Get month labels with positions
  const monthLabels = useMemo(() => {
    const labels: { month: string; position: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find((d) => d.getFullYear() === year);
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.getMonth();
        if (month !== lastMonth) {
          labels.push({
            month: firstDayOfWeek.toLocaleString("default", { month: "short" }),
            position: weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks, year]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalDays = heatmapData.length;
    const totalTransactions = heatmapData.reduce((sum, d) => sum + d.count, 0);
    const totalAmount = heatmapData.reduce((sum, d) => sum + d.totalAmount, 0);
    const maxCount = Math.max(...heatmapData.map((d) => d.count), 0);

    return { totalDays, totalTransactions, totalAmount, maxCount };
  }, [heatmapData]);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20">
            <Calendar size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Transaction Activity</h3>
            <p className="text-zinc-500 text-xs">{stats.totalTransactions} transactions in {stats.totalDays} days</p>
          </div>
        </div>

        {/* Year Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <ChevronLeft size={16} className="text-white/70" />
          </button>
          <span className="text-white font-medium text-sm min-w-[50px] text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= new Date().getFullYear()}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} className="text-white/70" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Total Spent</p>
          <p className="text-white font-bold text-sm">₹{stats.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Transactions</p>
          <p className="text-white font-bold text-sm">{stats.totalTransactions}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Active Days</p>
          <p className="text-white font-bold text-sm">{stats.totalDays}</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="min-w-[750px]">
            {/* Month Labels */}
            <div className="flex mb-2 ml-8 relative h-4">
              {monthLabels.map((label, idx) => (
                <span
                  key={idx}
                  className="text-zinc-500 text-[10px] absolute"
                  style={{ 
                    left: `${label.position * 13}px`
                  }}
                >
                  {label.month}
                </span>
              ))}
            </div>

            <div className="flex">
              {/* Day Labels */}
              <div className="flex flex-col gap-[2px] mr-2">
                {dayLabels.map((day, idx) => (
                  <span
                    key={idx}
                    className="text-zinc-600 text-[9px] h-[11px] leading-[11px]"
                    style={{ visibility: idx % 2 === 0 ? "hidden" : "visible" }}
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Weeks Grid */}
              <div className="flex gap-[2px]">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[2px]">
                    {week.map((day, dayIdx) => {
                      const dateStr = formatDate(day);
                      const data = dataMap.get(dateStr);
                      const count = data?.count || 0;
                      const amount = data?.totalAmount || 0;
                      const isCurrentYear = day.getFullYear() === year;
                      const isToday = dateStr === getTodayStr();
                      const isFuture = day > new Date();

                      return (
                        <div
                          key={dayIdx}
                          className={`w-[11px] h-[11px] rounded-[2px] transition-all duration-200 cursor-pointer
                            ${isCurrentYear && !isFuture ? getColorClass(count) : "bg-white/[0.02]"}
                            ${isToday ? "ring-1 ring-white/40" : ""}
                            ${!isFuture ? "hover:ring-1 hover:ring-white/30 hover:scale-125" : "opacity-30"}
                          `}
                          onMouseEnter={(e) => {
                            if (!isFuture && isCurrentYear) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredDay({
                                date: dateStr,
                                count,
                                amount,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                          onClick={() => {
                            if (!isFuture && isCurrentYear && onDateClick) {
                              onDateClick(dateStr, count, amount);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-zinc-500 text-[10px]">Less</span>
              <div className="flex gap-[2px]">
                <div className="w-[11px] h-[11px] rounded-[2px] bg-zinc-800/80 border border-zinc-700/50" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-900" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-700" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-600" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-500" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-400" />
              </div>
              <span className="text-zinc-500 text-[10px]">More</span>
            </div>
          </div>
        )}

        {/* Tooltip */}
        {hoveredDay && (
          <div
            className="fixed z-50 bg-zinc-900 border border-white/20 rounded-lg px-3 py-2 shadow-xl pointer-events-none"
            style={{
              left: hoveredDay.x,
              top: hoveredDay.y - 60,
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-white text-xs font-medium">
              {new Date(hoveredDay.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-emerald-400 text-[11px]">
              {hoveredDay.count} transaction{hoveredDay.count !== 1 ? "s" : ""} • ₹{hoveredDay.amount.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Heatmap;
