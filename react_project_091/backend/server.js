// =======================
// 1️⃣ IMPORT DEPENDENCIES
// =======================
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const path = require("path");
const User = require("../models/User");
const multer = require("multer");
const fs = require("fs");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const marketRoutes = require("./routes/market");
const schemesRoutes = require("./routes/schemes");
const AuditLog = require("../models/AuditLog");

// Missing routes from parent project
const apiRoutes = require("../routes/apiRoutes");
const adminRoutes = require("../routes/adminRoutes");
const auth = require("../middleware/auth");
const paymentRoutes = require("../routes/paymentRoutes");

// =======================
// 2️⃣ LOAD ENV VARIABLES
// =======================
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// =======================
// 3️⃣ INIT EXPRESS APP
// =======================
const app = express();

// Configure Multer for AI Training Storage
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
app.set("ai_upload", upload); // Make it available for routes

// =======================
// 4️⃣ GLOBAL MIDDLEWARE
// =======================
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Admin Audit Logging Middleware
const auditLogger = async (req, res, next) => {
    if (req.user && req.user.role === 'admin' && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        try {
            const log = new AuditLog({
                adminId: req.user._id,
                adminName: req.user.username,
                action: req.method,
                resource: req.url,
                details: req.body,
                ipAddress: req.ip
            });
            await log.save();
        } catch (e) {
            console.error("Audit Logging Failed:", e);
        }
    }
    next();
};

app.use("/api/admin", auth, auditLogger);

// Serve static frontend files
app.use(express.static(path.join(__dirname, "..")));

// =======================
// 5️⃣ SESSION CONFIG
// =======================
app.use(session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set true in HTTPS
}));

// =======================
// 6️⃣ PASSPORT INIT
// =======================
app.use(passport.initialize());
app.use(passport.session());

// =======================
// 7️⃣ MONGODB CONNECTION
// =======================
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/khedut")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// =======================
// 8️⃣ GOOGLE OAUTH STRATEGY
// =======================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
                googleId: profile.id
            });

            await user.save();
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
} else {
    console.warn("⚠️ Google OAuth credentials missing. Google Login will be disabled.");
}

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// =======================
// 9️⃣ ROUTES (FRONTEND)
// =======================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "farmerlogin.html"));
});

app.get("/farmerlogin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "farmerlogin.html"));
});

app.get("/farmersignup.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "farmersignup.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// =======================
// 🔟 API ROUTES
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/schemes", schemesRoutes);

// Register missing routes
app.use("/api/admin", auth, adminRoutes);
app.use("/api", apiRoutes);
app.use("/api/payment", paymentRoutes);

// NEW: AI Diagnostic Routes
const DiseaseCase = require("../models/DiseaseCase");
const fs = require("fs");

app.post("/api/ai/diagnose", auth.auth, upload.single("image"), async (req, res) => {
    console.log("[DEBUG] Diagnose Route Hit - Start");
    try {
        if (!req.file) {
            console.log("[DEBUG] No file uploaded");
            return res.status(400).json({ error: "No image uploaded" });
        }
        console.log("[DEBUG] File uploaded:", req.file.path);

        const fetch = (await import('node-fetch')).default;
        const FormData = (await import('form-data')).default;
        
        // 1. Prepare for AI Prediction (FastAPI call)
        const form = new FormData();
        form.append('file', fs.createReadStream(req.file.path));

        let aiResult = { disease: "Unknown", confidence: "0%", recommendation: "Unable to analyze." };
        
        try {
            const aiResponse = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                body: form,
                headers: form.getHeaders()
            });

            if (aiResponse.ok) {
                aiResult = await aiResponse.json();
            } else {
                console.error("AI Service Error:", await aiResponse.text());
            }
        } catch (err) {
            console.error("Failed to connect to AI Service:", err.message);
            // Fallback to simulation if AI service is down
            aiResult.message = "AI service offline. Showing simulated result.";
        }

        // 2. Store Case 
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

        // 3. Return result to frontend
        res.json({ 
            ...aiResult,
            caseId: newCase._id,
            imageUrl: newCase.imageUrl
        });

    } catch (e) {
        console.error("DIAGNOSE_ROUTE_ERROR", e);
        res.status(500).json({ error: e.message });
    }
});

// =======================
// 1️⃣1️⃣ START SERVER
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;

