const { initiatePayment, verifyPayment } = require("../../helpers/phonepe");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const { v4: uuidv4 } = require("uuid");

const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
const serverUrl = (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");

const createOrder = async (req, res) => {
  try {
    const {
      userId, cartItems, addressInfo, orderStatus,
      paymentMethod, paymentStatus, totalAmount,
      orderDate, orderUpdateDate, cartId,
    } = req.body;

    if (process.env.NODE_ENV === "production" && (!process.env.CLIENT_URL || !process.env.SERVER_URL)) {
      throw new Error("CLIENT_URL and SERVER_URL are required in production");
    }

    const merchantTransactionId = uuidv4().replace(/-/g, "").substring(0, 38);

    const newlyCreatedOrder = new Order({
      userId, cartId, cartItems, addressInfo,
      orderStatus, paymentMethod: "phonepe",
      paymentStatus, totalAmount, orderDate, orderUpdateDate,
      paymentId: merchantTransactionId,
      payerId: "",
    });

    await newlyCreatedOrder.save();

    const phonePeResponse = await initiatePayment({
      amount: totalAmount,
      merchantTransactionId,
      userId,
      redirectUrl: `${serverUrl}/api/shop/order/phonepe-return?merchantTransactionId=${merchantTransactionId}&orderId=${newlyCreatedOrder._id}`,
      callbackUrl: `${serverUrl}/api/shop/order/phonepe-callback`,
    });

    if (phonePeResponse?.success) {
      const payUrl = phonePeResponse.data?.instrumentResponse?.redirectInfo?.url;
      return res.status(201).json({ success: true, payUrl, orderId: newlyCreatedOrder._id });
    }

    res.status(500).json({ success: false, message: "PhonePe initiation failed" });
  } catch (e) {
    console.error(e?.response?.data || e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

const phonePeReturn = async (req, res) => {
  try {
    const { merchantTransactionId, orderId } = req.query;

    const verifyRes = await verifyPayment(merchantTransactionId);

    if (verifyRes?.success && verifyRes?.data?.state === "COMPLETED") {
      let order = await Order.findById(orderId);
      if (!order) return res.redirect(`${clientUrl}/shop/payment-failed`);

      order.paymentStatus = "paid";
      order.orderStatus = "confirmed";

      for (let item of order.cartItems) {
        let product = await Product.findById(item.productId);
        if (product) {
          product.totalStock -= item.quantity;
          await product.save();
        }
      }

      await Cart.findByIdAndDelete(order.cartId);
      await order.save();

      return res.redirect(`${clientUrl}/shop/payment-success`);
    }

    res.redirect(`${clientUrl}/shop/payment-failed`);
  } catch (e) {
    console.error(e?.response?.data || e);
    res.redirect(`${clientUrl}/shop/payment-failed`);
  }
};

const phonePeCallback = async (req, res) => {
  res.status(200).json({ success: true });
};

const capturePayment = async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;
    let order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    await order.save();

    res.status(200).json({ success: true, message: "Order confirmed", data: order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId });
    if (!orders.length)
      return res.status(404).json({ success: false, message: "No orders found!" });
    res.status(200).json({ success: true, data: orders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found!" });
    res.status(200).json({ success: true, data: order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

module.exports = { createOrder, capturePayment, getAllOrdersByUser, getOrderDetails, phonePeReturn, phonePeCallback };
