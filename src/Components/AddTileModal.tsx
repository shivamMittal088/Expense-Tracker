import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import Api from "../routeWrapper/Api";
import { showTopToast } from "../utils/Redirecttoast";
import { emojiCategories, type EmojiCategoryName } from "../utils/EmojiCategories";
import { colorPalette } from "../utils/ColorPalette";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
};

export default function AddTileModal({ open, onClose, onAdded }: Props) {
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("✨");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<EmojiCategoryName>("Food & Drink");
  const [loading, setLoading] = useState(false);

  const panelStyle = {
    background: "rgba(15, 15, 15, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(10px)",
  } as const;

  useEffect(() => {
    if (!open) {
      setName("");
      setSelectedEmoji("✨");
      setSelectedColor("#3b82f6");
      setActiveEmojiCategory("Food & Drink");
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      showTopToast("Please enter a category name", { tone: "error" });
      return;
    }

    setLoading(true);
    try {
      await Api.post("/api/tiles/add", {
        name: name.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
      });
      showTopToast("Category added successfully!", { duration: 2000 });
      onAdded?.();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to add category";
      showTopToast(message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const currentEmojis = emojiCategories[activeEmojiCategory] || [];
  const categoryKeys = Object.keys(emojiCategories) as EmojiCategoryName[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div
        className="w-full max-w-[330px] rounded-2xl text-white shadow-2xl overflow-hidden"
        style={{
          background: "rgba(10, 10, 10, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(14px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/15">
          <h2 className="text-sm font-semibold">New Tile</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="p-3 rounded-xl" style={panelStyle}>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-2">Preview</label>
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                style={{ backgroundColor: selectedColor, boxShadow: "0 8px 20px rgba(0, 0, 0, 0.35)" }}
              >
                <span className="text-base">{selectedEmoji}</span>
                <span className="text-[9px] font-medium text-white/90 truncate max-w-full px-1">
                  {name || "Name"}
                </span>
              </div>
              <div className="flex-1">
                <label className="block text-[9px] font-semibold text-white/50 uppercase tracking-wide mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 20))}
                  placeholder="Enter name..."
                  maxLength={20}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-2.5 py-2 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none"
                  autoFocus
                />
                <div className="text-right text-[10px] text-white/40 mt-1">{name.length}/20</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl" style={panelStyle}>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-2">Icon</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
              {categoryKeys.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveEmojiCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                    activeEmojiCategory === cat
                      ? "bg-white text-black"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {cat.split(" ")[0]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-8 gap-1.5 p-2.5 rounded-xl bg-black/40 border border-white/20 max-h-36 overflow-y-auto">
              {currentEmojis.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`p-2 text-base rounded-lg hover:bg-white/10 transition-colors ${
                    selectedEmoji === emoji ? "bg-white/20 ring-1 ring-white/30" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl" style={panelStyle}>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-2">Color</label>
            <div className="grid grid-cols-9 gap-2">
              {colorPalette.slice(0, 27).map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setSelectedColor(color.hex)}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${
                    selectedColor === color.hex ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]" : ""
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedColor === color.hex && <Check size={10} className="text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex gap-2 border-t border-white/15">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-[11px] font-medium text-white/70 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 py-2 text-[11px] font-semibold rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}