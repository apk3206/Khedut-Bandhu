const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
let helmet, rateLimit, mongoSanitize;
try {
  helmet = require("helmet");
  rateLimit = require("express-rate-limit");
  mongoSanitize = require("mongo-sanitize");
} catch (e) {
  console.warn("⚠️ Security modules (helmet, rate-limit, mongo-sanitize) not found. Dynamic security is disabled until modules are installed.");
}
const nodemailer = require("nodemailer");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const sendEmail = require("./services/emailService"); // Import email service


const User = require("./models/User");
const Otp = require("./models/otp");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const multer = require("multer");
const fs = require("fs");
const DiseaseCase = require("./models/DiseaseCase");
const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// Configure Multer for AI image processing
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'upload/training_data';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `crop_${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// ===== Security Middleware =====
if (helmet) app.use(helmet()); 
// if (mongoSanitize) app.use(mongoSanitize());

// Rate Limiting to prevent Brute Force/DDoS
if (rateLimit) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", limiter);
}

// Log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

const apiRoutes = require("./routes/apiRoutes");
const userRoutes = require("./backend/routes/user");

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
const { auth } = require("./middleware/auth"); // Import Auth Middleware

// ... (existing middleware setup)
app.use(express.static("public"));
console.log("Registering adminRoutes...");
app.use("/api/admin", auth, adminRoutes); // Protect Admin Routes
console.log("Registering userRoutes...");
app.use("/api/user", userRoutes);
console.log("Registering apiRoutes...");
app.use("/api", apiRoutes);
console.log("Registering paymentRoutes...");
app.use("/api/payment", paymentRoutes);
console.log("Startup sequence complete. Attempting to listen...");

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

// ===== FORGOT PASSWORD (OTP SEND) =====
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    await Otp.deleteMany({ userId: user._id });
    await Otp.create({
      userId: user._id,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    });

    await sendEmail(user.email, "Password Reset OTP", `<h2>Your Secure Reset OTP is: ${otp}</h2><p>This OTP is valid for 10 minutes.</p>`);

    res.json({ message: "Password reset OTP sent to your email", userId: user._id });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ===== RESET PASSWORD (OTP VERIFY) =====
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    const record = await Otp.findOne({ userId, otp });
    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Using the User model's pre-save hook to hash securely
    user.password = newPassword; 
    await user.save();
    await Otp.deleteMany({ userId });

    res.json({ message: "Password reset successfully! You can now login." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ===== DIGIO AADHAAR KYC REQUEST =====
app.post("/api/auth/digio-request", async (req, res) => {
  const { userId, aadharNumber, customerName } = req.body;
  
  if (process.env.DIGIO_CLIENT_ID && process.env.DIGIO_CLIENT_SECRET) {
      try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const fetch = (await import('node-fetch')).default;
        const authHeader = Buffer.from(`${process.env.DIGIO_CLIENT_ID}:${process.env.DIGIO_CLIENT_SECRET}`).toString('base64');
        const DIGIO_URL = process.env.NODE_ENV === "production" ? "https://api.digio.in" : "https://ext.digio.in:444";
        
        const digioResponse = await fetch(`${DIGIO_URL}/client/kyc/v2/request/with_template`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "customer_identifier": user.email || user.phone || aadharNumber,
            "reference_id": `USER_${user._id}_${Date.now()}`,
            "template_name": "OfflineKyc",
            "notify_customer": false,
            "customer_name": customerName || user.username || "Farmer"
          })
        });

        const data = await digioResponse.json();
        if (digioResponse.ok) {
           return res.json({ useDigio: true, tokenId: data.id, customerIdentifier: data.customer_identifier });
        } else {
           console.error("Digio API Error Payload:", data);
           return res.json({ useDigio: false, message: "Fallback to simulation due to Digio error" });
        }
      } catch (err) {
        console.error("Digio Communication Error", err);
        return res.json({ useDigio: false, message: "Fallback to simulation" });
      }
  }

  // Graceful Fallback if `.env` keys don't exist
  return res.json({ useDigio: false, message: "Using Demo Simulation" });
});


// ===== AADHAAR OTP GENERATE =====
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

// ===== GOOGLE OAUTH ROUTES =====
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/api/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "http://localhost:3000/?error=true" }),
    (req, res) => {
        // Successful authentication
        const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET || "secret_key", { expiresIn: "7d" });
        
        // Redirect to frontend root URL with token (frontend intercepts this on the root Login page)
        res.redirect(`http://localhost:3000/?token=${token}&userId=${req.user._id}&role=${req.user.role}`);
    }
);

// ===== AI DIAGNOSTICS ROUTE =====
app.post("/api/ai/diagnose", auth, upload.single("image"), async (req, res) => {
    console.log("[DEBUG] Diagnosis route hit...");
    try {
        if (!req.file) return res.status(400).json({ error: "No image uploaded" });

        const http = require('http');
        const fs = require('fs');
        const path = require('path');
        
        // Prepare multipart/form-data manually to avoid dependencies
        const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
        const filePath = path.resolve(req.file.path);
        const fileData = fs.readFileSync(filePath);
        
        const contentHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${req.file.originalname}"\r\nContent-Type: ${req.file.mimetype}\r\n\r\n`;
        const contentFooter = `\r\n--${boundary}--\r\n`;
        
        const payload = Buffer.concat([
            Buffer.from(contentHeader),
            fileData,
            Buffer.from(contentFooter)
        ]);

        const options = {
            hostname: 'localhost',
            port: 8000,
            path: '/predict',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': payload.length
            }
        };

        let aiResult = { disease: "Unknown", confidence: "0%", recommendation: "Unable to analyze." };

        const aiReq = http.request(options, (aiRes) => {
            let responseData = '';
            aiRes.on('data', (chunk) => responseData += chunk);
            aiRes.on('end', async () => {
                try {
                    if (aiRes.statusCode === 200) {
                        aiResult = JSON.parse(responseData);
                    }
                    
                    // Store Case and Return
                    const newCase = new DiseaseCase({
                        userId: req.user._id,
                        cropName: req.body.cropName || "Unknown",
                        imageUrl: `/upload/training_data/${req.file.filename}`,
                        diagnosedDisease: aiResult.disease,
                        metadata: {
                            location: req.body.location,
                            confidence: aiResult.confidence,
                            device: req.header("User-Agent")
                        }
                    });
                    await newCase.save();

                    res.json({ ...aiResult, caseId: newCase._id, imageUrl: newCase.imageUrl });
                } catch (err) {
                    console.error("AI Parse Error:", err.message);
                    res.status(500).json({ error: "Invalid AI response" });
                }
            });
        });

        aiReq.on('error', async (err) => {
            console.error("AI Service Offline:", err.message);
            // Fallback save in case AI is down
            const newCase = new DiseaseCase({
                userId: req.user._id,
                cropName: req.body.cropName || "Unknown",
                imageUrl: `/upload/training_data/${req.file.filename}`,
                diagnosedDisease: "AI Offline",
                metadata: { device: req.header("User-Agent") }
            });
            await newCase.save();
            res.json({ ...aiResult, message: "AI service offline. No diagnosis today.", imageUrl: newCase.imageUrl });
        });

        aiReq.write(payload);
        aiReq.end();

    } catch (e) {
        console.error("AI_ROUTE_ERROR", e);
        res.status(500).json({ error: e.message });
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

// ===== AI PROXY ROUTES (forwards to FastAPI on port 8000) =====
const http = require('http');
const FormData = require('form-data');

// Health check proxy
app.get('/api/ai/health', (req, res) => {
  const options = { hostname: 'localhost', port: 8005, path: '/health', method: 'GET' };
  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      try { res.json(JSON.parse(data)); }
      catch { res.json({ status: 'ok', model: false }); }
    });
  });
  proxyReq.on('error', () => res.status(503).json({ status: 'offline', model: false }));
  proxyReq.end();
});

// Classes endpoint proxy
app.get('/api/ai/classes', (req, res) => {
  const options = { hostname: 'localhost', port: 8005, path: '/classes', method: 'GET' };
  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      try { res.json(JSON.parse(data)); }
      catch { res.status(500).json({ error: 'AI service error' }); }
    });
  });
  proxyReq.on('error', () => res.status(503).json({ error: 'AI service offline' }));
  proxyReq.end();
});

// Predict endpoint — streams multipart/form-data from React → FastAPI
app.post('/api/ai/predict', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const cropName = req.body.cropName || 'Unknown';
    const fs = require('fs');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('cropName', cropName);

    const options = {
      hostname: 'localhost',
      port: 8005,
      path: '/predict',
      method: 'POST',
      headers: formData.getHeaders()
    };

    const proxyReq = http.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        // Cleanup temp file
        try { fs.unlinkSync(req.file.path); } catch {}
        try {
          const parsed = JSON.parse(data);
          if (proxyRes.statusCode >= 400) {
            return res.status(proxyRes.statusCode).json(parsed);
          }
          res.json(parsed);
        } catch {
          res.status(500).json({ error: 'Invalid response from AI service' });
        }
      });
    });

    proxyReq.on('error', (err) => {
      try { fs.unlinkSync(req.file.path); } catch {}
      res.status(503).json({ error: 'AI service offline. Start python main.py in ai-service folder.' });
    });

    formData.pipe(proxyReq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== START SERVER =====
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

