const Order = require("../../models/Order");
const Product = require("../../models/Product");

// Sales analytics — revenue per day for last 7 days
const getSalesAnalytics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orders = await Order.find({
      orderDate: { $gte: sevenDaysAgo },
      orderStatus: { $ne: "rejected" },
    });

    const salesMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      salesMap[key] = { date: key, revenue: 0, orders: 0 };
    }

    for (const order of orders) {
      const key = new Date(order.orderDate).toISOString().split("T")[0];
      if (salesMap[key]) {
        salesMap[key].revenue += order.totalAmount;
        salesMap[key].orders += 1;
      }
    }

    res.status(200).json({ success: true, data: Object.values(salesMap) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// Top selling products by quantity sold
const getTopProducts = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: { $ne: "rejected" } });

    const productMap = {};
    for (const order of orders) {
      for (const item of order.cartItems) {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { title: item.title, image: item.image, totalSold: 0, revenue: 0 };
        }
        productMap[item.productId].totalSold += item.quantity;
        productMap[item.productId].revenue += item.quantity * parseFloat(item.price);
      }
    }

    const topProducts = Object.entries(productMap)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    res.status(200).json({ success: true, data: topProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// Low stock prediction — products likely to run out based on sales rate
const getLowStockAlerts = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orders = await Order.find({ orderDate: { $gte: sevenDaysAgo } });
    const products = await Product.find({});

    const soldMap = {};
    for (const order of orders) {
      for (const item of order.cartItems) {
        soldMap[item.productId] = (soldMap[item.productId] || 0) + item.quantity;
      }
    }

    const alerts = products
      .map((p) => {
        const soldLast7Days = soldMap[p._id.toString()] || 0;
        const dailyRate = soldLast7Days / 7;
        const daysUntilEmpty = dailyRate > 0 ? Math.floor(p.totalStock / dailyRate) : 999;
        return { productId: p._id, title: p.title, totalStock: p.totalStock, dailyRate: dailyRate.toFixed(2), daysUntilEmpty };
      })
      .filter((p) => p.daysUntilEmpty <= 14 || p.totalStock < 10)
      .sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);

    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// Fraud detection — flags suspicious orders
const getFraudAlerts = async (req, res) => {
  try {
    const orders = await Order.find({});

    const addressOrderCount = {};
    for (const order of orders) {
      const key = order.addressInfo?.address + order.addressInfo?.pincode;
      if (!addressOrderCount[key]) addressOrderCount[key] = [];
      addressOrderCount[key].push(order);
    }

    const suspicious = [];
    for (const order of orders) {
      const reasons = [];
      if (order.totalAmount > 5000) reasons.push("Unusually high order amount");
      const key = order.addressInfo?.address + order.addressInfo?.pincode;
      if (addressOrderCount[key]?.length > 5) reasons.push("Too many orders from same address");
      if (order.paymentMethod === "paypal" && order.totalAmount > 3000) reasons.push("High value PayPal order");
      if (reasons.length > 0) suspicious.push({ orderId: order._id, userId: order.userId, totalAmount: order.totalAmount, reasons });
    }

    res.status(200).json({ success: true, data: suspicious });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

module.exports = { getSalesAnalytics, getTopProducts, getLowStockAlerts, getFraudAlerts };
