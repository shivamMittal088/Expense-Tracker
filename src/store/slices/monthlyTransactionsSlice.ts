import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { clearUserProfile } from "./userSlice";

export type MonthlyTransaction = {
  _id: string;
  amount: number;
  category: {
    name: string;
    color: string;
    emoji?: string;
  };
  notes?: string;
  occurredAt: string;
  payment_mode: string;
  isHidden?: boolean;
};

interface MonthlyTransactionsState {
  items: MonthlyTransaction[];
  isLoaded: boolean;
  loading: boolean;
  nextCursor: string | null;
  loadingMore: boolean;
}

const initialState: MonthlyTransactionsState = {
  items: [],
  isLoaded: false,
  loading: false,
  nextCursor: null,
  loadingMore: false,
};

export const isWithinLast30Days = (dateValue: string) => {
  const occurredAt = new Date(dateValue).getTime();
  if (Number.isNaN(occurredAt)) return false;

  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  return occurredAt >= thirtyDaysAgo && occurredAt <= now;
};

const sortByOccurredAtDesc = (items: MonthlyTransaction[]) => {
  items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
};

const monthlyTransactionsSlice = createSlice({
  name: "monthlyTransactions",
  initialState,
  reducers: {
    setMonthlyTransactionsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setMonthlyTransactions: (state, action: PayloadAction<{ data: MonthlyTransaction[]; nextCursor: string | null }>) => {
      state.items = action.payload.data.filter((item) => item.isHidden !== true);
      sortByOccurredAtDesc(state.items);
      state.nextCursor = action.payload.nextCursor;
      state.isLoaded = true;
      state.loading = false;
    },
    appendMonthlyTransactions: (state, action: PayloadAction<{ data: MonthlyTransaction[]; nextCursor: string | null }>) => {
      const newItems = action.payload.data.filter(
        (item) => item.isHidden !== true && !state.items.some((e) => e._id === item._id)
      );
      state.items.push(...newItems);
      sortByOccurredAtDesc(state.items);
      state.nextCursor = action.payload.nextCursor;
      state.loadingMore = false;
    },
    setLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.loadingMore = action.payload;
    },
    addMonthlyTransaction: (state, action: PayloadAction<MonthlyTransaction>) => {
      if (!isWithinLast30Days(action.payload.occurredAt)) return;
      const existing = state.items.find((item) => item._id === action.payload._id);
      if (existing) return;
      state.items.unshift(action.payload);
      sortByOccurredAtDesc(state.items);
    },
    clearMonthlyTransactions: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(clearUserProfile, () => initialState);
  },
});

export const {
  setMonthlyTransactionsLoading,
  setMonthlyTransactions,
  appendMonthlyTransactions,
  setLoadingMore,
  addMonthlyTransaction,
  clearMonthlyTransactions,
} = monthlyTransactionsSlice.actions;

export default monthlyTransactionsSlice.reducer;
