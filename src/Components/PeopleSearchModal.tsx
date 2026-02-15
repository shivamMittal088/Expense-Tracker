import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, X } from "lucide-react";
import api from "../routeWrapper/Api";

type UserResult = {
  _id: string;
  name: string;
  emailId?: string;
  photoURL?: string;
  statusMessage?: string;
};

interface PeopleSearchModalProps {
  open: boolean;
  onClose: () => void;
}

const getFullPhotoURL = (photoURL?: string) => {
  if (!photoURL) return undefined;
  if (photoURL.startsWith("http")) {
    return photoURL;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return `${baseUrl}${photoURL}`;
};

const accentFontStyle = {
  fontFamily: '"Arial Narrow", "Helvetica Neue Condensed", "Roboto Condensed", "Noto Sans", sans-serif',
};

export default function PeopleSearchModal({ open, onClose }: PeopleSearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [recentResults, setRecentResults] = useState<UserResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) return;

    api.get("/api/profile/search-users", {
        params: { q: trimmed, limit: 10 },
      })
      .then((res) => {
        setResults(res.data?.results || []);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Unable to search right now");
      })
      .finally(() => setSearching(false));
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    if (query.trim()) return;
    api.get("/api/profile/recent-searches")
      .then((res) => {
        const recent = (res.data?.recent || [])
          .map((entry: { user?: UserResult | null }) => entry.user)
          .filter(Boolean) as UserResult[];
        setRecentResults(recent);
      })
      .catch(() => {
        setRecentResults([]);
      });
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleUserSelect = async (userId: string) => {
    try {
      await api.post("/api/profile/recent-searches", { userId });
    } catch {
      // ignore recent-search errors
    }
    onClose();
    navigate(`/profile/${userId}`);
  };

  const handleRemoveRecent = async (userId: string) => {
    try {
      await api.delete(`/api/profile/recent-searches/${userId}`);
      setRecentResults((prev) => (prev ? prev.filter((u) => u._id !== userId) : prev));
    } catch {
      // ignore recent-search errors
    }
  };

  const handleClearRecent = async () => {
    try {
      await api.delete("/api/profile/recent-searches");
      setRecentResults([]);
    } catch {
      // ignore recent-search errors
    }
  };

  const hasNoResults = !searching && query.trim() && results.length === 0;

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-start justify-center bg-black/60 py-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[#111111] border border-white/30 shadow-2xl shadow-black/70 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative">
          <div className="px-4 pt-4 pb-3">
            <div className="mb-2">
              <div className="group relative">
                <div className="relative flex items-center gap-2 px-3.5 py-2 rounded-3xl bg-black/70 border border-white/15 group-focus-within:border-sky-500 shadow-inner shadow-black/80 transition-colors">
                  <div className="w-5 h-5 rounded-lg bg-white/5 text-white/70 flex items-center justify-center transition-colors group-focus-within:text-white">
                    <Search size={12} />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    style={accentFontStyle}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setQuery(nextValue);
                      const trimmed = nextValue.trim();
                      if (!trimmed) {
                        setResults([]);
                        setSearching(false);
                        setError(null);
                        return;
                      }
                      setSearching(true);
                      setError(null);
                    }}
                    placeholder="Search users..."
                    className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 focus:outline-none"
                  />
                  {searching && <Loader2 size={14} className="animate-spin text-sky-400" />}
                </div>
              </div>
              {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            </div>

            {query.trim() ? (
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/30 mb-2">
                  Results
                </p>
                <div className="space-y-2 max-h-70 overflow-y-auto pr-1">
                  {results.map((user, index) => (
                    <button
                      key={user._id}
                      onClick={() => handleUserSelect(user._id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition"
                    >
                      <AvatarCircle user={user} index={index} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-white/40 truncate">
                          {user.statusMessage || user.emailId || "No status yet"}
                        </p>
                      </div>
                      <span className="text-[11px] text-white/30">Tap to view</span>
                    </button>
                  ))}

                  {hasNoResults && (
                    <div className="text-center py-10 text-white/50 text-sm">
                      No users match “{query.trim()}”.
                    </div>
                  )}
                </div>
              </div>
            ) : recentResults === null ? (
              <div className="text-center py-10 text-white/40 text-xs">Loading recent...</div>
            ) : recentResults.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[7px] uppercase tracking-[0.35em] text-white/30">
                    Recent
                  </p>
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    style={accentFontStyle}
                    className="text-[7px] uppercase tracking-[0.25em] text-white/60 hover:text-white/90 transition cursor-pointer font-semibold border border-white/15 hover:border-white/30 rounded-[999px] px-2 py-0.5"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                  {recentResults.map((user, index) => (
                    <button
                      key={user._id}
                      onClick={() => handleUserSelect(user._id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition"
                    >
                      <AvatarCircle user={user} index={index} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-white/40 truncate">
                          {user.statusMessage || user.emailId || "No status yet"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRemoveRecent(user._id);
                        }}
                        aria-label={`Remove ${user.name} from recent searches`}
                        className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/85 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X size={10} className="stroke-[2.5]" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-white/40 text-sm">
                Start typing to search for people.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AvatarCircle({
  user,
  index,
  size = "md",
}: {
  user: UserResult;
  index: number;
  size?: "sm" | "md";
}) {
  const photo = getFullPhotoURL(user.photoURL);
  const palette = ["#f97316", "#a855f7", "#22d3ee", "#facc15", "#fb7185"];
  const ringColor = palette[index % palette.length];
  const dimension = size === "sm" ? 34 : 44;
  const fontSize = size === "sm" ? "11px" : "13px";
  const initials = user.name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  return (
    <div className="relative">
      <div
        className="rounded-full flex items-center justify-center font-semibold text-white"
        style={{
          width: `${dimension}px`,
          height: `${dimension}px`,
          fontSize,
          border: `2px solid ${ringColor}`,
          background: photo ? "transparent" : `${ringColor}20`,
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
    </div>
  );
}
