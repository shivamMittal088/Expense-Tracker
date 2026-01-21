import { useState } from "react";
import AddCategoryModal, { type Category } from "./AddCategoryModal";

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

const CategoryTiles = () => {
  const [categories, setCategories] =
    useState<Category[]>(defaultCategories);
  const [openAdd, setOpenAdd] = useState(false);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="group rounded-2xl bg-[#0a0a0a] border border-white/20 p-4
            flex flex-col items-center justify-center gap-2
            hover:border-blue-500 hover:bg-white/5 transition cursor-pointer"
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-full bg-white/5
              flex items-center justify-center text-xl
              group-hover:bg-blue-500 group-hover:text-white transition"
            >
              {cat.emoji}
            </div>

            {/* Label */}
            <span className="text-xs text-white/50 group-hover:text-white transition">
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
          text-white/50 hover:border-blue-500 hover:text-blue-500 transition"
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
        onAdd={(newCategory: Category) =>
          setCategories((prev) => [...prev, newCategory])
        }
      />
    </>
  );
};

export default CategoryTiles;
