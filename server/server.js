const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const authRouter = require("./routes/auth/auth-routes");
const adminProductsRouter = require("./routes/admin/products-routes");
const adminOrderRouter = require("./routes/admin/order-routes");

const shopProductsRouter = require("./routes/shop/products-routes");
const shopCartRouter = require("./routes/shop/cart-routes");
const shopAddressRouter = require("./routes/shop/address-routes");
const shopOrderRouter = require("./routes/shop/order-routes");
const shopSearchRouter = require("./routes/shop/search-routes");
const shopReviewRouter = require("./routes/shop/review-routes");

const commonFeatureRouter = require("./routes/common/feature-routes");
const shopRecommendationRouter = require("./routes/shop/recommendation-routes");
const shopSentimentRouter = require("./routes/shop/sentiment-routes");
const shopAnalyticsRouter = require("./routes/shop/analytics-routes");
const shopMlRouter = require("./routes/shop/ml-routes");

const allowedOrigins = ["http://localhost:5173"];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(
    ...process.env.CLIENT_URL.split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean)
  );
}

//create a database connection -> u can also
//create a separate file for this and then import/use that file here

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log(error));

const app = express();
const PORT = process.env.PORT || 5000;
const clientDistPath = path.join(__dirname, "../client/dist");

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "database_unavailable",
  });
});
app.use("/api/auth", authRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrderRouter);

app.use("/api/shop/products", shopProductsRouter);
app.use("/api/shop/cart", shopCartRouter);
app.use("/api/shop/address", shopAddressRouter);
app.use("/api/shop/order", shopOrderRouter);
app.use("/api/shop/search", shopSearchRouter);
app.use("/api/shop/review", shopReviewRouter);

app.use("/api/common/feature", commonFeatureRouter);
app.use("/api/shop/recommendations", shopRecommendationRouter);
app.use("/api/shop/sentiment", shopSentimentRouter);
app.use("/api/shop/analytics", shopAnalyticsRouter);
app.use("/api/shop/ml", shopMlRouter);

app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/") && fs.existsSync(clientDistPath)) {
    return res.sendFile(path.join(clientDistPath, "index.html"));
  }
  next();
});

app.listen(PORT, () => console.log(`Server is now running on port ${PORT}`));
