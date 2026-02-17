import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import Api from "../routeWrapper/Api";
import { showTopToast } from "../utils/Redirecttoast";

type FollowListMode = "followers" | "following";

interface ConnectionUser {
  _id: string;
  name: string;
  emailId: string;
  photoURL?: string;
}

interface FollowItem {
  id: string;
  createdAt: string;
  follower?: ConnectionUser | null;
  following?: ConnectionUser | null;
}

interface FollowListResponse {
  followers?: FollowItem[];
  following?: FollowItem[];
  nextCursor?: string | null;
}

interface FollowListPageProps {
  mode: FollowListMode;
}

const getFullPhotoURL = (photoURL?: string) => {
  if (!photoURL) return undefined;
  if (photoURL.startsWith("http://") || photoURL.startsWith("https://")) {
    return photoURL;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  return `${baseUrl}${photoURL}`;
};

export default function FollowListPage({ mode }: FollowListPageProps) {
  const [items, setItems] = useState<FollowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unfollowId, setUnfollowId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);

  const title = mode === "followers" ? "Followers" : "Following";
  const endpoint = mode === "followers" ? "/api/profile/all-followers" : "/api/profile/all-following";

  const emptyCopy = useMemo(() => {
    if (mode === "followers") return "No followers yet";
    return "Follow people for more engagement";
  }, [mode]);

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      if (append) {
        setLoadingMore(true);
      } else {
        queueMicrotask(() => setLoading(true));
      }

      try {
        const params: Record<string, string | number> = { limit: 20 };
        if (cursor) {
          params.cursor = cursor;
        }

        const { data } = await Api.get<FollowListResponse>(endpoint, { params });
        const list = mode === "followers" ? data.followers || [] : data.following || [];

        setItems((prev) => (append ? [...prev, ...list] : list));
        setNextCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.nextCursor) && list.length > 0);
      } catch {
        showTopToast("Failed to load list", { tone: "error" });
        if (!append) {
          setItems([]);
        }
        setHasMore(false);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [endpoint, mode]
  );

  const handleUnfollow = useCallback(async (userId: string) => {
    if (unfollowId) return;
    setUnfollowId(userId);
    try {
      await Api.delete(`/api/profile/follow/${userId}`);
      setItems((prev) => prev.filter((item) => item.following?._id !== userId));
    } catch {
      showTopToast("Failed to unfollow", { tone: "error" });
    } finally {
      setUnfollowId(null);
    }
  }, [unfollowId]);

  const handleSeedFollowers = useCallback(async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      await Api.post("/api/seed/followers");
      showTopToast("Seeded 200 followers", { tone: "success" });
      setItems([]);
      setNextCursor(null);
      setHasMore(true);
      fetchPage(null, false);
    } catch {
      showTopToast("Failed to seed followers", { tone: "error" });
    } finally {
      setIsSeeding(false);
    }
  }, [fetchPage, isSeeding]);

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    fetchPage(null, false);
  }, [fetchPage]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || !nextCursor) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          fetchPage(nextCursor, true);
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPage, hasMore, loading, loadingMore, nextCursor]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-8 pt-6 pb-2">
        <div className="relative flex items-center">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Users className="w-4 h-4 text-white/60" />
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          </div>
          {mode === "followers" && (
            <div className="ml-auto">
              <button
                type="button"
                onClick={handleSeedFollowers}
                disabled={isSeeding}
                className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
              >
                {isSeeding ? "Seeding..." : "Seed 200"}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pb-28 pt-2">

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/2 p-6 text-center text-sm text-white/50">
            {emptyCopy}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const user = mode === "followers" ? item.follower : item.following;
              if (!user) return null;
              const photo = getFullPhotoURL(user.photoURL);
              const initials = user.name
                .split(" ")
                .map((part) => part.charAt(0).toUpperCase())
                .slice(0, 2)
                .join("") || "U";

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0b0b0b] px-3 py-2 hover:border-white/20 transition-colors"
                >
                  <Link to={`/profile/${user._id}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      {photo ? (
                        <img src={photo} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px] font-semibold text-white/70">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-white/50 truncate">{user.emailId}</p>
                    </div>
                  </Link>
                  {mode === "following" && (
                    <button
                      type="button"
                      onClick={() => handleUnfollow(user._id)}
                      disabled={unfollowId === user._id}
                      className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                    >
                      {unfollowId === user._id ? "Removing..." : "Unfollow"}
                    </button>
                  )}
                </div>
              );
            })}
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-6">
                {loadingMore && <Loader2 className="w-5 h-5 text-white/40 animate-spin" />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
