import { lazy, Suspense } from "react";
import { Plus, Calculator as CalculatorIcon, FileDown, FileSpreadsheet, LogOut } from "lucide-react";

const FooterSettingsIcon = lazy(() =>
  import("./FooterLazyIcons").then((module) => ({ default: module.FooterSettingsIcon }))
);

interface FooterToolsPanelProps {
  isLoggingOut: boolean;
  onAddExpense: () => void;
  onCalculator: () => void;
  onPdf: () => void;
  onExcel: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export default function FooterToolsPanel({
  isLoggingOut,
  onAddExpense,
  onCalculator,
  onPdf,
  onExcel,
  onSettings,
  onLogout,
}: FooterToolsPanelProps) {
  return (
    <div className="fixed bottom-22 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-sm">
      <div className="rounded-2xl border border-white/15 bg-white/6 backdrop-blur-xl p-3 shadow-2xl">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAddExpense}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-3 py-2 text-[11px] text-white/80 hover:bg-white/8 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Plus size={14} className="text-white/80" />
            </span>
            Add Expense
          </button>
          <button
            onClick={onCalculator}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-3 py-2 text-[11px] text-white/80 hover:bg-white/8 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <CalculatorIcon size={14} className="text-white/80" />
            </span>
            Calculator
          </button>
          <button
            onClick={onPdf}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-3 py-2 text-[11px] text-white/80 hover:bg-white/8 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <FileDown size={14} className="text-white/80" />
            </span>
            PDF Report
          </button>
          <button
            onClick={onExcel}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-3 py-2 text-[11px] text-white/80 hover:bg-white/8 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <FileSpreadsheet size={14} className="text-white/80" />
            </span>
            Export Excel
          </button>
          <button
            onClick={onSettings}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-3 py-2 text-[11px] text-white/80 hover:bg-white/8 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Suspense fallback={<span className="w-3.5 h-3.5" aria-hidden="true" />}>
                <FooterSettingsIcon className="text-white/80" />
              </Suspense>
            </span>
            Settings
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300 hover:bg-red-500/20 transition-colors"
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
