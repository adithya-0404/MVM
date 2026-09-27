import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  fraudData: null,
  pricingData: null,
  forecastData: null,
  isLoading: false,
};

export const fetchFraudAlerts = createAsyncThunk("ml/fetchFraud", async () => {
  const res = await axios.get("/api/shop/ml/fraud");
  return res.data;
});

export const fetchPricingSuggestion = createAsyncThunk("ml/fetchPricing", async (productId) => {
  const res = await axios.get(`/api/shop/ml/pricing/${productId}`);
  return res.data;
});

export const fetchDemandForecast = createAsyncThunk("ml/fetchForecast", async (productId) => {
  const res = await axios.get(`/api/shop/ml/forecast/${productId}`);
  return res.data;
});

const mlSlice = createSlice({
  name: "adminMl",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFraudAlerts.pending, (state) => { state.isLoading = true; })
      .addCase(fetchFraudAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fraudData = action.payload.data;
      })
      .addCase(fetchFraudAlerts.rejected, (state) => { state.isLoading = false; })
      .addCase(fetchPricingSuggestion.fulfilled, (state, action) => {
        state.pricingData = action.payload.data;
      })
      .addCase(fetchDemandForecast.fulfilled, (state, action) => {
        state.forecastData = action.payload.data;
      });
  },
});

export default mlSlice.reducer;
