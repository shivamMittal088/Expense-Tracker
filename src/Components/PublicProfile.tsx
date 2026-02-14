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

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-lg mx-auto rounded-3xl border border-white/15 bg-[#0b0b0b] p-6 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {photo ? (
              <img src={photo} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-white/70">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-white truncate">{profile.name}</p>
            <p className="text-sm text-white/50 truncate">{profile.emailId}</p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            disabled
            className="w-full py-2.5 rounded-xl bg-white/10 text-white/60 text-sm font-medium cursor-not-allowed"
          >
            Follow
          </button>
          <p className="text-[11px] text-white/30 mt-2 text-center">Follow will be available soon</p>
        </div>
      </div>
    </div>
  );
}
