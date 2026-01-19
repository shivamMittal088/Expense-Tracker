import { useState, type FormEvent } from "react";

export type Category = {
  id: string;
  label: string;
  emoji: string;
  amount: number;
};

type AddCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (category: Category) => void;
};

const AddCategoryModal = ({ open, onClose, onAdd }: AddCategoryModalProps) => {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("➕");
  const [amount, setAmount] = useState("0");

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmed = label.trim();
    if (!trimmed) return;

    const parsedAmount = Number(amount);
    const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

    const newCategory: Category = {
      id: `${trimmed.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      label: trimmed,
      emoji: emoji || "➕",
      amount: safeAmount,
    };

    onAdd(newCategory);
    setLabel("");
    setEmoji("➕");
    setAmount("0");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="w-[90%] max-w-md rounded-2xl border border-theme-border bg-theme-bg-card p-5 text-theme-text-primary"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Category</h2>
          <button type="button" onClick={onClose} className="text-theme-text-muted hover:text-theme-text-primary">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Category name"
            className="w-full rounded-lg bg-theme-bg-tertiary border border-theme-border p-3 text-sm text-theme-text-primary placeholder-theme-text-muted"
          />

          <div className="flex gap-3">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Emoji"
              className="w-24 rounded-lg bg-theme-bg-tertiary border border-theme-border p-3 text-sm text-center text-theme-text-primary"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 rounded-lg bg-theme-bg-tertiary border border-theme-border p-3 text-sm text-theme-text-primary placeholder-theme-text-muted"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-theme-text-secondary hover:text-theme-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-medium text-white hover:bg-theme-accent-hover"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategoryModal;
