type RibbonMapEntry = {
  count: number;
};

type RibbonMap = Map<string, RibbonMapEntry>;

interface HomeTopBarProps {
  displayLabel: string;
  hideAmounts: boolean;
  totalForDay: number;
  isToday: boolean;
  ribbonLoading: boolean;
  ribbonDays: Date[];
  ribbonMap: RibbonMap;
  apiDate: string;
  today: Date;
  onChangeDate: (days: number) => void;
  onOpenCalendar: () => void;
  onSelectRibbonDay: (date: Date) => void;
  getFormattedDate: (date: Date) => string;
}

const HomeTopBar = ({
  displayLabel,
  hideAmounts,
  totalForDay,
  isToday,
  ribbonLoading,
  ribbonDays,
  ribbonMap,
  apiDate,
  today,
  onChangeDate,
  onOpenCalendar,
  onSelectRibbonDay,
  getFormattedDate,
}: HomeTopBarProps) => {
  return (
    <section className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.08)]">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-white/2" />
      <div className="absolute inset-0 border border-white/15 rounded-2xl" />
      <div className="absolute top-0 left-[18%] right-[18%] h-px bg-linear-to-r from-transparent via-emerald-400/40 to-transparent" />
      <div className="absolute top-0 left-0 w-12 h-12 bg-linear-to-br from-white/8 to-transparent" />
      <div className="absolute bottom-0 right-0 w-12 h-12 bg-linear-to-tl from-white/5 to-transparent" />

      <div className="relative px-4 lg:px-5 py-2.5 lg:py-3">
        <div className="hidden lg:flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeDate(-1)}
              className="w-7.5 h-7.5 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/60 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={onOpenCalendar}
              className="flex items-center gap-1.5 px-2.5 py-1.25 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p className="text-[15px] font-bold">{displayLabel}</p>
              <svg className="w-3 h-3 text-white/30 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onChangeDate(1)}
              disabled={isToday}
              className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-colors ${
                isToday ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-white/5 hover:bg-white/10 text-white/60"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex-1 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Today's Spending</p>
            <p className="text-[22px] font-bold tracking-wide leading-tight">
              {hideAmounts ? "₹•••••" : `₹${totalForDay.toFixed(0)}`}
            </p>
          </div>

          <div className="flex items-center gap-2" />
        </div>

        <div className="hidden lg:block mt-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Last 7 Days</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Tap a day</p>
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {ribbonLoading ? (
              Array.from({ length: 7 }).map((_, idx) => (
                <div key={idx} className="h-9 rounded-lg border border-white/10 bg-white/3" />
              ))
            ) : (
              ribbonDays.map((day) => {
                const dateKey = getFormattedDate(day);
                const data = ribbonMap.get(dateKey);
                const count = data?.count || 0;
                const isSelected = dateKey === apiDate;
                const isCurrentDay = day.toDateString() === today.toDateString();
                const level = Math.min(4, count);
                const tone = [
                  "bg-white/[0.04]",
                  "bg-white/[0.08]",
                  "bg-white/[0.14]",
                  "bg-white/[0.22]",
                  "bg-white/[0.32]",
                ][level];

                return (
                  <button
                    key={dateKey}
                    onClick={() => onSelectRibbonDay(day)}
                    className={`rounded-lg border px-1.5 py-1 text-center transition-all ${
                      isSelected ? "border-white/50" : "border-white/10 hover:border-white/30"
                    } ${tone}`}
                  >
                    <div className={`text-[9px] uppercase ${isCurrentDay ? "text-white" : "text-white/50"}`}>
                      {day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                    </div>
                    <div className={`text-[11px] font-semibold ${isCurrentDay ? "text-white" : "text-white/70"}`}>
                      {day.getDate()}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:hidden flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2.5">
            <button
              onClick={() => onChangeDate(-1)}
              className="w-7.5 h-7.5 bg-white/5 active:bg-white/10 rounded-lg flex items-center justify-center text-white/60 transition-colors touch-manipulation"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={onOpenCalendar}
              className="py-1.25 px-2.5 bg-white/5 active:bg-white/10 rounded-lg transition-colors touch-manipulation flex items-center gap-1"
            >
              <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p className="text-xs font-semibold">{displayLabel}</p>
              <svg className="w-2 h-2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onChangeDate(1)}
              disabled={isToday}
              className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-colors touch-manipulation ${
                isToday ? "bg-white/5 text-white/20" : "bg-white/5 active:bg-white/10 text-white/60"
              }`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="mb-2.5">
            <p className="text-[9px] text-white/40 uppercase tracking-[0.18em] mb-0.5">Today's Spending</p>
            <p className="text-sm font-bold tracking-wide leading-tight">
              {hideAmounts ? "₹•••••" : `₹${totalForDay.toFixed(0)}`}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2" />
        </div>

        <div className="lg:hidden mt-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.24em] text-white/40">Last 7 Days</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">Tap a day</p>
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {ribbonLoading ? (
              Array.from({ length: 7 }).map((_, idx) => (
                <div key={idx} className="h-9 rounded-lg border border-white/10 bg-white/3" />
              ))
            ) : (
              ribbonDays.map((day) => {
                const dateKey = getFormattedDate(day);
                const data = ribbonMap.get(dateKey);
                const count = data?.count || 0;
                const isSelected = dateKey === apiDate;
                const isCurrentDay = day.toDateString() === today.toDateString();
                const level = Math.min(4, count);
                const tone = [
                  "bg-white/[0.04]",
                  "bg-white/[0.08]",
                  "bg-white/[0.14]",
                  "bg-white/[0.22]",
                  "bg-white/[0.32]",
                ][level];

                return (
                  <button
                    key={dateKey}
                    onClick={() => onSelectRibbonDay(day)}
                    className={`rounded-lg border px-1 py-1.5 text-center transition-all ${
                      isSelected ? "border-white/50" : "border-white/10"
                    } ${tone}`}
                  >
                    <div className={`text-[8px] uppercase ${isCurrentDay ? "text-white" : "text-white/50"}`}>
                      {day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                    </div>
                    <div className={`text-[11px] font-semibold ${isCurrentDay ? "text-white" : "text-white/70"}`}>
                      {day.getDate()}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeTopBar;
