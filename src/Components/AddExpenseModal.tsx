import { X, Wallet, CreditCard, Smartphone, Building2, Banknote, Calendar, Clock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Api from "../routeWrapper/Api";
import { showToast, showTopToast } from "../utils/Redirecttoast";
import { CalendarPicker } from "../utils/UI/CalendarPicker";
import { TimePicker } from "../utils/UI/TimePicker";
import AddTileModal from "./AddTileModal";
import { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
}

type Tile = {
  _id: string;
  name: string;
  color: string;
  emoji?: string;
  isBuiltIn?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const paymentModes = [
  { id: "cash", label: "Cash", icon: Banknote, color: "#10b981" },
  { id: "card", label: "Card", icon: CreditCard, color: "#8b5cf6" },
  { id: "wallet", label: "Wallet", icon: Wallet, color: "#f59e0b" },
  { id: "bank_transfer", label: "Bank", icon: Building2, color: "#06b6d4" },
  { id: "UPI", label: "UPI", icon: Smartphone, color: "#ec4899" },
];

export default function AddExpenseModal({ open, onClose }: Props) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loadingTiles, setLoadingTiles] = useState(true);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [notes, setNotes] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState({ hours: new Date().getHours(), minutes: new Date().getMinutes() });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [addTileOpen, setAddTileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);
  const [deletingTileId, setDeletingTileId] = useState<string | null>(null);
  const [tileToDelete, setTileToDelete] = useState<Tile | null>(null);

  const getLocalISOString = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return [
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    ].join("T");
  };

  const handleDeleteTile = (tile: Tile, e: React.MouseEvent) => {
    e.stopPropagation();
    setTileToDelete(tile);
  };

  const confirmDeleteTile = async () => {
    if (!tileToDelete || deletingTileId) return;
    
    const tileId = tileToDelete._id;
    setDeletingTileId(tileId);
    try {
      await Api.delete(`/api/tiles/remove/${tileId}`);
      setTiles((prev) => prev.filter((t) => t._id !== tileId));
      if (category === tileToDelete.name) {
        setCategory("");
      }
      showTopToast("Tile deleted", { duration: 1500 });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const message = axiosError?.response?.data?.message || "Failed to delete tile";
      showTopToast(message, { tone: "error", duration: 2000 });
    } finally {
      setDeletingTileId(null);
      setTileToDelete(null);
    }
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingTiles(true);
    setSelectedDate(new Date());
    setSelectedTime({ hours: new Date().getHours(), minutes: new Date().getMinutes() });
    setOccurredAt(getLocalISOString());

    Api.get<Tile[]>("/api/tiles")
      .then(({ data }) => {
        if (cancelled) return;
        setTiles(data);
      })
      .catch(() => {
        if (cancelled) return;
        showToast("Unable to load categories right now. Try again.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingTiles(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSave = async () => {
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
      ...(occurredAt ? { occurredAt } : {}),
    };

    setLoading(true);
    try {
      const { data } = await Api.post("/api/expense/add", payload, {
        params: {
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        },
      });
      showTopToast(data?.message || "Expense added successfully", { duration: 2000 });

      setAmount("");
      setCategory("");
      setPaymentMode("");
      setNotes("");
      setSelectedDate(new Date());
      setSelectedTime({ hours: new Date().getHours(), minutes: new Date().getMinutes() });
      setOccurredAt(getLocalISOString());
      window.dispatchEvent(new CustomEvent("expense:added"));
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const message = axiosError?.response?.data?.message || "Failed to save expense. Please try again.";
      showTopToast(message, { tone: "error", duration: 2500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Dark Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          backdropFilter: "blur(12px)",
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
          maxWidth: "380px",
          padding: "0 16px",
        }}
      >
        {/* Main Card - Pure Black */}
        <div 
          className="relative overflow-hidden"
          style={{
            background: "#0a0a0a",
            borderRadius: "1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Header - Compact */}
          <div 
            className="relative px-5 py-4 flex items-center justify-between"
            style={{ 
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
              background: "#0a0a0a",
            }}
          >
            <h2 className="text-base font-semibold text-white">Add Expense</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Content - Compact */}
          <div 
            className="px-5 pb-5 space-y-4 max-h-[65vh] overflow-y-auto" 
            style={{ 
              paddingTop: "1rem",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255, 255, 255, 0.1) transparent",
              background: "#0a0a0a",
            }}
          >
            {/* Amount */}
            <div 
              className="p-4 transition-all duration-200"
              style={{
                background: amountFocused ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.03)",
                borderRadius: "1rem",
                border: amountFocused ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wide block mb-1.5">Amount</label>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-white/50">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  className="flex-1 text-2xl font-bold border-0 outline-none bg-transparent text-white placeholder-white/25"
                />
              </div>
            </div>

            {/* Category Grid - Compact */}
            <div>
              <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wide block mb-2.5">Category</label>
              {loadingTiles ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {tiles.map((tile) => {
                    const isSelected = category === tile.name;
                    const isDeleting = deletingTileId === tile._id;
                    return (
                      <button
                        key={tile._id}
                        onClick={() => setCategory(tile.name)}
                        className="group relative p-3 flex flex-col items-center gap-1.5 rounded-xl transition-all"
                        style={{
                          background: isSelected ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
                          border: isSelected ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.15)",
                          opacity: isDeleting ? 0.5 : 1,
                        }}
                        disabled={isDeleting}
                      >
                        {/* Delete button for user tiles - always visible on mobile, hover on desktop */}
                        {!tile.isBuiltIn && (
                          <button
                            onClick={(e) => handleDeleteTile(tile, e)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/90 flex items-center justify-center transition-opacity hover:bg-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                            title="Delete tile"
                          >
                            <Trash2 className="w-2.5 h-2.5 text-white" />
                          </button>
                        )}
                        <span className="text-sm">{tile.emoji || "✨"}</span>
                        <span className={`text-[8px] font-medium leading-tight ${isSelected ? 'text-white' : 'text-white/50'}`}>
                          {tile.name}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setAddTileOpen(true)}
                    className="p-3 flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-white/15 hover:border-white/25 transition-colors"
                  >
                    <span className="text-white/40 text-base">+</span>
                    <span className="text-[9px] text-white/40">Add</span>
                  </button>
                </div>
              )}
            </div>

            {/* Payment Mode - Compact */}
            <div>
              <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wide block mb-2.5">Payment</label>
              <div className="grid grid-cols-5 gap-1.5">
                {paymentModes.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setPaymentMode(mode.id)}
                      className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all"
                      style={{
                        background: isSelected ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
                        border: isSelected ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.15)",
                      }}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-white/50'}`} />
                      <span className={`text-[9px] font-medium ${isSelected ? 'text-white' : 'text-white/50'}`}>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time - Compact */}
            <div>
              <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wide block mb-2.5">When</label>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  className="flex-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs text-white/70 transition-colors bg-white/[0.03] border border-white/20 hover:bg-white/[0.06]"
                >
                  <Calendar className="w-4 h-4 text-white/50" />
                  {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </button>
                <button
                  type="button"
                  onClick={() => setTimePickerOpen(true)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs text-white/70 font-mono transition-colors bg-white/[0.03] border border-white/20 hover:bg-white/[0.06]"
                >
                  <Clock className="w-4 h-4 text-white/50" />
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

            {/* Notes - Compact */}
            <div>
              <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wide block mb-2.5">Notes</label>
              <textarea
                placeholder="Optional note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
                rows={2}
                className={`w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none text-white placeholder-white/30 bg-white/[0.03] border ${notesFocused ? 'border-white/30' : 'border-white/20'}`}
              />
            </div>

            {/* Buttons - Compact */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-xs font-medium text-white/70 rounded-xl transition-colors hover:bg-white/[0.06] bg-white/[0.03] border border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors bg-white text-black hover:bg-white/90"
              >
                {loading ? "..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Tile Modal */}
      <AddTileModal
        open={addTileOpen}
        onClose={() => setAddTileOpen(false)}
        onAdded={() => {
          // Refresh tiles after adding new one
          Api.get<Tile[]>("/api/tiles")
            .then(({ data }) => setTiles(data))
            .catch(() => {});
        }}
      />

      {/* Delete Confirmation Modal */}
      {tileToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-[240px] rounded-xl border border-white/20 p-4 text-center bg-black">
            <div
              className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: tileToDelete.color }}
            >
              <span className="text-lg">{tileToDelete.emoji || "✨"}</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Delete Tile?</h3>
            <p className="text-[11px] text-white/50 mb-4">
              Are you sure you want to delete <span className="text-white font-medium">"{tileToDelete.name}"</span>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setTileToDelete(null)}
                className="flex-1 py-2 text-[11px] font-medium text-white/60 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTile}
                disabled={deletingTileId !== null}
                className="flex-1 py-2 text-[11px] font-semibold text-white rounded-lg bg-red-500/90 hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {deletingTileId ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}