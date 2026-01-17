import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Fetch profile first (required)
    Api.get<ProfileData>("/api/profile/view")
      .then(({ data }) => {
        setProfile(data);
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-gray-400 py-10">
        Failed to load profile
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        {/* Avatar */}
        <div className="relative mb-4">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-white/10"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {getInitials(profile.name)}
            </div>
          )}
          <button
            onClick={() => showTopToast("Photo upload coming soon", { tone: "info" })}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2 border-[#0a0a0a] hover:bg-blue-600 transition-colors"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Name - Editable */}
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="bg-[#1a1a1a] border border-white/20 rounded-lg px-3 py-1.5 text-lg font-semibold text-white text-center focus:border-blue-500 focus:outline-none"
              autoFocus
              maxLength={30}
            />
            <button
              onClick={handleSaveName}
              disabled={saving}
              className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditingName(false);
                setNameValue(profile.name);
              }}
              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{profile.name}</h1>
            <button
              onClick={() => setEditingName(true)}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status - Editable */}
        {editingStatus ? (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              placeholder="Set a status..."
              className="bg-[#1a1a1a] border border-white/20 rounded-lg px-3 py-1 text-sm text-gray-300 text-center focus:border-blue-500 focus:outline-none"
              autoFocus
              maxLength={50}
            />
            <button
              onClick={handleSaveStatus}
              disabled={saving}
              className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditingStatus(false);
                setStatusValue(profile.statusMessage || "");
              }}
              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingStatus(true)}
            className="flex items-center gap-1 mt-1 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            {profile.statusMessage || "Add a status..."}
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Profile Details */}
      <section className="mb-6">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
          Account Info
        </h2>
        <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden">
          {/* Email */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Mail className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase">Email</p>
              <p className="text-sm text-white">{profile.emailId}</p>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* User ID */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase">User ID</p>
              <p className="text-sm text-white font-mono text-[11px]">{profile._id}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dates */}
      <section className="mb-6">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
          Activity
        </h2>
        <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden">
          {/* Member Since */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase">Member Since</p>
              <p className="text-sm text-white">{formatDate(profile.createdAt)}</p>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Last Updated */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase">Last Updated</p>
              <p className="text-sm text-white">{formatDate(profile.updatedAt)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Preview */}
      <section className="mb-6">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
          Quick Stats
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-[#111] p-4 text-center">
            <p className="text-2xl font-bold text-white">-</p>
            <p className="text-[10px] text-gray-500 uppercase mt-1">Total Expenses</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111] p-4 text-center">
            <p className="text-2xl font-bold text-white">-</p>
            <p className="text-[10px] text-gray-500 uppercase mt-1">This Month</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111] p-4 text-center">
            <p className="text-2xl font-bold text-white">{profile.currency}</p>
            <p className="text-[10px] text-gray-500 uppercase mt-1">Currency</p>
          </div>
        </div>
      </section>

      {/* Login History */}
      <section className="mb-6">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
          Login History
        </h2>
        <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden">
          {loginHistory.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              No login history available
            </div>
          ) : (
            <>
              {(showAllHistory ? loginHistory : loginHistory.slice(0, 3)).map(
                (item, index) => (
                  <div key={item._id}>
                    {index > 0 && <div className="h-px bg-white/5" />}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                        {getDeviceIcon(item.device)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white truncate">
                            {item.browser}
                          </p>
                          {index === 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">
                          {item.os} • {item.ipAddress}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
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
                    className="w-full px-4 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
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
  );
}
