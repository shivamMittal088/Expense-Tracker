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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
      <div className="w-full max-w-[250px] rounded-xl border border-white/10 bg-[#1a1a1a] text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <h2 className="text-sm font-semibold">New Tile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-3 pb-3 space-y-3 max-h-[65vh] overflow-y-auto">
          {/* Preview + Name Row */}
          <div className="flex gap-2">
            {/* Live Preview Tile */}
            <div
              className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              <span className="text-sm">{selectedEmoji}</span>
              <span className="text-[7px] font-medium text-white/90 truncate max-w-full px-0.5">
                {name || "Name"}
              </span>
            </div>

            {/* Name Input */}
            <div className="flex-1">
              <label className="block text-[9px] font-medium text-gray-500 uppercase mb-0.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                placeholder="Enter name..."
                maxLength={20}
                className="w-full rounded-md bg-[#2a2a2a] border border-white/10 px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                autoFocus
              />
              <div className="text-right text-[8px] text-gray-500 mt-0.5">{name.length}/20</div>
            </div>
          </div>

          {/* Icon Section */}
          <div>
            <label className="block text-[9px] font-medium text-gray-500 uppercase mb-1">Icon</label>
            
            {/* Category Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide mb-2">
              {categoryKeys.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveEmojiCategory(cat)}
                  className={`px-2 py-1 rounded-full text-[9px] font-medium whitespace-nowrap transition-colors ${
                    activeEmojiCategory === cat
                      ? "bg-white text-black"
                      : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"
                  }`}
                >
                  {cat.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-8 gap-0.5 p-2 rounded-lg bg-[#2a2a2a] max-h-24 overflow-y-auto">
              {currentEmojis.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`p-1 text-sm rounded hover:bg-white/10 transition-colors ${
                    selectedEmoji === emoji ? "bg-white/20" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Section */}
          <div>
            <label className="block text-[9px] font-medium text-gray-500 uppercase mb-1">Color</label>
            
            {/* Color Grid */}
            <div className="grid grid-cols-10 gap-1">
              {colorPalette.slice(0, 20).map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setSelectedColor(color.hex)}
                  className={`w-4 h-4 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${
                    selectedColor === color.hex ? "ring-1.5 ring-white ring-offset-1 ring-offset-[#1a1a1a]" : ""
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedColor === color.hex && <Check size={8} className="text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-medium text-gray-300 rounded-lg bg-[#2a2a2a] hover:bg-[#333] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 py-2 text-xs font-semibold text-black rounded-lg bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}