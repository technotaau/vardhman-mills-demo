import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Loyalty Program Slice
 * Manages user loyalty points, rewards, and program status
 */

export interface LoyaltyState {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewards: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LoyaltyState = {
  points: 0,
  tier: 'bronze',
  rewards: [],
  isLoading: false,
  error: null,
};

export const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    setPoints: (state, action: PayloadAction<number>) => {
      state.points = action.payload;
    },
    addPoints: (state, action: PayloadAction<number>) => {
      state.points += action.payload;
    },
    setTier: (state, action: PayloadAction<LoyaltyState['tier']>) => {
      state.tier = action.payload;
    },
    setRewards: (state, action: PayloadAction<any[]>) => {
      state.rewards = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetLoyalty: () => initialState,
  },
});

export const {
  setPoints,
  addPoints,
  setTier,
  setRewards,
  setLoading,
  setError,
  resetLoyalty,
} = loyaltySlice.actions;

export default loyaltySlice.reducer;
