const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const nodemailer = require("nodemailer");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const sendEmail = require("./services/emailService"); // Import email service


const User = require("./models/User");
const Otp = require("./models/otp");
const adminRoutes = require("./routes/adminRoutes");
const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

const apiRoutes = require("./routes/apiRoutes");

// ===== Session & Passport =====
app.use(session({
  secret: process.env.SESSION_SECRET || "khedut-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public")); // Prepare for uploads
const jwt = require("jsonwebtoken"); // Import JWT
const auth = require("./middleware/auth"); // Import Auth Middleware

// ... (existing middleware setup)
app.use(express.static("public"));
app.use("/api/admin", auth, adminRoutes); // Protect Admin Routes
app.use("/api", apiRoutes);

// ... (MongoDB connection)

// ... (Email setup)

// ===== SIGNUP =====
// ... (signup code remains same)

// ===== LOGIN (OTP SEND) =====
// For now, we are keeping OTP login but we need to return a token on VERIFICATION, not generation.
// WAIT - The previous code logged the user in via OTP. 
// The actual Login endpoint just sends OTP. 
// The VERIFY endpoint is where we confirm the user. THAT is where the token should be generated.

// Let's modify VERIFY-OTP instead.
// ===== MongoDB =====
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/farmerdb";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("💡 Check if MongoDB is running locally or check your .env file.");
    // Do not exit process, let the server run so we can return 500s instead of crashing
  });

// ===== Email =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ===== SIGNUP =====
app.post("/api/auth/signup", async (req, res) => {
  console.log("Signup Request Received:", req.body); // DEBUG LOG
  const { username, email, phone, password, role, department } = req.body;

  if (!username || !email || !phone || !password)
    return res.status(400).json({ message: "All fields required (role defaults to farmer)" });

  const existing = await User.findOne({
    $or: [{ username }, { email }, { phone }],
  });

  if (existing)
    return res.status(400).json({ message: "User already exists" });

  const user = new User({
    username,
    email,
    phone,
    password,
    role: role || "farmer",
    department: role === "dept_admin" ? department : null
  });
  await user.save();

  res.json({ message: "Signup successful" });
});

// ===== LOGIN (OTP SEND) =====
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({
    $or: [{ username }, { email: username }],
  });

  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: "Invalid credentials" });

  console.log("Login User Role Found:", user.role); // DEBUG LOG

  const otp = generateOTP();

  await Otp.deleteMany({ userId: user._id });

  await Otp.create({
    userId: user._id,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  // await transporter.sendMail({
  //   to: user.email,
  //   subject: "Your Login OTP",
  //   html: `<h2>Your OTP: ${otp}</h2>`,
  // });

  // Use shared email service
  await sendEmail(user.email, "Your Login OTP", `<h2>Your OTP is: ${otp}</h2><p>This OTP is valid for 5 minutes.</p>`);

  res.json({ userId: user._id });
});

// ===== OTP VERIFY =====
app.post("/api/auth/verify-otp", async (req, res) => {
  const { userId, otp } = req.body;

  const record = await Otp.findOne({ userId, otp });
  if (!record || record.expiresAt < new Date())
    return res.status(400).json({ message: "Invalid or expired OTP" });

  await Otp.deleteMany({ userId });

  const user = await User.findById(userId);

  // res.json({
  //   user: {
  //     id: user._id,
  //     username: user.username,
  //     email: user.email,
  //   },
  // });

  //   res.json({
  //   user: {
  //     id: user._id,
  //     username: user.username,
  //     email: user.email,
  //   }
  // });
  // Create JWT Token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "secret_key", {
    expiresIn: "7d",
  });

  res.json({
    message: "OTP verified",
    token, // Send Token
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
      department: user.department || null,
    },
  });
});


// ===== AADHAR OTP GENERATE =====
app.post("/api/auth/aadhar-otp", async (req, res) => {
  try {
    console.log("Aadhar OTP Request:", req.body); // DEBUG LOG
    const { userId, aadharNumber } = req.body;

    if (!userId || !aadharNumber) {
      console.log("Missing userId or aadharNumber");
      return res.status(400).json({ message: "Missing details" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();

    // Clear old OTPs for this user
    await Otp.deleteMany({ userId: user._id });

    await Otp.create({
      userId: user._id,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`Sending Aadhar OTP ${otp} to ${user.email}`);

    await sendEmail(user.email, "Aadhar Verification OTP", `
      <h2>Aadhar Verification</h2>
      <p>You verified this Aadhar Number: <strong>${aadharNumber}</strong></p>
      <h3>Your OTP is: ${otp}</h3>
      <p>Use this to verify the member/owner.</p>
    `);

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error in Aadhar OTP route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ===== AADHAR OTP VERIFY =====
app.post("/api/auth/verify-aadhar", async (req, res) => {
  const { userId, otp } = req.body;

  const record = await Otp.findOne({ userId, otp });
  if (!record || record.expiresAt < new Date())
    return res.status(400).json({ message: "Invalid or expired OTP" });

  await Otp.deleteMany({ userId }); // Clear OTP after use

  res.json({ message: "Aadhar Verified Successfully" });
});

// ===== GOOGLE OAUTH STRATEGY =====
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      user.googleId = profile.id;
      await user.save();
      return done(null, user);
    }

    user = new User({
      username: profile.displayName || profile.emails[0].value.split("@")[0],
      email: profile.emails[0].value,
      phone: "",
      googleId: profile.id,
      role: "buyer" // Default role for Google login users
    });

    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ===== GOOGLE AUTH ROUTES =====
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000" }),
  (req, res) => {
    // Success redirect to dashboard or login with user data in query (simple for demo)
    // In production, use session or secure cookie
    res.redirect(`http://localhost:3000/?user=${encodeURIComponent(JSON.stringify({
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role || "buyer",
      department: req.user.department || null
    }))}`);
  }
);

// ===== START SERVER =====
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
