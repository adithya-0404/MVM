const express = require("express");
const {
  getSalesAnalytics,
  getTopProducts,
  getLowStockAlerts,
  getFraudAlerts,
} = require("../../controllers/shop/analytics-controller");

const router = express.Router();

router.get("/sales", getSalesAnalytics);
router.get("/top-products", getTopProducts);
router.get("/low-stock", getLowStockAlerts);
router.get("/fraud", getFraudAlerts);

module.exports = router;
