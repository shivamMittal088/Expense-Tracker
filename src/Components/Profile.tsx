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
  followersCount?: number;
  followingCount?: number;
  createdAt: string;
  updatedAt: string;
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
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
      const fullPhotoURL = getFullPhotoURL(res.data.photoURL);
      
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
      <div className="max-w-xl mx-auto px-4 py-8 pb-28">
        {/* Profile Header */}
        <div className="rounded-3xl overflow-hidden mb-6 border border-zinc-800 bg-zinc-950">
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0 self-center sm:self-auto">
              <div className="relative">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover border border-zinc-700 cursor-pointer"
                    onClick={() => setIsPhotoOpen(true)}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700">
                    <User className="w-7 h-7 text-zinc-500" />
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
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50 border-2 border-black"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-black" />
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
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-base font-semibold text-white focus:border-zinc-500 focus:outline-none w-full"
                autoFocus
                maxLength={30}
              />
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setNameValue(profile.name);
                }}
                className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white truncate">{profile.name}</h1>
              <button
                onClick={() => setEditingName(true)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none transition-colors"
                  autoFocus
                  maxLength={50}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">{statusValue.length}/50</span>
              </div>
              <button
                onClick={handleSaveStatus}
                disabled={saving}
                className="p-2 rounded-xl bg-zinc-100 text-black hover:bg-zinc-200 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditingStatus(false);
                  setStatusValue(profile.statusMessage || "");
                }}
                className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingStatus(true)}
              className="group flex items-center gap-2 mt-3 px-3 py-2 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
            >
              <span className="text-lg">💭</span>
              <span className={`text-sm ${profile.statusMessage ? "text-zinc-300" : "text-zinc-500 italic"}`}>
                {profile.statusMessage || "Share what's on your mind..."}
              </span>
              <Edit3 className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors ml-auto" />
            </button>
          )}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link
                  to="/profile/followers"
                  className="rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 hover:bg-zinc-800 transition-colors"
                >
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Followers</p>
                  <p className="text-lg font-semibold text-white">
                    {profile.followersCount ?? 0}
                  </p>
                </Link>
                <Link
                  to="/profile/following"
                  className="rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 hover:bg-zinc-800 transition-colors"
                >
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Following</p>
                  <p className="text-lg font-semibold text-white">
                    {profile.followingCount ?? 0}
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPhotoOpen && profile.photoURL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button
            type="button"
            onClick={() => setIsPhotoOpen(false)}
            className="absolute top-4 right-4 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 hover:text-white"
          >
            Close
          </button>
          <img
            src={profile.photoURL}
            alt={profile.name}
            className="max-h-[80vh] max-w-[90vw] rounded-2xl border border-zinc-700"
            onClick={() => setIsPhotoOpen(false)}
          />
        </div>
      )}

      {/* Profile Details */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-3 px-1">
          Account Info
        </h2>
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
          {/* Email */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-700">
              <Mail className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Email</p>
              <p className="text-sm text-white">{profile.emailId}</p>
            </div>
          </div>

          <div className="h-px bg-zinc-800 mx-4" />

          {/* User ID */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-700">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">User ID</p>
              <p className="text-xs text-zinc-300 font-mono">{profile._id}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dates */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-3 px-1">
          Activity
        </h2>
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
          {/* Member Since */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-700">
              <Calendar className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Member Since</p>
              <p className="text-sm text-white">{formatDate(profile.createdAt)}</p>
            </div>
          </div>

          <div className="h-px bg-zinc-800 mx-4" />

          {/* Last Updated */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-700">
              <Calendar className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Last Updated</p>
              <p className="text-sm text-white">{formatDate(profile.updatedAt)}</p>
            </div>
          </div>
        </div>
      </section>

        </div>
    </div>
  );
}
