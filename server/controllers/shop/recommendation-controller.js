const Order = require("../../models/Order");
const Product = require("../../models/Product");

const getRecommendations = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find all orders containing this product
    const orders = await Order.find({ "cartItems.productId": productId });

    // Count how often other products appear alongside this one
    const scoreMap = {};
    for (const order of orders) {
      for (const item of order.cartItems) {
        if (item.productId !== productId) {
          scoreMap[item.productId] = (scoreMap[item.productId] || 0) + 1;
        }
      }
    }

    const topIds = Object.entries(scoreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id]) => id);

    if (topIds.length === 0) {
      // Fallback: same-category products
      const current = await Product.findById(productId);
      if (!current) return res.status(200).json({ success: true, data: [] });

      const fallback = await Product.find({
        category: current.category,
        _id: { $ne: productId },
      }).limit(4);

      return res.status(200).json({ success: true, data: fallback });
    }

    const recommended = await Product.find({ _id: { $in: topIds } });
    res.status(200).json({ success: true, data: recommended });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

module.exports = { getRecommendations };
