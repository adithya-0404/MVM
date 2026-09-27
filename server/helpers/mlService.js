const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const mlService = {
  async analyzeSentiment(text) {
    const res = await axios.post(`${ML_SERVICE_URL}/sentiment`, { text });
    return res.data;
  },

  async analyzeSentimentBatch(reviews) {
    const res = await axios.post(`${ML_SERVICE_URL}/sentiment/batch`, { reviews });
    return res.data;
  },

  async getRecommendations(targetProductId, products, orderHistory = []) {
    const res = await axios.post(`${ML_SERVICE_URL}/recommendations`, {
      targetProductId,
      products,
      orderHistory,
    });
    return res.data;
  },

  async rankSearch(query, products) {
    const res = await axios.post(`${ML_SERVICE_URL}/search/rank`, { query, products });
    return res.data;
  },

  async detectFraud(orders) {
    const res = await axios.post(`${ML_SERVICE_URL}/fraud/detect`, { orders });
    return res.data;
  },

  async suggestPrice(priceData) {
    const res = await axios.post(`${ML_SERVICE_URL}/pricing/suggest`, priceData);
    return res.data;
  },

  async forecastDemand(productId, salesHistory) {
    const res = await axios.post(`${ML_SERVICE_URL}/demand/forecast`, {
      productId,
      salesHistory,
    });
    return res.data;
  },
};

module.exports = mlService;
