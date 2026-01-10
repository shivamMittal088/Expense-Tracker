import { useState } from "react";
import AddCategoryModal from "./AddCategoryModal";

type Category = {
  id: string;
  label: string;
  emoji: string;
  amount: number;
};

const defaultCategories: Category[] = [
  { id: "food", label: "Food", emoji: "🍔", amount: 0 },
  { id: "transport", label: "Transport", emoji: "🚕", amount: 0 },
  { id: "groceries", label: "Groceries", emoji: "🛒", amount: 0 },
  { id: "entertainment", label: "Entertainment", emoji: "🎮", amount: 0 },
  { id: "bills", label: "Bills", emoji: "💡", amount: 0 },
  { id: "shopping", label: "Shopping", emoji: "🛍️", amount: 0 },
  { id: "travel", label: "Travel", emoji: "✈️", amount: 0 },
  { id: "health", label: "Health", emoji: "💊", amount: 0 },
  { id: "education", label: "Education", emoji: "📚", amount: 0 },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧", amount: 0 },
  { id: "pets", label: "Pets", emoji: "🐶", amount: 0 },
  { id: "other", label: "Other", emoji: "➕", amount: 0 },
];

const CategoryTiles: React.FC = () => {
  const [categories, setCategories] =
    useState<Category[]>(defaultCategories);
  const [openAdd, setOpenAdd] = useState(false);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="group rounded-2xl bg-[#111] border border-white/10 p-4
            flex flex-col items-center justify-center gap-2
            hover:border-blue-500/40 hover:bg-white/5 transition cursor-pointer"
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-full bg-white/10
              flex items-center justify-center text-xl
              group-hover:bg-blue-600 group-hover:text-white transition"
            >
              {cat.emoji}
            </div>

            {/* Label */}
            <span className="text-xs text-gray-400 group-hover:text-white transition">
              {cat.label}
            </span>

            {/* Amount */}
            <span className="text-sm font-semibold text-white">
              ₹{cat.amount}
            </span>
          </div>
        ))}

        {/* Add Category Tile */}
        <button
          onClick={() => setOpenAdd(true)}
          className="rounded-2xl border border-dashed border-white/20 p-4
          flex flex-col items-center justify-center gap-2
          text-gray-400 hover:border-blue-500 hover:text-blue-400 transition"
        >
          <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-xl">
            ➕
          </div>
          <span className="text-xs">Add Category</span>
        </button>
      </div>

      <AddCategoryModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onAdd={(newCategory) =>
          setCategories((prev) => [...prev, newCategory])
        }
      />
    </>
  );
};

export default CategoryTiles;
