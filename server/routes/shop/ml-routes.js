const express = require("express");
const {
  analyzeSentiment,
  getRecommendations,
  mlSearch,
  detectFraud,
  suggestPrice,
  forecastDemand,
} = require("../../controllers/shop/ml-controller");

const router = express.Router();

router.post("/sentiment", analyzeSentiment);
router.get("/recommendations/:productId", getRecommendations);
router.get("/search", mlSearch);
router.get("/fraud", detectFraud);
router.get("/pricing/:productId", suggestPrice);
router.get("/forecast/:productId", forecastDemand);

module.exports = router;
