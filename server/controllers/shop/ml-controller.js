const mlService = require("../../helpers/mlService");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Review = require("../../models/Review");

// 1. Sentiment analysis for a single review
const analyzeSentiment = async (req, res) => {
  try {
    const { text } = req.body;
    const result = await mlService.analyzeSentiment(text);
    res.status(200).json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "ML service error" });
  }
};

// 2. Recommendations for a product
const getRecommendations = async (req, res) => {
  try {
    const { productId } = req.params;
    const products = await Product.find({});
    const orders = await Order.find({});

    const productList = products.map((p) => ({
      productId: p._id.toString(),
      title: p.title,
      description: p.description || "",
      category: p.category || "",
    }));

    const orderHistory = orders.map((o) =>
      o.cartItems.map((item) => item.productId)
    );

    const result = await mlService.getRecommendations(productId, productList, orderHistory);
    res.status(200).json({ success: true, data: result.recommendations });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "ML service error" });
  }
};

// 3. ML-ranked search
const mlSearch = async (req, res) => {
  try {
    const { query } = req.query;
    const products = await Product.find({});

    const productList = products.map((p) => ({
      productId: p._id.toString(),
      title: p.title,
      description: p.description || "",
      category: p.category || "",
    }));

    const result = await mlService.rankSearch(query, productList);

    // Enrich with full product data
    const idMap = {};
    products.forEach((p) => (idMap[p._id.toString()] = p));
    const enriched = result.results.map((r) => idMap[r.productId]).filter(Boolean);

    res.status(200).json({ success: true, data: enriched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "ML service error" });
  }
};

// 4. Fraud detection
const detectFraud = async (req, res) => {
  try {
    const orders = await Order.find({});
    const orderData = orders.map((o) => ({
      orderId: o._id.toString(),
      userId: o.userId,
      totalAmount: o.totalAmount,
      itemCount: o.cartItems.length,
      address: o.addressInfo?.address || "",
    }));

    const result = await mlService.detectFraud(orderData);
    res.status(200).json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "ML service error" });
  }
};

// 5. Dynamic pricing suggestion
const suggestPrice = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const orders = await Order.find({ orderDate: { $gte: sevenDaysAgo } });

    let soldLast7Days = 0;
    for (const order of orders) {
      for (const item of order.cartItems) {
        if (item.productId === productId) soldLast7Days += item.quantity;
      }
    }

    const result = await mlService.suggestPrice({
      price: product.price,
      totalStock: product.totalStock,
      soldLast7Days,
      averageRating: product.averageReview || 4.0,
    });

    res.status(200).json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "ML service error" });
  }
};

// 6. Demand forecasting
const forecastDemand = async (req, res) => {
  try {
    const { productId } = req.params;

    const orders = await Order.find({ orderStatus: { $ne: "rejected" } }).sort({ orderDate: 1 });

    const salesMap = {};
    for (const order of orders) {
      for (const item of order.cartItems) {
        if (item.productId === productId) {
          const date = new Date(order.orderDate).toISOString().split("T")[0];
          salesMap[date] = (salesMap[date] || 0) + item.quantity;
        }
      }
    }

    const salesHistory = Object.entries(salesMap).map(([date, quantity]) => ({ date, quantity }));
    const result = await mlService.forecastDemand(productId, salesHistory);

    res.status(200).json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "ML service error" });
  }
};

module.exports = {
  analyzeSentiment,
  getRecommendations,
  mlSearch,
  detectFraud,
  suggestPrice,
  forecastDemand,
};
