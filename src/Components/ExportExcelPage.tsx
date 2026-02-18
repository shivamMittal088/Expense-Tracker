import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarRange, Download, FileSpreadsheet } from "lucide-react";
import api from "../routeWrapper/Api";

const CalendarPicker = lazy(() =>
  import("../utils/UI/CalendarPicker").then((module) => ({
    default: module.CalendarPicker,
  }))
);

type DateRange = {
  startDate: string;
  endDate: string;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const getPreviousWeekRange = (): DateRange => {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() - 1);

  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
};

const getPreviousMonthRange = (): DateRange => {
  const now = new Date();
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayPreviousMonth = new Date(firstDayCurrentMonth.getTime() - 1);
  const firstDayPreviousMonth = new Date(lastDayPreviousMonth.getFullYear(), lastDayPreviousMonth.getMonth(), 1);

  return {
    startDate: formatDate(firstDayPreviousMonth),
    endDate: formatDate(lastDayPreviousMonth),
  };
};

const ExportExcelPage = () => {
  const navigate = useNavigate();
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [openCalendarFor, setOpenCalendarFor] = useState<"start" | "end" | null>(null);
  const [downloading, setDownloading] = useState<"week" | "month" | "custom" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previousWeekRange = useMemo(() => getPreviousWeekRange(), []);
  const previousMonthRange = useMemo(() => getPreviousMonthRange(), []);

  const downloadExcel = async (mode: "week" | "month" | "custom", range: DateRange) => {
    try {
      setDownloading(mode);
      setErrorMessage(null);

      const tzOffsetMinutes = new Date().getTimezoneOffset();
      const response = await api.get("/api/expenses/export/excel", {
        responseType: "blob",
        params: {
          tzOffsetMinutes,
          startDate: range.startDate,
          endDate: range.endDate,
        },
      });

      const contentDisposition = response.headers["content-disposition"] as string | undefined;
      const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
      const fallbackName = `expenses-${range.startDate}-to-${range.endDate}.xlsx`;
      const fileName = filenameMatch?.[1] || fallbackName;

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("Failed to export Excel. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const handleCustomExport = async () => {
    if (!customStartDate || !customEndDate) {
      setErrorMessage("Please choose both start and end date.");
      return;
    }

    const start = new Date(`${customStartDate}T00:00:00.000Z`);
    const end = new Date(`${customEndDate}T23:59:59.999Z`);
    if (start > end) {
      setErrorMessage("Start date cannot be after end date.");
      return;
    }

    await downloadExcel("custom", {
      startDate: customStartDate,
      endDate: customEndDate,
    });
  };

  const selectedCustomStartDate = customStartDate ? parseDate(customStartDate) : new Date();
  const selectedCustomEndDate = customEndDate ? parseDate(customEndDate) : new Date();

  const maxStartDate = customEndDate ? parseDate(customEndDate) : new Date();
  const maxEndDate = new Date();

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-4 pt-3 pb-28">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="h-10 px-3 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 flex items-center gap-2 hover:border-zinc-500 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet size={20} className="text-zinc-200" />
            <h1 className="text-xl sm:text-2xl font-bold">Export Excel</h1>
          </div>
          <p className="text-zinc-400 text-sm mb-5">Download expense receipts as .xlsx by quick range or custom dates.</p>

          <div className="space-y-3">
            <button
              onClick={() => downloadExcel("week", previousWeekRange)}
              disabled={downloading !== null}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-left hover:border-zinc-500 transition-colors disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Previous Week Receipt</p>
                  <p className="text-xs text-zinc-400 mt-1">{previousWeekRange.startDate} to {previousWeekRange.endDate}</p>
                </div>
                <Download size={16} className="text-zinc-300" />
              </div>
            </button>

            <button
              onClick={() => downloadExcel("month", previousMonthRange)}
              disabled={downloading !== null}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-left hover:border-zinc-500 transition-colors disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Previous Month Receipt</p>
                  <p className="text-xs text-zinc-400 mt-1">{previousMonthRange.startDate} to {previousMonthRange.endDate}</p>
                </div>
                <Download size={16} className="text-zinc-300" />
              </div>
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarRange size={16} className="text-zinc-300" />
              <p className="text-sm font-semibold text-white">Custom Range</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-xs text-zinc-400">
                Start Date
                <button
                  type="button"
                  onClick={() => setOpenCalendarFor("start")}
                  className="mt-1 w-full h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100 flex items-center justify-between outline-none hover:border-zinc-500"
                >
                  <span>{customStartDate || "Select start date"}</span>
                  <CalendarRange size={14} className="text-zinc-400" />
                </button>
              </label>
              <label className="text-xs text-zinc-400">
                End Date
                <button
                  type="button"
                  onClick={() => setOpenCalendarFor("end")}
                  className="mt-1 w-full h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100 flex items-center justify-between outline-none hover:border-zinc-500"
                >
                  <span>{customEndDate || "Select end date"}</span>
                  <CalendarRange size={14} className="text-zinc-400" />
                </button>
              </label>
            </div>

            <button
              onClick={handleCustomExport}
              disabled={downloading !== null}
              className="mt-4 h-10 rounded-lg bg-white text-black px-4 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-60"
            >
              {downloading === "custom" ? "Preparing file..." : "Download Custom Receipt"}
            </button>
          </div>

          {downloading && downloading !== "custom" && (
            <p className="mt-4 text-xs text-zinc-400">Preparing file...</p>
          )}

          {errorMessage && (
            <p className="mt-3 text-xs text-rose-300">{errorMessage}</p>
          )}

          {openCalendarFor && (
            <Suspense
              fallback={(
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-600/50 border-t-zinc-200 animate-spin" />
                </div>
              )}
            >
              <CalendarPicker
                isOpen={Boolean(openCalendarFor)}
                onClose={() => setOpenCalendarFor(null)}
                selectedDate={openCalendarFor === "start" ? selectedCustomStartDate : selectedCustomEndDate}
                onDateSelect={(date) => {
                  const formatted = formatDate(date);
                  if (openCalendarFor === "start") {
                    setCustomStartDate(formatted);
                    if (!customEndDate || formatted > customEndDate) {
                      setCustomEndDate(formatted);
                    }
                  } else {
                    setCustomEndDate(formatted);
                    if (!customStartDate || formatted < customStartDate) {
                      setCustomStartDate(formatted);
                    }
                  }
                  setOpenCalendarFor(null);
                  setErrorMessage(null);
                }}
                maxDate={openCalendarFor === "start" ? maxStartDate : maxEndDate}
                closeOnClickOutside={true}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportExcelPage;
