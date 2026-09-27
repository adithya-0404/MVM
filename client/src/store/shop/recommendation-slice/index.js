import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  recommendations: [],
};

export const fetchRecommendations = createAsyncThunk(
  "recommendations/fetch",
  async (productId) => {
    const response = await axios.get(
      `/api/shop/ml/recommendations/${productId}`
    );
    return response.data;
  }
);

const recommendationSlice = createSlice({
  name: "recommendations",
  initialState,
  reducers: {
    clearRecommendations: (state) => {
      state.recommendations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recommendations = action.payload.data;
      })
      .addCase(fetchRecommendations.rejected, (state) => {
        state.isLoading = false;
        state.recommendations = [];
      });
  },
});

export const { clearRecommendations } = recommendationSlice.actions;
export default recommendationSlice.reducer;
