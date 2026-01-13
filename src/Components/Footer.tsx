import type { FC } from "react";
import { NavLink } from "react-router-dom";
import { Home, BarChart3, User, Settings, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "./Api";
import axios from "axios";

/* -------------------- Types -------------------- */
type Tile = {
  _id: string;
  name: string;
  color: string;
};

/* -------------------- Component -------------------- */
const Footer: FC = () => {
  const [showModal, setShowModal] = useState(false);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loadingTiles, setLoadingTiles] = useState(true);

  const paymentModes = ["cash", "card", "wallet", "bank_transfer", "UPI"];

  const linkBase =
    "flex flex-col items-center gap-1 text-xs transition-colors";

  /* -------------------- Load tiles -------------------- */
  useEffect(() => {
    const loadTiles = async () => {
      try {
        const res = await api.get("/api/tiles");
        setTiles(res.data);
      } catch (err) {
        console.error("Failed to load tiles", err);
      } finally {
        setLoadingTiles(false);
      }
    };
    loadTiles();
  }, []);

  /* -------------------- Save expense -------------------- */
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
      notes: notes || "",
      currency: "INR",
    };

    console.log("Sending payload →", payload);

    try {
      setLoading(true);
      await api.post("/api/expense/add", payload);

      setAmount("");
      setCategory("");
      setPaymentMode("");
      setNotes("");
      setShowModal(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("API ERROR", err.response?.data || err.message);
        alert(err.response?.data?.message || "Failed to add expense");
      } else {
        console.error("Unknown error", err);
        alert("Failed to add expense");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Footer */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700">
        <div className="relative max-w-md mx-auto h-16 flex items-center justify-center">
          <div className="flex items-center gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${linkBase} ${isActive ? "text-white" : "text-gray-400"}`
              }
            >
              <Home size={18} />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? "text-white" : "text-gray-400"}`
              }
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </NavLink>

            {/* Add */}
            <button
              onClick={() => setShowModal(true)}
              className="-mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg border-4 border-gray-900"
            >
              <Plus size={28} />
            </button>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? "text-white" : "text-gray-400"}`
              }
            >
              <User size={18} />
              <span>Profile</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? "text-white" : "text-gray-400"}`
              }
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${
          showModal
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setShowModal(false)}
      />

      {/* Modal */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-4 transition-transform duration-300 ${
          showModal ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add Expense</h2>
          <button onClick={() => setShowModal(false)}>
            <X />
          </button>
        </div>

        <input
          type="number"
          placeholder="₹ 0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full text-3xl font-bold border-b mb-6 outline-none"
        />

        {/* Categories */}
        <p className="text-sm mb-2">Category</p>
        {loadingTiles ? (
          <p className="text-gray-400 text-sm">Loading categories...</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {tiles.map((tile) => (
              <button
                key={tile._id}
                onClick={() => setCategory(tile.name)}
                className="p-2 rounded-lg border text-sm"
                style={{
                  backgroundColor:
                    category === tile.name ? tile.color : "#f3f4f6",
                  color: category === tile.name ? "white" : "#111",
                }}
              >
                {tile.name}
              </button>
            ))}
          </div>
        )}

        {/* Payment mode */}
        <p className="text-sm mb-2">Payment Mode</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {paymentModes.map((m) => (
            <button
              key={m}
              onClick={() => setPaymentMode(m)}
              className={`px-4 py-2 rounded-lg border ${
                paymentMode === m
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded-lg p-2 mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(false)}
            className="w-1/2 border rounded-lg py-3"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-1/2 bg-blue-600 text-white rounded-lg py-3 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Footer;
