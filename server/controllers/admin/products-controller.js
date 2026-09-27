const { imageUploadUtil } = require("../../helpers/cloudinary");
const Product = require("../../models/Product");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const handleImageUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image file.",
      });
    }

    const hasCloudinaryConfig = [
      process.env.CLOUDINARY_CLOUD_NAME,
      process.env.CLOUDINARY_API_KEY,
      process.env.CLOUDINARY_API_SECRET,
    ].every((value) => value && !value.startsWith("your_"));

    if (!hasCloudinaryConfig && process.env.NODE_ENV === "production") {
      return res.status(503).json({
        success: false,
        message: "Image uploads require Cloudinary configuration in production.",
      });
    }

    let imageUrl;
    if (hasCloudinaryConfig) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataUrl = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await imageUploadUtil(dataUrl);
      imageUrl = result.secure_url || result.url;
    } else {
      const uploadsDirectory = path.join(__dirname, "../../uploads");
      fs.mkdirSync(uploadsDirectory, { recursive: true });
      const extension = path.extname(req.file.originalname) || ".bin";
      const fileName = `${crypto.randomUUID()}${extension}`;
      fs.writeFileSync(path.join(uploadsDirectory, fileName), req.file.buffer);
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
    }

    res.json({
      success: true,
      result: {
        url: imageUrl,
      },
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Error occured",
    });
  }
};

//add a new product
const addProduct = async (req, res) => {
  try {
    const {
      image,
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      totalStock,
      averageReview,
    } = req.body;

    if (typeof image !== "string" || !image.trim()) {
      return res.status(400).json({
        success: false,
        message: "A product image URL is required.",
      });
    }

    const newlyCreatedProduct = new Product({
      image,
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      totalStock,
      averageReview,
    });

    await newlyCreatedProduct.save();
    res.status(201).json({
      success: true,
      data: newlyCreatedProduct,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

//fetch all products

const fetchAllProducts = async (req, res) => {
  try {
    const listOfProducts = await Product.find({});
    res.status(200).json({
      success: true,
      data: listOfProducts,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

//edit a product
const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      image,
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      totalStock,
      averageReview,
    } = req.body;

    let findProduct = await Product.findById(id);
    if (!findProduct)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    findProduct.title = title || findProduct.title;
    findProduct.description = description || findProduct.description;
    findProduct.category = category || findProduct.category;
    findProduct.brand = brand || findProduct.brand;
    findProduct.price = price === "" ? 0 : price || findProduct.price;
    findProduct.salePrice =
      salePrice === "" ? 0 : salePrice || findProduct.salePrice;
    findProduct.totalStock = totalStock || findProduct.totalStock;
    findProduct.image = image || findProduct.image;
    findProduct.averageReview = averageReview || findProduct.averageReview;

    await findProduct.save();
    res.status(200).json({
      success: true,
      data: findProduct,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

//delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    res.status(200).json({
      success: true,
      message: "Product delete successfully",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

module.exports = {
  handleImageUpload,
  addProduct,
  fetchAllProducts,
  editProduct,
  deleteProduct,
};
