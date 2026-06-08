import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: null,
  students: [],
  transactions: [],
  loading: false,
  error: null
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    adminStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchStatsSuccess: (state, action) => {
      state.loading = false;
      state.stats = action.payload;
    },
    fetchStudentsSuccess: (state, action) => {
      state.loading = false;
      state.students = action.payload;
    },
    fetchTransactionsSuccess: (state, action) => {
      state.loading = false;
      state.transactions = action.payload;
    },
    adminFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

export const { 
  adminStart, 
  fetchStatsSuccess, 
  fetchStudentsSuccess, 
  fetchTransactionsSuccess, 
  adminFailure 
} = adminSlice.actions;

export default adminSlice.reducer;
