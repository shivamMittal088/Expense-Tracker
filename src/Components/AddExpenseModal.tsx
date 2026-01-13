import { X, Wallet, CreditCard, Smartphone, Building2, Banknote,Utensils, Car, ShoppingBag, FileText, Sparkle, Heart } from "lucide-react";
import { useEffect, useState } from "react";

type Tile = {
  _id: string;
  name: string;
  color: string;
  icon: any;
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
  const [loading, setLoading] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  useEffect(() => {
    if (!open) return;

    setTimeout(() => {
      setTiles([
        { _id: "1", name: "Food", color: "#ef4444", icon: Utensils },
        { _id: "2", name: "Transport", color: "#3b82f6", icon: Car },
        { _id: "3", name: "Shopping", color: "#8b5cf6", icon: ShoppingBag },
        { _id: "4", name: "Bills", color: "#f59e0b", icon: FileText },
        { _id: "5", name: "Entertainment", color: "#ec4899", icon: Sparkle },
        { _id: "6", name: "Health", color: "#10b981", icon: Heart },
      ]);
      setLoadingTiles(false);
    }, 300);
  }, [open]);

  const handleSave = async () => {
    if (!amount || !category || !paymentMode) {
      alert("Please fill amount, category and payment mode");
      return;
    }

    const selectedTile = tiles.find((t) => t.name === category);

    const payload = {
      amount: Number(amount),
      category: {
        name: selectedTile?.name || category,
        color: selectedTile?.color || "#CCCCCC",
      },
      payment_mode:
        paymentMode === "UPI" ? "UPI" : paymentMode.toLowerCase(),
      notes,
      currency: "INR",
    };

    setLoading(true);
    setTimeout(() => {
      console.log("Expense added:", payload);
      setAmount("");
      setCategory("");
      setPaymentMode("");
      setNotes("");
      setLoading(false);
      onClose();
    }, 500);
  };

  return (
    <>
      {/* Dark Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-700 ${
          open ? "opacity-93 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background: open 
            ? "rgba(0, 0, 0, 0.85)" 
            : "transparent",
          backdropFilter: "blur(16px)",
        }}
        onClick={onClose}
      />

      {/* Floating Card Modal */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-full ${
          open 
            ? "-translate-y-1/2 opacity-100 scale-100" 
            : "-translate-y-full opacity-0 scale-95"
        }`}
        style={{
          maxWidth: "380px",
          padding: "0 16px",
        }}
      >
        {/* Main Card */}
        <div 
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(to bottom, #0a0a0a, #000000)",
            borderRadius: "1.75rem",
            boxShadow: `
              0 50px 100px rgba(0, 0, 0, 0.9),
              0 0 0 1px rgba(255, 255, 255, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.06)
            `,
          }}
        >
          {/* Header */}
          <div className="relative px-5 py-2.5 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
            <button
              onClick={onClose}
              className="absolute top-2 right-4 p-1 rounded-lg transition-all duration-300 hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 transition-colors" />
            </button>

            <h2 className="text-xs font-semibold text-gray-400 tracking-tight">Add Expense</h2>
          </div>

          {/* Content */}
          <div 
            className="px-5 pb-5 space-y-4 max-h-[65vh] overflow-y-auto" 
            style={{ 
              paddingTop: "1rem",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255, 255, 255, 0.2) transparent"
            }}
          >
            <style>{`
              .px-5::-webkit-scrollbar {
                width: 6px;
              }
              .px-5::-webkit-scrollbar-track {
                background: transparent;
              }
              .px-5::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
              }
              .px-5::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
              }
            `}</style>
            {/* Amount Card */}
            <div 
              className="relative p-2 transition-all duration-300"
              style={{
                background: amountFocused 
                  ? "rgba(255, 255, 255, 0.05)" 
                  : "rgba(255, 255, 255, 0.03)",
                borderRadius: "0.75rem",
                border: amountFocused 
                  ? "1px solid rgba(255, 255, 255, 0.12)" 
                  : "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: amountFocused
                  ? "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                  : "0 2px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              <label className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                Amount
              </label>
              
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-white select-none">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  className="flex-1 text-sm font-black border-0 outline-none bg-transparent text-white placeholder-gray-800 tracking-tight"
                />
              </div>
              
              {amount && (
                <div className="mt-0.5 text-[9px] text-gray-600 font-medium">
                  {new Intl.NumberFormat('en-IN', { 
                    style: 'currency', 
                    currency: 'INR',
                    maximumFractionDigits: 2 
                  }).format(Number(amount))}
                </div>
              )}
            </div>

            {/* Category Grid */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
                Category
              </label>
              
              {loadingTiles ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {tiles.map((tile) => {
                    const Icon = tile.icon;
                    const isSelected = category === tile.name;
                    return (
                      <button
                        key={tile._id}
                        onClick={() => setCategory(tile.name)}
                        className="relative transition-all duration-300 hover:scale-[1.03]"
                        style={{
                          transform: isSelected ? "scale(1.03)" : "scale(1)",
                        }}
                      >
                        <div
                          className="p-2.5 flex flex-col items-center gap-2 transition-all duration-300"
                          style={{
                            background: isSelected
                              ? "rgba(255, 255, 255, 0.09)"
                              : "rgba(255, 255, 255, 0.02)",
                            borderRadius: "0.875rem",
                            border: isSelected 
                              ? "1px solid rgba(255, 255, 255, 0.18)" 
                              : "1px solid rgba(255, 255, 255, 0.05)",
                            minHeight: "68px",
                            boxShadow: isSelected
                              ? "0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                              : "0 2px 8px rgba(0, 0, 0, 0.2)",
                          }}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                            style={{
                              background: isSelected 
                                ? "rgba(255, 255, 255, 0.1)" 
                                : "rgba(255, 255, 255, 0.05)",
                              boxShadow: isSelected 
                                ? "inset 0 1px 2px rgba(255, 255, 255, 0.1)" 
                                : "none",
                            }}
                          >
                            <Icon className={`w-4 h-4 transition-colors ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <span className={`text-[10px] font-semibold transition-colors leading-tight ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                            {tile.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  
                  {/* Add Category Button */}
                  <button
                    onClick={() => alert("Add new category feature coming soon!")}
                    className="relative transition-all duration-300 hover:scale-[1.03]"
                  >
                    <div
                      className="p-2.5 flex flex-col items-center gap-2 transition-all duration-300"
                      style={{
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "0.875rem",
                        border: "1px dashed rgba(255, 255, 255, 0.15)",
                        minHeight: "68px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                      }}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500 leading-tight">
                        Add New
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Payment Mode Grid */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
                Payment Mode
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {paymentModes.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setPaymentMode(mode.id)}
                      className="relative transition-all duration-300 hover:scale-[1.03]"
                      style={{
                        transform: isSelected ? "scale(1.03)" : "scale(1)",
                      }}
                    >
                      <div
                        className="p-2.5 flex flex-col items-center gap-2 transition-all duration-300"
                        style={{
                          background: isSelected
                            ? "rgba(255, 255, 255, 0.09)"
                            : "rgba(255, 255, 255, 0.02)",
                          borderRadius: "0.875rem",
                          border: isSelected 
                            ? "1px solid rgba(255, 255, 255, 0.18)" 
                            : "1px solid rgba(255, 255, 255, 0.05)",
                          minHeight: "68px",
                          boxShadow: isSelected
                            ? "0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                            : "0 2px 8px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                          style={{
                            background: isSelected 
                              ? "rgba(255, 255, 255, 0.1)" 
                              : "rgba(255, 255, 255, 0.05)",
                            boxShadow: isSelected 
                              ? "inset 0 1px 2px rgba(255, 255, 255, 0.1)" 
                              : "none",
                          }}
                        >
                          <Icon className={`w-4 h-4 transition-colors ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <span className={`text-[10px] font-semibold transition-colors leading-tight ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                          {mode.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes Textarea */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
                Notes <span className="text-gray-600 font-normal normal-case">(optional)</span>
              </label>
              
              <textarea
                placeholder="Add details about this expense..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
                rows={2}
                className="w-full p-1.5 rounded-xl text-xs outline-none transition-all resize-none text-white placeholder-gray-700 font-medium"
                style={{
                  background: notesFocused 
                    ? "rgba(255, 255, 255, 0.05)" 
                    : "rgba(255, 255, 255, 0.03)",
                  border: notesFocused 
                    ? "1px solid rgba(255, 255, 255, 0.12)" 
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  boxShadow: notesFocused
                    ? "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                    : "none",
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-medium transition-all duration-300 hover:bg-white/5 active:scale-95"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "0.875rem",
                  color: "#9ca3af",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:opacity-95 active:scale-95"
                style={{
                  background: "linear-gradient(to bottom, #ffffff, #f3f3f3)",
                  borderRadius: "0.875rem",
                  boxShadow: "0 2px 8px rgba(255, 255, 255, 0.1)",
                }}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}