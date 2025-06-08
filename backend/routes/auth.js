const express = require("express");
const router = express.Router();
const User = require("../models/User");
const OtpModel = require("../models/Otp");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const nodemailer = require("nodemailer");

// Email credentials from environment or fallback
const EMAIL_USER = process.env.EMAIL_USER || 'vizagconnect.notification@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'napheydtyjzlpfwd';

// Allowed roles and units
const allowedRoles = ['Principal', 'City Office'];
const allowedUnits = ['VIIT', 'VIEW', 'VIPT', 'WoS', 'VSCPS', 'City Office'];

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Verify transporter
transporter.verify((err) => {
  if (err) {
    console.error("❌ Email transporter verification failed:", err.message);
  } else {
    console.log("✅ Email transporter ready.");
  }
});

// =======================================
// POST /register - User Registration
// =======================================
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      mobile,
      role,
      unit,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || !mobile || !role || !unit) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    if (!validator.isMobilePhone(mobile, "any")) {
      return res.status(400).json({ success: false, message: "Invalid mobile number" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (!validator.isStrongPassword(password, { minLength: 6 })) {
      return res.status(400).json({ success: false, message: "Password is too weak" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role selected" });
    }

    if (!allowedUnits.includes(unit)) {
      return res.status(400).json({ success: false, message: "Invalid unit selected" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      mobile,
      password: hashedPassword,
      role,
      unit,
      isVerified: false,
    });
    await newUser.save();

    // Create OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpModel.create({ userId: newUser._id, otp, expiresAt });

    // Send OTP email
    await transporter.sendMail({
      from: `"TaskBridge" <${EMAIL_USER}>`,
      to: newUser.email,
      subject: "Your TaskBridge Registration OTP",
      text: `Hi ${newUser.firstName},\n\nYour registration OTP is: ${otp}\nIt will expire in 5 minutes.\n\nRegards,\ TaskBridge Team`
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully. OTP sent to your email.",
      userId: newUser._id,
    });

  } catch (err) {
    console.error("❌ Register error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =======================================
// POST /login - User Login
// =======================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please verify your email."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpModel.create({ userId: user._id, otp, expiresAt });

    await transporter.sendMail({
      from: `"TaskBridge" <${EMAIL_USER}>`,
      to: user.email,
      subject: "Your TaskBridge Login OTP",
      text: `Hi ${user.firstName},\n\nYour login OTP is: ${otp}\nIt will expire in 5 minutes.\n\nRegards,\TaskBridge Team`
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to registered email.",
      userId: user._id
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =======================================
// POST /verify-otp - OTP Verification
// =======================================
router.post("/verify-otp", async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: "User ID and OTP are required" });
    }

    const otpRecord = await OtpModel.findOne({ userId, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Delete OTP
    await OtpModel.deleteOne({ _id: otpRecord._id });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified, login successful",
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      lastLogin: user.lastLogin,
    });

  } catch (err) {
    console.error("❌ OTP verification error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =======================================
// POST /resend-otp - Resend OTP
// =======================================
router.post("/resend-otp", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await OtpModel.deleteMany({ userId });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpModel.create({ userId, otp, expiresAt });

    await transporter.sendMail({
      from: `"TaskBridge" <${EMAIL_USER}>`,
      to: user.email,
      subject: "Your TaskBridge OTP",
      text: `Hi ${user.firstName},\n\nYour OTP is: ${otp}\nIt will expire in 5 minutes.\n\nRegards,\TaskBridge Team`
    });

    return res.status(200).json({ success: true, message: "OTP resent successfully." });

  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =======================================
// POST /logout - User Logout
// =======================================
router.post("/logout", (req, res) => {
  // If token-based auth, token can be cleared on client side
  return res.status(200).json({ success: true, message: "Logged out successfully" });
});

// =======================================
// GET /:id - Get User Info by ID
// =======================================
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });

  } catch (err) {
    console.error("❌ Error fetching user by ID:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
