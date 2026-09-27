const Product = require("../../models/Product");
const FuseModule = require("fuse.js");
const Fuse = FuseModule.default || FuseModule;

const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.params;
    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Keyword is required and must be in string format",
      });
    }

    const allProducts = await Product.find({});

    const fuse = new Fuse(allProducts, {
      keys: [
        { name: "title", weight: 0.5 },
        { name: "brand", weight: 0.3 },
        { name: "category", weight: 0.15 },
        { name: "description", weight: 0.05 },
      ],
      threshold: 0.4,
      includeScore: true,
    });

    const results = fuse.search(keyword).map((r) => r.item);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

module.exports = { searchProducts };
