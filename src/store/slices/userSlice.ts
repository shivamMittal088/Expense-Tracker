import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  _id: string;
  name: string;
  emailId: string;
  photoURL?: string;
  statusMessage?: string;
  isPublic?: boolean;
  followersCount?: number;
  followingCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface UserState {
  isAuthenticated: boolean;
  profile: UserProfile | null;
}

const USER_PROFILE_KEY = "userProfile";

const getStoredProfile = (): UserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    localStorage.removeItem(USER_PROFILE_KEY);
    return null;
  }
};

const storedProfile = getStoredProfile();
const hasStoredSession = localStorage.getItem("isLoggedIn") === "true";

const initialState: UserState = {
  isAuthenticated: hasStoredSession && !!storedProfile,
  profile: hasStoredSession ? storedProfile : null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("isPublic", String(action.payload.isPublic ?? true));
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(action.payload));
    },
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (!state.profile) return;
      state.profile = { ...state.profile, ...action.payload };
      if (typeof action.payload.isPublic === "boolean") {
        localStorage.setItem("isPublic", String(action.payload.isPublic));
      }
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(state.profile));
    },
    setUserPrivacy: (state, action: PayloadAction<boolean>) => {
      if (!state.profile) return;
      state.profile.isPublic = action.payload;
      localStorage.setItem("isPublic", String(action.payload));
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(state.profile));
    },
    clearUserProfile: (state) => {
      state.profile = null;
      state.isAuthenticated = false;
      localStorage.removeItem(USER_PROFILE_KEY);
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("authToken");
      localStorage.removeItem("isPublic");
    },
  },
});

export const { setUserProfile, updateUserProfile, setUserPrivacy, clearUserProfile } = userSlice.actions;
export default userSlice.reducer;
