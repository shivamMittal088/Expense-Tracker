import { useEffect } from "react";
import { Check, X, UserPlus } from "lucide-react";

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
  count: number;
  requests: FollowRequest[];
  loading: boolean;
}

export type FollowRequest = {
  id: string;
  follower: {
    _id: string;
    name: string;
    emailId?: string;
    photoURL?: string;
    statusMessage?: string;
  } | null;
  note?: string;
  createdAt?: string;
};

const formatTimeAgo = (value?: string) => {
  if (!value) return "";
  const created = new Date(value).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - created);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function NotificationsModal({ open, onClose, count, requests, loading }: NotificationsModalProps) {
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-start justify-center bg-black/70 backdrop-blur-sm px-2 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[#0b0b0b] border border-white/20 shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <UserPlus size={14} className="text-white/70" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white">Follow Requests</p>
                  {count > 0 && (
                    <span className="min-w-4.5 h-4.5 rounded-full bg-white text-black text-[10px] font-semibold flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/40">Notifications</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] text-white/40 hover:text-white/70"
            >
              Close
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-white/40 text-xs">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10 text-white/40 text-xs">
              No requests right now.
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/70">
                      {request.follower?.name
                        .split(" ")
                        .map((part) => part.charAt(0).toUpperCase())
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-white truncate">
                          {request.follower?.name || "Unknown"}
                        </p>
                        <span className="text-[10px] text-white/40">{formatTimeAgo(request.createdAt)}</span>
                      </div>
                      {request.note && (
                        <p className="mt-1 text-[10px] text-white/60">"{request.note}"</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[10px] text-emerald-300 cursor-not-allowed"
                    >
                      <Check size={11} />
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[10px] text-white/70 cursor-not-allowed"
                    >
                      <X size={11} />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
