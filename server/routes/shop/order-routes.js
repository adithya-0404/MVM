const express = require("express");
const {
  createOrder, capturePayment, getAllOrdersByUser,
  getOrderDetails, phonePeReturn, phonePeCallback,
} = require("../../controllers/shop/order-controller");

const router = express.Router();

router.post("/create", createOrder);
router.post("/capture", capturePayment);
router.get("/list/:userId", getAllOrdersByUser);
router.get("/details/:id", getOrderDetails);
router.get("/phonepe-return", phonePeReturn);
router.post("/phonepe-callback", phonePeCallback);

module.exports = router;
