import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../routeWrapper/Api";
import { showTopToast } from "../utils/Redirecttoast";

interface PublicProfileData {
  _id: string;
  name: string;
  emailId: string;
  photoURL?: string;
  statusMessage?: string;
  createdAt?: string;
  followersCount?: number;
  followingCount?: number;
}

const getFullPhotoURL = (photoURL?: string) => {
  if (!photoURL) return undefined;
  if (photoURL.startsWith("http")) return photoURL;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return `${baseUrl}${photoURL}`;
};

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<PublicProfileData | null | undefined>(undefined);
  const [followStatus, setFollowStatus] = useState<"none" | "pending" | "accepted">("none");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/profile/user/${id}`)
      .then((res) => {
        setProfile(res.data || null);
      })
      .catch(() => {
        showTopToast("Failed to load profile", { tone: "error" });
        setProfile(null);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/profile/follow-status/${id}`)
      .then((res) => {
        const status = res.data?.status || "none";
        if (status === "pending" || status === "accepted") {
          setFollowStatus(status);
        } else {
          setFollowStatus("none");
        }
      })
      .catch(() => {
        setFollowStatus("none");
      });
  }, [id]);

  if (profile === undefined) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/50 text-sm">Profile not found</div>
      </div>
    );
  }

  const photo = getFullPhotoURL(profile.photoURL);
  const initials = profile.name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  const handleFollow = async () => {
    if (!id || followStatus !== "none") return;
    setIsFollowing(true);
    try {
      const trimmed = note.trim();
      const res = await api.post(`/api/profile/follow/${id}`, {
        ...(trimmed ? { note: trimmed } : {}),
      });
      const status = res.data?.status || "pending";
      setFollowStatus(status === "accepted" ? "accepted" : "pending");
      setNote("");
    } catch {
      showTopToast("Failed to send follow request", { tone: "error" });
    } finally {
      setIsFollowing(false);
    }
  };

  const handleCancel = async () => {
    if (!id || followStatus !== "pending") return;
    setIsCancelling(true);
    try {
      await api.delete(`/api/profile/follow/${id}`);
      setFollowStatus("none");
    } catch {
      showTopToast("Failed to cancel request", { tone: "error" });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-md mx-auto rounded-3xl border border-white/15 bg-[#0b0b0b] p-5 shadow-2xl shadow-black/60">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {photo ? (
              <img src={photo} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-white/70">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-white truncate">{profile.name}</p>
            <p className="text-xs text-white/50 truncate">{profile.emailId}</p>
            {profile.statusMessage && (
              <div className="mt-2 inline-flex max-w-[260px] items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1">
                <span className="text-[11px]">💬</span>
                <span className="text-[11px] text-white/70 break-words">{profile.statusMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-white/40">Followers</p>
            <p className="text-lg font-semibold text-white">
              {profile.followersCount ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-white/40">Following</p>
            <p className="text-lg font-semibold text-white">
              {profile.followingCount ?? 0}
            </p>
          </div>
        </div>

        <div className="mt-4">
          {followStatus === "none" && (
            <div className="mb-3">
              <label className="text-[11px] text-white/40 uppercase tracking-[0.2em]">Send a note</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Add a short note (optional)"
                className="mt-2 w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <div className="mt-1 text-[10px] text-white/30 text-right">{note.length}/200</div>
            </div>
          )}
          <button
            type="button"
            onClick={followStatus === "pending" ? handleCancel : handleFollow}
            disabled={followStatus === "accepted" || isFollowing || isCancelling}
            className={`w-full py-2 rounded-xl text-xs font-medium transition-colors ${
              followStatus === "none"
                ? "bg-white text-black hover:bg-white/90"
                : followStatus === "pending"
                  ? "bg-white/10 text-white/70 hover:bg-white/15"
                  : "bg-white/10 text-white/60 cursor-not-allowed"
            }`}
          >
            {followStatus === "pending"
              ? isCancelling
                ? "Cancelling..."
                : "Cancel request"
              : followStatus === "accepted"
                ? "Following"
                : isFollowing
                  ? "Sending..."
                  : "Follow"}
          </button>
          {followStatus === "pending" && (
            <p className="text-[11px] text-white/30 mt-2 text-center">Request pending</p>
          )}
        </div>
      </div>
    </div>
  );
}
