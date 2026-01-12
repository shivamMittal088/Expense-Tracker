import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";



const HomePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const formattedDate = selectedDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Close modal on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  return (
    <div className="space-y-4 py-4 mt-6">

      {/* ================= TOP SECTION ================= */}
      <section className="bg-white w-full max-w-xl rounded-xl shadow-sm px-4 py-3 mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">Tracking date</p>
            <h2 className="text-sm font-semibold">{formattedDate}</h2>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-100 transition"
          >
            <Calendar size={12} />
            Select
          </button>
        </div>

        <div className="my-2 h-px bg-gray-100" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="text-lg font-semibold">₹12,450</p>
          </div>

          <button className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700 transition">
            + Add Expense
          </button>
        </div>
      </section>

      {/* ================= LOWER SECTION ================= */}
      <section className="bg-white w-full max-w-xl rounded-xl shadow-sm px-4 py-3 mx-auto">
        <h3 className="text-sm font-semibold mb-3">Recent Expenses</h3>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-gray-500">
            No expenses recorded for this date.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Add your first expense to start tracking.
          </p>
        </div>
      </section>

      {/* ================= MODAL CALENDAR ================= */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center
  bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35),rgba(0,0,0,0.85))]
  backdrop-blur-md">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl p-6 w-96 max-w-md"
          >
            <style>{`
              .rdp {
                --rdp-cell-size: 40px;
                --rdp-accent-color: #2563eb;
                --rdp-background-color: #eff6ff;
                margin: 0;
              }
              
              .rdp-months {
                justify-content: center;
              }
              
              .rdp-month {
                width: 100%;
              }
              
              .rdp-caption {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
              }
              
              .rdp-caption_label {
                font-size: 1rem;
                font-weight: 600;
                color: #111827;
              }
              
              .rdp-nav {
                display: flex;
                gap: 0.25rem;
              }
              
              .rdp-nav_button {
                width: 2rem;
                height: 2rem;
                border-radius: 0.5rem;
                color: #4b5563;
                transition: background-color 0.2s;
              }
              
              .rdp-nav_button:hover {
                background-color: #f3f4f6;
              }
              
              .rdp-head_cell {
                font-size: 0.75rem;
                font-weight: 500;
                color: #6b7280;
                text-transform: uppercase;
              }
              
              .rdp-cell {
                padding: 0.125rem;
              }
              
              .rdp-day {
                font-size: 0.875rem;
                font-weight: 500;
                color: #374151;
                border-radius: 0.5rem;
                transition: background-color 0.2s;
              }
              
              .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_disabled) {
                background-color: #f3f4f6;
              }
              
              .rdp-day_selected {
                background-color: #2563eb !important;
                color: white !important;
                font-weight: 600;
              }
              
              .rdp-day_selected:hover {
                background-color: #1d4ed8 !important;
              }
              
              .rdp-day_today:not(.rdp-day_selected) {
                background-color: #eff6ff;
                color: #2563eb;
                font-weight: 600;
              }
              
              .rdp-day_disabled {
                color: #d1d5db;
                cursor: not-allowed;
              }
              
              .rdp-day_disabled:hover {
                background-color: transparent;
              }
              
              .rdp-day_outside {
                color: #d1d5db;
              }
            `}</style>
            
            <DayPicker
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate}
              disabled={{ after: new Date() }}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setOpen(false);
                }
              }}
            />

            <div className="flex gap-3 mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setOpen(false);
                }}
                className="flex-1 text-sm font-medium py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Today
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-5 text-sm font-medium py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    

  );
};

export default HomePage;