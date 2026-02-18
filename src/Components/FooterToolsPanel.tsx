import { lazy, Suspense } from "react";
import { Plus, Calculator as CalculatorIcon, FileSpreadsheet, LogOut } from "lucide-react";

const FooterSettingsIcon = lazy(() =>
  import("./FooterLazyIcons").then((module) => ({ default: module.FooterSettingsIcon }))
);

interface FooterToolsPanelProps {
  isLoggingOut: boolean;
  onAddExpense: () => void;
  onCalculator: () => void;
  onExcel: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export default function FooterToolsPanel({
  isLoggingOut,
  onAddExpense,
  onCalculator,
  onExcel,
  onSettings,
  onLogout,
}: FooterToolsPanelProps) {
  return (
    <div className="fixed bottom-22 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-sm pb-[max(env(safe-area-inset-bottom),0.25rem)]">
      <div className="rounded-2xl border border-zinc-600/70 bg-zinc-950/95 backdrop-blur-xl p-3.5 shadow-2xl shadow-black/80 ring-1 ring-white/10">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAddExpense}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-[11px] text-zinc-100 hover:bg-zinc-800/90 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Plus size={14} className="text-zinc-100" />
            </span>
            Add Expense
          </button>
          <button
            onClick={onCalculator}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-[11px] text-zinc-100 hover:bg-zinc-800/90 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center">
              <CalculatorIcon size={14} className="text-zinc-100" />
            </span>
            Calculator
          </button>
          <button
            onClick={onExcel}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-[11px] text-zinc-100 hover:bg-zinc-800/90 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center">
              <FileSpreadsheet size={14} className="text-zinc-100" />
            </span>
            Export Excel
          </button>
          <button
            onClick={onSettings}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-[11px] text-zinc-100 hover:bg-zinc-800/90 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Suspense fallback={<span className="w-3.5 h-3.5" aria-hidden="true" />}>
                <FooterSettingsIcon className="text-zinc-100" />
              </Suspense>
            </span>
            Settings
          </button>
          <button
            onClick={onLogout}
            className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300 hover:bg-red-500/20 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
              <LogOut size={14} className="text-red-300" />
            </span>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}
