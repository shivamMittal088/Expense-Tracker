import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Calendar,
  Edit3,
  Camera,
  Loader2,
  Check,
  X,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Api from "../routeWrapper/Api";
import { showTopToast } from "../utils/Redirecttoast";
import { AxiosError } from "axios";

interface ProfileData {
  _id: string;
  name: string;
  emailId: string;
  photoURL?: string;
  statusMessage?: string;
  currency: "INR" | "USD" | "EUR";
  followersCount?: number;
  followingCount?: number;
  preferences?: {
    theme?: string;
    startWeekOnMonday?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface LoginHistoryItem {
  _id: string;
  ipAddress: string;
  browser: string;
  os: string;
  device: "Desktop" | "Mobile" | "Tablet" | "Unknown";
  loginAt: string;
  isSuccessful: boolean;
}

interface ApiErrorResponse {
  message?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get full photo URL
  const getFullPhotoURL = (photoURL?: string) => {
    if (!photoURL) return undefined;
    // If it's already a full URL, return as-is
    if (photoURL.startsWith("http://") || photoURL.startsWith("https://")) {
      return photoURL;
    }
    // Otherwise prepend the API base URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    return `${baseUrl}${photoURL}`;
  };

  useEffect(() => {
    // Fetch profile first (required)
    Api.get<ProfileData>("/api/profile/view")
      .then(({ data }) => {
        // Convert relative photoURL to full URL
        const profileWithFullPhotoURL = {
          ...data,
          photoURL: getFullPhotoURL(data.photoURL),
        };
        setProfile(profileWithFullPhotoURL);
        setNameValue(data.name);
        setStatusValue(data.statusMessage || "");
      })
      .catch(() => {
        showTopToast("Failed to load profile", { tone: "error" });
      })
      .finally(() => setLoading(false));

    // Fetch login history separately (optional, don't block profile)
    Api.get<LoginHistoryItem[]>("/api/profile/login-history")
      .then(({ data }) => {
        setLoginHistory(data);
      })
      .catch(() => {
        // Silently fail - login history is optional
      });
  }, []);

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      showTopToast("Name cannot be empty", { tone: "error" });
      return;
    }
    setSaving(true);
    try {
      await Api.patch("/api/profile/update", { name: nameValue.trim() });
      setProfile((prev) => prev ? { ...prev, name: nameValue.trim() } : null);
      setEditingName(false);
      showTopToast("Name updated", { duration: 1500 });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      showTopToast(axiosError?.response?.data?.message || "Failed to update", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      await Api.patch("/api/profile/update", { statusMessage: statusValue.trim() });
      setProfile((prev) => prev ? { ...prev, statusMessage: statusValue.trim() } : null);
      setEditingStatus(false);
      showTopToast("Status updated", { duration: 1500 });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      showTopToast(axiosError?.response?.data?.message || "Failed to update", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showTopToast("Image must be less than 5MB", { tone: "error" });
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showTopToast("Only JPEG, PNG, GIF, or WebP images are allowed", { tone: "error" });
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await Api.post("/api/profile/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Build full URL for the photo
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const fullPhotoURL = `${baseUrl}${res.data.photoURL}`;
      
      setProfile((prev) => prev ? { ...prev, photoURL: fullPhotoURL } : null);
      showTopToast("Photo updated!", { duration: 1500 });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      showTopToast(axiosError?.response?.data?.message || "Failed to upload photo", { tone: "error" });
    } finally {
      setUploadingPhoto(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatLoginTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "Mobile":
        return <Smartphone className="w-4 h-4" />;
      case "Tablet":
        return <Tablet className="w-4 h-4" />;
      case "Desktop":
        return <Monitor className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/50">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_-20%,#1f2937_0%,transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_90%_0%,#0f172a_0%,transparent_60%)]" />
        <div className="relative max-w-xl mx-auto px-4 py-8 pb-28">
        {/* Profile Header */}
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/10 bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-linear-to-br from-white/6 via-transparent to-white/3" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(16,185,129,0.08),transparent_40%)]" />
          <div className="relative p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0 self-center sm:self-auto">
              <div className="relative">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover border border-white/20 shadow-xl shadow-black"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/20 shadow-xl shadow-black">
                    <User className="w-7 h-7 text-white/30" />
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-all disabled:opacity-50 shadow-lg border-2 border-black"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>

            {/* Name & Status */}
            <div className="flex-1 min-w-0">
          {/* Name - Editable */}
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-base font-semibold text-white focus:border-white/40 focus:outline-none w-full"
                autoFocus
                maxLength={30}
              />
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setNameValue(profile.name);
                }}
                className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white truncate">{profile.name}</h1>
              <button
                onClick={() => setEditingName(true)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Status - Editable (Visible to others) */}
          {editingStatus ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-white/3 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:bg-white/5 focus:outline-none transition-all"
                  autoFocus
                  maxLength={50}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20">{statusValue.length}/50</span>
              </div>
              <button
                onClick={handleSaveStatus}
                disabled={saving}
                className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditingStatus(false);
                  setStatusValue(profile.statusMessage || "");
                }}
                className="p-2 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingStatus(true)}
              className="group flex items-center gap-2 mt-3 px-3 py-2 rounded-2xl bg-white/2 border border-white/15 hover:border-white/25 hover:bg-white/4 transition-all"
            >
              <span className="text-lg">💭</span>
              <span className={`text-sm ${profile.statusMessage ? "text-white/60" : "text-white/30 italic"}`}>
                {profile.statusMessage || "Share what's on your mind..."}
              </span>
              <Edit3 className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors ml-auto" />
            </button>
          )}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link
                  to="/profile/followers"
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 hover:bg-white/10 transition-colors"
                >
                  <p className="text-[11px] uppercase tracking-wide text-white/40">Followers</p>
                  <p className="text-lg font-semibold text-white">
                    {profile.followersCount ?? 0}
                  </p>
                </Link>
                <Link
                  to="/profile/following"
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 hover:bg-white/10 transition-colors"
                >
                  <p className="text-[11px] uppercase tracking-wide text-white/40">Following</p>
                  <p className="text-lg font-semibold text-white">
                    {profile.followingCount ?? 0}
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.2em] mb-3 px-1">
          Account Info
        </h2>
        <div className="rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden">
          {/* Email */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <Mail className="w-5 h-5 text-white/50" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/40 uppercase tracking-wide">Email</p>
              <p className="text-sm text-white">{profile.emailId}</p>
            </div>
          </div>

          <div className="h-px bg-white/5 mx-4" />

          {/* User ID */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <User className="w-5 h-5 text-white/50" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/40 uppercase tracking-wide">User ID</p>
              <p className="text-xs text-white/70 font-mono">{profile._id}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dates */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.2em] mb-3 px-1">
          Activity
        </h2>
        <div className="rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden">
          {/* Member Since */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <Calendar className="w-5 h-5 text-white/50" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/40 uppercase tracking-wide">Member Since</p>
              <p className="text-sm text-white">{formatDate(profile.createdAt)}</p>
            </div>
          </div>

          <div className="h-px bg-white/5 mx-4" />

          {/* Last Updated */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <Calendar className="w-5 h-5 text-white/50" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/40 uppercase tracking-wide">Last Updated</p>
              <p className="text-sm text-white">{formatDate(profile.updatedAt)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Login History */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.2em] mb-3 px-1">
          Login History
        </h2>
        <div className="rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden">
          {loginHistory.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/30 text-sm">
              No login history available
            </div>
          ) : (
            <>
              {(showAllHistory ? loginHistory : loginHistory.slice(0, 3)).map(
                (item, index) => (
                  <div key={item._id}>
                    {index > 0 && <div className="h-px bg-white/5 mx-4" />}
                    <div className="flex items-center gap-3 px-4 py-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 border border-white/10">
                        {getDeviceIcon(item.device)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white truncate">
                            {item.browser}
                          </p>
                          {index === 0 && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/30 truncate">
                          {item.os} • {item.ipAddress}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/40">
                          {formatLoginTime(item.loginAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
              {loginHistory.length > 3 && (
                <>
                  <div className="h-px bg-white/5" />
                  <button
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="w-full px-4 py-3 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
                  >
                    {showAllHistory ? (
                      <>
                        Show Less <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        Show {loginHistory.length - 3} More <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </section>
        </div>
      </div>
    </div>
  );
}
