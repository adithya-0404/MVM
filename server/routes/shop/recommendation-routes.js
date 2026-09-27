const express = require("express");
const { getRecommendations } = require("../../controllers/shop/recommendation-controller");

const router = express.Router();

router.get("/:productId", getRecommendations);

module.exports = router;
