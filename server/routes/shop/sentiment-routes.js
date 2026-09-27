const express = require("express");
const { getReviewSentiment } = require("../../controllers/shop/sentiment-controller");

const router = express.Router();

router.post("/analyze", getReviewSentiment);

module.exports = router;
