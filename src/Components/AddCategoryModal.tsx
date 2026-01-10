import { useState } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (category: {
    id: string;
    label: string;
    emoji: string;
    amount: number;
  }) => void;
};

const AddCategoryModal: React.FC<Props> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("✨");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="w-[340px] rounded-2xl bg-black p-5 text-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">
            Add Category
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1 block">
            Category Name
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Coffee"
            className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Emoji */}
        <div className="mb-6">
          <label className="text-xs text-gray-400 mb-1 block">
            Emoji
          </label>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Action */}
        <button
          onClick={() => {
            if (!label.trim()) return;
            onAdd({
              id: crypto.randomUUID(),
              label,
              emoji,
              amount: 0,
            });
            setLabel("");
            setEmoji("✨");
            onClose();
          }}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium hover:bg-blue-700 transition"
        >
          Add Category
        </button>
      </div>
    </div>
  );
};

export default AddCategoryModal;
