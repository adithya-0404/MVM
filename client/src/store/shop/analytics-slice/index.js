import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  salesData: [],
  topProducts: [],
  lowStockAlerts: [],
  fraudAlerts: [],
};

export const fetchSalesAnalytics = createAsyncThunk(
  "analytics/fetchSales",
  async () => {
    const response = await axios.get("/api/shop/analytics/sales");
    return response.data;
  }
);

export const fetchTopProducts = createAsyncThunk(
  "analytics/fetchTopProducts",
  async () => {
    const response = await axios.get("/api/shop/analytics/top-products");
    return response.data;
  }
);

export const fetchLowStockAlerts = createAsyncThunk(
  "analytics/fetchLowStock",
  async () => {
    const response = await axios.get("/api/shop/analytics/low-stock");
    return response.data;
  }
);

export const fetchFraudAlerts = createAsyncThunk(
  "analytics/fetchFraud",
  async () => {
    const response = await axios.get("/api/shop/analytics/fraud");
    return response.data;
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesAnalytics.pending, (state) => { state.isLoading = true; })
      .addCase(fetchSalesAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.salesData = action.payload.data;
      })
      .addCase(fetchSalesAnalytics.rejected, (state) => { state.isLoading = false; })

      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.topProducts = action.payload.data;
      })
      .addCase(fetchLowStockAlerts.fulfilled, (state, action) => {
        state.lowStockAlerts = action.payload.data;
      })
      .addCase(fetchFraudAlerts.fulfilled, (state, action) => {
        state.fraudAlerts = action.payload.data;
      });
  },
});

export default analyticsSlice.reducer;
