import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../routeWrapper/Api";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todaySpent: number;
  todayUnderBudget: boolean;
  remainingToday: number;
}

interface BudgetState {
  dailyBudget: number;
  isEnabled: boolean;
  streak: StreakData | null;
  loading: boolean;
  error: string | null;
}

const initialState: BudgetState = {
  dailyBudget: 0,
  isEnabled: false,
  streak: null,
  loading: false,
  error: null,
};

// Async thunk to fetch budget and streak from API
export const fetchBudgetAndStreak = createAsyncThunk(
  "budget/fetchBudgetAndStreak",
  async (_, { rejectWithValue }) => {
    try {
      // Fetch profile to get dailyBudget
      const profileRes = await api.get("/api/profile/view");
      const dailyBudget = profileRes.data?.dailyBudget || 0;

      // If no daily budget set, return early
      if (dailyBudget <= 0) {
        return {
          dailyBudget: 0,
          isEnabled: false,
          streak: null,
        };
      }

      // Fetch streak data
      const streakRes = await api.get("/api/profile/streak");
      
      return {
        dailyBudget,
        isEnabled: true,
        streak: {
          currentStreak: streakRes.data.currentStreak || 0,
          longestStreak: streakRes.data.longestStreak || 0,
          todaySpent: streakRes.data.todaySpent || 0,
          todayUnderBudget: streakRes.data.todayUnderBudget || false,
          remainingToday: streakRes.data.remainingToday || 0,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch budget data";
      return rejectWithValue(message);
    }
  }
);

// Async thunk to update daily budget
export const updateDailyBudget = createAsyncThunk(
  "budget/updateDailyBudget",
  async (budget: number, { rejectWithValue }) => {
    try {
      await api.patch("/api/profile/update", { dailyBudget: budget });
      
      // If budget is set, fetch streak data
      if (budget > 0) {
        const streakRes = await api.get("/api/profile/streak");
        return {
          dailyBudget: budget,
          isEnabled: true,
          streak: {
            currentStreak: streakRes.data.currentStreak || 0,
            longestStreak: streakRes.data.longestStreak || 0,
            todaySpent: streakRes.data.todaySpent || 0,
            todayUnderBudget: streakRes.data.todayUnderBudget || false,
            remainingToday: streakRes.data.remainingToday || 0,
          },
        };
      }
      
      return {
        dailyBudget: 0,
        isEnabled: false,
        streak: null,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update budget";
      return rejectWithValue(message);
    }
  }
);

// Async thunk to refresh streak only (after adding expense)
export const refreshStreak = createAsyncThunk(
  "budget/refreshStreak",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { budget: BudgetState };
      
      // Only refresh if budget is enabled
      if (!state.budget.isEnabled || state.budget.dailyBudget <= 0) {
        return null;
      }

      const streakRes = await api.get("/api/profile/streak");
      return {
        currentStreak: streakRes.data.currentStreak || 0,
        longestStreak: streakRes.data.longestStreak || 0,
        todaySpent: streakRes.data.todaySpent || 0,
        todayUnderBudget: streakRes.data.todayUnderBudget || false,
        remainingToday: streakRes.data.remainingToday || 0,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to refresh streak";
      return rejectWithValue(message);
    }
  }
);

const budgetSlice = createSlice({
  name: "budget",
  initialState,
  reducers: {
    clearBudget: (state) => {
      state.dailyBudget = 0;
      state.isEnabled = false;
      state.streak = null;
    },
    setStreakData: (state, action: PayloadAction<StreakData>) => {
      state.streak = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBudgetAndStreak
      .addCase(fetchBudgetAndStreak.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgetAndStreak.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyBudget = action.payload.dailyBudget;
        state.isEnabled = action.payload.isEnabled;
        state.streak = action.payload.streak;
      })
      .addCase(fetchBudgetAndStreak.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateDailyBudget
      .addCase(updateDailyBudget.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDailyBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyBudget = action.payload.dailyBudget;
        state.isEnabled = action.payload.isEnabled;
        state.streak = action.payload.streak;
      })
      .addCase(updateDailyBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // refreshStreak
      .addCase(refreshStreak.fulfilled, (state, action) => {
        if (action.payload) {
          state.streak = action.payload;
        }
      });
  },
});

export const { clearBudget, setStreakData } = budgetSlice.actions;
export default budgetSlice.reducer;
