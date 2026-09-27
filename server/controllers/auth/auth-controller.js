const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

const tokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

// register
const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;
  try {
    if (!userName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "User name, email, and password are required.",
      });
    }

    const checkUser = await User.findOne({ email });
    if (checkUser)
      return res.status(409).json({ success: false, message: "User already exists with the same email!" });

    const checkUserName = await User.findOne({ userName });
    if (checkUserName)
      return res.status(409).json({ success: false, message: "User name is already taken. Please choose another one." });

    const hashPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      userName,
      email,
      password: hashPassword,
      isVerified: true,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      email,
      message: "Registration successful! You can now login.",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured" });
  }
};

// login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser)
      return res.status(404).json({ success: false, message: "User doesn't exist! Please register first." });

    const checkPasswordMatch = await bcrypt.compare(password, checkUser.password);
    if (!checkPasswordMatch)
      return res.status(401).json({ success: false, message: "Incorrect password! Please try again." });

    const token = jwt.sign(
      { id: checkUser._id, role: checkUser.role, email: checkUser.email, userName: checkUser.userName },
      process.env.JWT_SECRET,
      { expiresIn: "60m" }
    );

    res.cookie("token", token, tokenCookieOptions).json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser._id,
        userName: checkUser.userName,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured" });
  }
};

// logout
const logoutUser = (req, res) => {
  res
    .clearCookie("token", tokenCookieOptions)
    .json({ success: true, message: "Logged out successfully!" });
};

// auth middleware
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ success: false, message: "Unauthorised user!" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorised user!" });
  }
};

module.exports = { registerUser, loginUser, logoutUser, authMiddleware };
