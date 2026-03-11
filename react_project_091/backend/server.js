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

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const marketRoutes = require("./routes/market");
const schemesRoutes = require("./routes/schemes");

// Missing routes from parent project
const apiRoutes = require("../routes/apiRoutes");
const adminRoutes = require("../routes/adminRoutes");
const auth = require("../middleware/auth");

// =======================
// 2️⃣ LOAD ENV VARIABLES
// =======================
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// =======================
// 3️⃣ INIT EXPRESS APP
// =======================
const app = express();

// =======================
// 4️⃣ GLOBAL MIDDLEWARE
// =======================
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

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

// =======================
// 1️⃣1️⃣ START SERVER
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;

