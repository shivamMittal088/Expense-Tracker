import { X, Wallet, CreditCard, Smartphone, Building2, Banknote, Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import Api from "../routeWrapper/Api";
import { showToast, showTopToast } from "../utils/Redirecttoast";
import { CalendarPicker } from "../utils/UI/CalendarPicker";
import { TimePicker } from "../utils/UI/TimePicker";

type Tile = {
  _id: string;
  name: string;
  color: string;
  emoji?: string;
};

type Expense = {
  _id: string;
  amount: number;
  category: {
    name: string;
    color: string;
    emoji?: string;
  };
  payment_mode: string;
  notes?: string;
  occurredAt: string;
  currency?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
  onUpdate?: () => void;
};

const paymentModes = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "bank_transfer", label: "Bank", icon: Building2 },
  { id: "UPI", label: "UPI", icon: Smartphone },
];

export default function EditExpenseModal({ open, onClose, expense, onUpdate }: Props) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loadingTiles, setLoadingTiles] = useState(true);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [notes, setNotes] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState({ hours: 0, minutes: 0 });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  // Load tiles and populate form when modal opens
  useEffect(() => {
    if (!open || !expense) return;

    let cancelled = false;
    setLoadingTiles(true);

    // Populate form with expense data
    setAmount(String(expense.amount));
    setCategory(expense.category.name);
    setPaymentMode(expense.payment_mode);
    setNotes(expense.notes || "");
    
    const expenseDate = new Date(expense.occurredAt);
    setSelectedDate(expenseDate);
    setSelectedTime({ hours: expenseDate.getHours(), minutes: expenseDate.getMinutes() });
    
    const pad = (n: number) => String(n).padStart(2, "0");
    setOccurredAt(
      `${expenseDate.getFullYear()}-${pad(expenseDate.getMonth() + 1)}-${pad(expenseDate.getDate())}T${pad(expenseDate.getHours())}:${pad(expenseDate.getMinutes())}:${pad(expenseDate.getSeconds())}`
    );

    Api.get<Tile[]>("/api/tiles")
      .then(({ data }) => {
        if (cancelled) return;
        setTiles(data);
      })
      .catch(() => {
        if (cancelled) return;
        showToast("Unable to load categories right now.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingTiles(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, expense]);

  const handleUpdate = async () => {
    if (!expense) return;
    
    if (!amount || !category || !paymentMode) {
      showTopToast("Please fill amount, category and payment mode", { tone: "error", duration: 2200 });
      return;
    }

    const selectedTile = tiles.find((t) => t.name === category);

    const payload = {
      amount: Number(amount),
      category: {
        name: selectedTile?.name || category,
        color: selectedTile?.color || "#CCCCCC",
        emoji: selectedTile?.emoji || "✨",
      },
      payment_mode: paymentMode === "UPI" ? "UPI" : paymentMode.toLowerCase(),
      notes,
      currency: "INR",
      occurredAt,
    };

    setLoading(true);
    try {
      const { data } = await Api.patch(`/api/expense/${expense._id}`, payload, {
        params: {
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        },
      });
      showTopToast(data?.message || "Expense updated", { duration: 2000 });
      window.dispatchEvent(new CustomEvent("expense:updated"));
      onUpdate?.();
      onClose();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update expense.";
      showTopToast(message, { tone: "error", duration: 2500 });
    } finally {
      setLoading(false);
    }
  };

  if (!expense) return null;

  return (
    <>
      {/* Dark Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background: "var(--bg-overlay)",
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Floating Card Modal */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-full ${
          open 
            ? "-translate-y-1/2 opacity-100 scale-100 pointer-events-auto" 
            : "-translate-y-[60%] opacity-0 scale-95 pointer-events-none"
        }`}
        style={{
          maxWidth: "340px",
          padding: "0 12px",
        }}
      >
        {/* Main Card */}
        <div 
          className="relative overflow-hidden bg-theme-bg-secondary border border-theme-border"
          style={{
            borderRadius: "1.25rem",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Header */}
          <div 
            className="relative px-4 py-3 flex items-center justify-between border-b border-theme-border-subtle"
          >
            <h2 className="text-sm font-semibold text-theme-text-primary">Edit Expense</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-theme-bg-hover"
            >
              <X className="w-4 h-4 text-theme-text-muted" />
            </button>
          </div>



          {/* Content */}
          <div 
            className="px-4 pb-4 space-y-3 max-h-[60vh] overflow-y-auto" 
            style={{ 
              paddingTop: "0.75rem",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255, 255, 255, 0.15) transparent",
            }}
          >
            {/* Amount */}
            <div 
              className={`p-3 transition-all duration-200 rounded-xl bg-theme-bg-hover ${amountFocused ? 'border border-theme-border' : 'border border-theme-border-subtle'}`}
            >
              <label className="text-[9px] font-semibold text-theme-text-muted uppercase tracking-wide block mb-1">Amount</label>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-theme-text-muted">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  className="flex-1 text-xl font-bold border-0 outline-none bg-transparent text-theme-text-primary placeholder-theme-text-dim"
                />
              </div>
            </div>

            {/* Category Grid */}
            <div>
              <label className="text-[9px] font-semibold text-theme-text-muted uppercase tracking-wide block mb-2">Category</label>
              {loadingTiles ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 rounded-full border-2 border-theme-border border-t-theme-accent animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {tiles.map((tile) => {
                    const isSelected = category === tile.name;
                    return (
                      <button
                        key={tile._id}
                        onClick={() => setCategory(tile.name)}
                        className={`p-2 flex flex-col items-center gap-1 rounded-lg transition-all border ${isSelected ? 'bg-theme-bg-active border-theme-border' : 'bg-theme-bg-hover border-theme-border-subtle'}`}
                      >
                        <span className="text-sm">{tile.emoji || "✨"}</span>
                        <span className={`text-[8px] font-medium leading-tight ${isSelected ? 'text-theme-text-primary' : 'text-theme-text-muted'}`}>
                          {tile.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label className="text-[9px] font-semibold text-theme-text-muted uppercase tracking-wide block mb-2">Payment</label>
              <div className="grid grid-cols-5 gap-1">
                {paymentModes.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setPaymentMode(mode.id)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all border ${isSelected ? 'bg-theme-bg-active border-theme-border' : 'bg-theme-bg-hover border-theme-border-subtle'}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-theme-text-primary' : 'text-theme-text-muted'}`} />
                      <span className={`text-[8px] font-medium ${isSelected ? 'text-theme-text-primary' : 'text-theme-text-muted'}`}>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <label className="text-[9px] font-semibold text-theme-text-muted uppercase tracking-wide block mb-2">When</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  className="flex-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-theme-text-secondary transition-colors bg-theme-bg-hover border border-theme-border-subtle"
                >
                  <Calendar className="w-3.5 h-3.5 text-theme-text-muted" />
                  {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </button>
                <button
                  type="button"
                  onClick={() => setTimePickerOpen(true)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-theme-text-secondary font-mono transition-colors bg-theme-bg-hover border border-theme-border-subtle"
                >
                  <Clock className="w-3.5 h-3.5 text-theme-text-muted" />
                  {String(selectedTime.hours).padStart(2, '0')}:{String(selectedTime.minutes).padStart(2, '0')}
                </button>
              </div>
            </div>

            {/* Calendar Picker Modal */}
            <CalendarPicker
              isOpen={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                const pad = (n: number) => String(n).padStart(2, "0");
                const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                const timeStr = `${pad(selectedTime.hours)}:${pad(selectedTime.minutes)}:00`;
                setOccurredAt(`${dateStr}T${timeStr}`);
                setCalendarOpen(false);
              }}
              maxDate={new Date()}
              closeOnClickOutside={true}
            />

            {/* Time Picker Modal */}
            <TimePicker
              isOpen={timePickerOpen}
              onClose={() => setTimePickerOpen(false)}
              selectedTime={selectedTime}
              onTimeSelect={(hours, minutes) => {
                setSelectedTime({ hours, minutes });
                const pad = (n: number) => String(n).padStart(2, "0");
                const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
                setOccurredAt(`${dateStr}T${pad(hours)}:${pad(minutes)}:00`);
              }}
              closeOnClickOutside={true}
            />

            {/* Notes */}
            <div>
              <label className="text-[9px] font-semibold text-theme-text-muted uppercase tracking-wide block mb-2">Notes</label>
              <textarea
                placeholder="Optional note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
                rows={1}
                className={`w-full px-2.5 py-2 rounded-lg text-[11px] outline-none resize-none text-theme-text-primary placeholder-theme-text-dim bg-theme-bg-hover border ${notesFocused ? 'border-theme-border' : 'border-theme-border-subtle'}`}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-[11px] font-medium text-theme-text-secondary rounded-lg transition-colors hover:bg-theme-bg-hover bg-theme-bg-hover border border-theme-border-subtle"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 py-2 text-[11px] font-semibold rounded-lg disabled:opacity-50 transition-colors bg-theme-bg-button text-theme-text-button hover:bg-theme-bg-button-hover"
              >
                {loading ? "..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
