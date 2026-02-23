import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { clearUserProfile } from "./userSlice";

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

interface NotificationsState {
  requests: FollowRequest[];
  isLoaded: boolean;
  loading: boolean;
}

const initialState: NotificationsState = {
  requests: [],
  isLoaded: false,
  loading: false,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotificationsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setNotificationRequests: (state, action: PayloadAction<FollowRequest[]>) => {
      state.requests = action.payload;
      state.isLoaded = true;
      state.loading = false;
    },
    removeNotificationRequest: (state, action: PayloadAction<string>) => {
      state.requests = state.requests.filter((request) => request.id !== action.payload);
    },
    clearNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(clearUserProfile, () => initialState);
  },
});

export const {
  setNotificationsLoading,
  setNotificationRequests,
  removeNotificationRequest,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
