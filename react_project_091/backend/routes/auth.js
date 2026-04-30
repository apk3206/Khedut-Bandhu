const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const passport = require("passport");

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ username, email, phone, password });
    await user.save();

    res.status(201).json({ message: "User created successfully", user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Login with Google" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GOOGLE AUTH
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/farmerlogin.html" }),
  (req, res) => {
    res.redirect("/farmerlogin.html?success=google_login");
  }
);

// OTP STORAGE (Temporary, use Redis/DB for production)
const otps = new Map();

// SEND OTP
router.post("/send-otp", async (req, res) => {
    try {
        const { email, phone, type } = req.body;
        const target = type === "sms" ? phone : email;

        if (!target) return res.status(400).json({ message: "Target required" });

        // Cooldown check
        const lastSent = otps.get(target);
        if (lastSent && Date.now() - lastSent.timestamp < 60000) {
            return res.status(429).json({ message: "Wait 60s before resending" });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        otps.set(target, { otp, timestamp: Date.now() });

        console.log(`[OTP] Sent ${otp} to ${target} via ${type}`); // Simulated
        
        // In real app, call Twilio for SMS or Nodemailer for Email here
        
        res.json({ message: `OTP sent to ${type === 'sms' ? 'phone' : 'email'}`, expires: "5 mins" });
    } catch (err) {
        res.status(500).json({ message: "Failed to send OTP" });
    }
});

// VERIFY OTP & LOGIN/SIGNUP
router.post("/verify-otp", async (req, res) => {
    try {
        const { target, otp, role, username, email, phone } = req.body;
        const stored = otps.get(target);

        if (!stored || stored.otp !== otp) {
            return res.status(401).json({ message: "Invalid or expired OTP" });
        }

        if (Date.now() - stored.timestamp > 300000) {
            otps.delete(target);
            return res.status(401).json({ message: "OTP expired" });
        }

        otps.delete(target);

        // Find or create user
        let user = await User.findOne({ $or: [{ email: target }, { phone: target }, { phone }] });

        if (!user) {
            if (username && role) {
                user = new User({ username, email: email || "", phone: phone || target, role });
                await user.save();
            } else {
                return res.status(404).json({ message: "User not found. Please sign up." });
            }
        }

        res.json({
            message: "Verified successfully",
            user: { id: user._id, username: user.username, email: user.email, role: user.role, phone: user.phone }
        });
    } catch (err) {
        res.status(500).json({ message: "Verification failed" });
    }
});

module.exports = router;

