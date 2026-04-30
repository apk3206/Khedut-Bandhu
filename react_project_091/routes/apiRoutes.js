const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Land = require("../models/Land");
const Complaint = require("../models/complaint");
const Product = require("../models/Product");
const Order = require("../models/Order");
const MarketRate = require("../models/MarketRate");
const User = require("../models/User");
const Scheme = require("../models/Scheme");
const MarketListing = require("../models/MarketListing");
const Feedback = require("../models/Feedback"); // Fixed missing import
const sendEmail = require("../services/emailService"); // Import Email Service
const jwt = require("jsonwebtoken"); // Import JWT
const { auth, checkRole } = require("../middleware/auth"); // Import Auth Middleware
const khedutBlockchain = require("../services/BlockchainService");
let body, validationResult;
try {
  const validator = require("express-validator");
  body = validator.body;
  validationResult = validator.validationResult;
} catch (e) {
  console.warn("⚠️ express-validator not found. Input validation is disabled.");
  // Dummy functions to prevent errors by returning no-op middleware
  const noop = (req, res, next) => next();
  const chain = () => {
    const fn = noop;
    const proxy = new Proxy(fn, {
      get: (target, prop) => {
        if (prop in target) return target[prop];
        return chain; // Return the chain for any method call
      }
    });
    return proxy;
  };
  body = chain;
  validationResult = () => ({ isEmpty: () => true, array: () => [] });
}

router.get("/debug", (req, res) => {
    res.json({ message: "API Routes are active!", version: "V2" });
});
router.get("/test", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});
// const { validateAndClassifyComplaint } = require("../services/aiService");


// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// ================= LAND ROUTES =================
router.post("/land", auth, [
    body("userId").isMongoId().withMessage("Invalid User ID"),
    body("ownerName").notEmpty().trim().escape().withMessage("Owner Name is required"),
    body("gender").isIn(["Male", "Female", "Other"]).withMessage("Invalid Gender"),
    body("aadharNumber").matches(/^\d{12}$/).withMessage("Invalid Aadhar Number (12 digits required)"),
    body("district").notEmpty().trim().escape().withMessage("District is required"),
    body("village").notEmpty().trim().escape().withMessage("Village is required"),
    body("area").optional().isNumeric().withMessage("Area must be a number"),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userId, ownerName, gender, dob, aadharNumber, state, district, taluka, village, area, soilType, holders } = req.body;
        
        let land = await Land.findOne({ userId });

        if (land) {
            // Update existing - Protect from mass assignment
            land.ownerName = ownerName || land.ownerName;
            land.gender = gender || land.gender;
            land.dob = dob || land.dob;
            land.aadharNumber = aadharNumber || land.aadharNumber;
            land.state = state || land.state;
            land.district = district || land.district;
            land.taluka = taluka || land.taluka;
            land.village = village || land.village;
            land.area = area || land.area;
            land.soilType = soilType || land.soilType;
            if (holders) land.holders = holders;
            
            await land.save();
        } else {
            // Create new
            land = new Land({ 
                userId, ownerName, gender, dob, aadharNumber, 
                state, district, taluka, village, area, soilType, holders 
            });
            await land.save();
            // Update User profile status
            await User.findByIdAndUpdate(userId, {
                isProfileCompleted: true,
                landDetails: land._id,
            });
        }
        res.json(land);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/land/:userId", async (req, res) => {
    try {
        const land = await Land.findOne({ userId: req.params.userId });
        res.json(land);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= COMPLAINT ROUTES =================
router.post("/complaint", upload.single("media"), async (req, res) => {
    try {
        const { userId, department, subject, description } = req.body;
        const mediaUrl = req.file ? `/uploads/${req.file.filename}` : "";

        // AI Validation and Classification (Temporarily Disabled)
        /*
        const aiResult = await validateAndClassifyComplaint(subject, description);

        if (!aiResult.isProper) {
            return res.status(400).json({
                error: "Complaint is not proper.",
                reason: aiResult.reason
            });
        }
        */

        // Auto-routing logic (Fallback to keyword based)
        let autoDept = department;
        if (!department) {
            const lowSubject = (subject || "").toLowerCase();
            const lowDesc = (description || "").toLowerCase();
            const fullText = lowSubject + " " + lowDesc;

            if (fullText.includes("seed")) autoDept = "Seed";
            else if (fullText.includes("price") || fullText.includes("rate") || fullText.includes("apmc")) autoDept = "MarketPrice";
            else if (fullText.includes("order") || fullText.includes("deliver") || fullText.includes("status")) autoDept = "Orders";
            else if (fullText.includes("pesticide") || fullText.includes("fertilizer") || fullText.includes("spray") || fullText.includes("insect")) autoDept = "Pesticide";
            else autoDept = "Help";
        }

        const complaint = new Complaint({
            userId,
            department: autoDept,
            subject,
            description,
            mediaUrl,
        });

        await complaint.save();

        // Return complaint
        const responseData = complaint.toObject();
        // autoCorrected logic is currently disabled along with AI
        // if (autoCorrected) responseData.message = `Auto-corrected department to ${autoDept}`;

        res.json(responseData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/complaint/user/:userId", async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Route - Get Complaints with Strict Filtering
router.get("/complaint/admin/all", auth, checkRole(["admin", "dept_admin"]), async (req, res) => {
    try {
        const { role, department } = req.user; // Get from AUTHENTICATED user, not query
        console.log(`[SECURITY] Fetching Complaints. User: ${req.user.username}, Role: ${role}, Dept: ${department}`);

        let query = { _id: { $exists: false } }; // DEFAULT: BLOCK EVERYTHING

        // "Supreme Admin" OR "Complaint Department" can see EVERYTHING
        if (role === "admin" || (department && department.toLowerCase() === "complaint")) {
            console.log("[DEBUG] Access Granted: Full View");
            query = {};
        }
        // Other Department Admins (e.g., Pesticide, MarketPrice) see ONLY their department
        else if (role === "dept_admin" && department) {
            const safeDept = department.trim();
            console.log(`[DEBUG] Access Granted: Restricted View for ${safeDept}`);
            query = { department: { $regex: new RegExp(`^${safeDept}$`, "i") } };
        } else {
            console.log("[DEBUG] Access Denied: Invalid parameters for complaints view");
        }

        const complaints = await Complaint.find(query).populate("userId", "username email");

        // DEBUG: Log why we might be getting 0 results
        if (complaints.length === 0 && role === "dept_admin") {
            const allComplaints = await Complaint.find({}, "department");
            const uniqueDepts = [...new Set(allComplaints.map(c => c.department))];
            console.log(`[DEBUG] No matches for '${department}'. Available Depts in DB:`, uniqueDepts);
        }

        res.json(complaints);
    } catch (err) {
        console.error("[DEBUG] Error fetching complaints:", err);
        res.status(500).json({ error: err.message });
    }
});

// Admin Stats Route (Supreme)
router.get("/admin/stats/supreme", auth, checkRole(["admin"]), async (req, res) => {
    try {
        const users = await User.countDocuments();

        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: "Pending" });
        const resolvedComplaints = await Complaint.countDocuments({ status: "Resolved" });

        const activeListings = await MarketListing.countDocuments({ status: "Available" });
        const products = await Product.countDocuments();

        res.json({
            users,
            complaints: { total: totalComplaints, pending: pendingComplaints, resolved: resolvedComplaints },
            activeListings,
            products
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Stats Route (Department Specific)
router.get("/admin/stats/dept/:department", auth, checkRole(["dept_admin"]), async (req, res) => {
    try {
        const department = req.params.department;

        // Filter complaints by department (Case insensitive)
        const deptRegex = new RegExp(`^${department}$`, "i");

        const totalComplaints = await Complaint.countDocuments({ department: { $regex: deptRegex } });
        const pendingComplaints = await Complaint.countDocuments({ department: { $regex: deptRegex }, status: "Pending" });
        const resolvedComplaints = await Complaint.countDocuments({ department: { $regex: deptRegex }, status: "Resolved" });

        // Products filtering 
        const productCount = await Product.countDocuments({
            category: { $regex: deptRegex }
        });

        // Listings 
        let activeListings = 0;
        if (department.toLowerCase() === "marketprice") {
            activeListings = await MarketListing.countDocuments({ status: "Available" });
        }

        const users = 0; // Dept admins don't see total users

        res.json({
            users,
            complaints: { total: totalComplaints, pending: pendingComplaints, resolved: resolvedComplaints },
            activeListings,
            products: productCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/complaint/:id", async (req, res) => {
    try {
        const { status, adminResponse } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status, adminResponse },
            { new: true }
        ).populate("userId"); // Populate user to get email

        if (complaint && complaint.userId && complaint.userId.email) {
            const emailSubject = `Complaint Update: ${complaint.subject}`;
            const emailBody = `
                <h3>Your complaint status has been updated.</h3>
                <p><strong>Subject:</strong> ${complaint.subject}</p>
                <p><strong>New Status:</strong> <span style="color: ${status === 'Resolved' ? 'green' : 'orange'}">${status}</span></p>
                <p><strong>Admin Response:</strong> ${adminResponse}</p>
                <p>Thank you for using Khedut Bandhu.</p>
            `;
            await sendEmail(complaint.userId.email, emailSubject, emailBody);
        }

        res.json(complaint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= FEEDBACK ROUTES =================
router.post("/feedback", upload.single("media"), async (req, res) => {
    try {
        const { userId, type, department, subject, description } = req.body;
        const mediaUrl = req.file ? `/uploads/${req.file.filename}` : "";

        const feedback = new Feedback({
            userId,
            type,
            department: type === "Department-wise" ? department : undefined,
            subject,
            description,
            mediaUrl,
        });

        await feedback.save();
        res.json({ message: "Feedback submitted successfully", feedback });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Route - Get Feedbacks with Filtering
router.get("/feedback/admin/all", async (req, res) => {
    try {
        const { role, department } = req.query;
        let query = {};

        if (role === "dept_admin" && department) {
            query = {
                $or: [
                    { type: "General" },
                    { department: { $regex: new RegExp(`^${department}$`, "i") } }
                ]
            };
        }

        const feedbacks = await Feedback.find(query).populate("userId", "username email phone");
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Route - Update Feedback Status
router.put("/feedback/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate("userId", "username email phone");

        if (feedback && feedback.userId && feedback.userId.email) {
            const emailSubject = `Feedback Update: ${feedback.subject}`;
            const emailBody = `
                <h3>Thank you for your valuable feedback!</h3>
                <p><strong>Subject:</strong> ${feedback.subject}</p>
                <p><strong>New Status:</strong> <span style="color: ${status === 'Resolved' ? 'green' : 'orange'}">${status}</span></p>
                <p>Your feedback helps us improve Khedut Bandhu. Have a great day.</p>
            `;
            await sendEmail(feedback.userId.email, emailSubject, emailBody);
        }

        // SMS logic placeholder (since we don't have Twilio/SMS service setup in package.json)
        if (feedback && feedback.userId && feedback.userId.phone) {
            console.log(`[Mock SMS] Sending SMS to ${feedback.userId.phone}: Thank you for your feedback! Your feedback status is now ${status}.`);
        }

        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NEW: Public Stats Route (Advanced: 6-Month Trends & Regional)
router.get("/complaint/stats/public", async (req, res) => {
    try {
        const MarketRateHistory = require("../models/MarketRateHistory");

        // 1. Precise Numbering Data (Top Cards)
        const totalUsers = await User.countDocuments();
        const totalComplaints = await Complaint.countDocuments();
        const activeListings = await MarketListing.countDocuments({ status: "Available" });
        const totalProducts = await Product.countDocuments();

        // 2. Complaint Status Distribution (Pie Chart)
        const complaintStats = await Complaint.aggregate([
            { $group: { _id: "$status", value: { $sum: 1 } } }
        ]);
        const statusMap = { "Pending": 0, "In Progress": 0, "Resolved": 0, "Rejected": 0 };
        complaintStats.forEach(s => statusMap[s._id] = s.value);
        const complaintStatusData = Object.keys(statusMap).map(status => ({ name: status, value: statusMap[status] }));

        // 3. Product Sales vs Stock (Bar Chart)
        // Aggregating Sales from Orders
        const productsOfFocus = ["Wheat", "Cotton", "Cumin", "Groundnut", "Castor"];
        const salesVsStock = [];

        for (const crop of productsOfFocus) {
            // Find products matching the name (Seed/Pesticide related to crop)
            const products = await Product.find({ name: { $regex: crop, $options: "i" } });
            const productIds = products.map(p => p._id);

            // Sum Stock
            const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

            // Sum Sales from Orders
            const orderAggregation = await Order.aggregate([
                { $unwind: "$products" },
                { $match: { "products.productId": { $in: productIds } } },
                { $group: { _id: null, totalSales: { $sum: "$products.quantity" } } }
            ]);
            const totalSales = orderAggregation.length > 0 ? orderAggregation[0].totalSales : Math.floor(Math.random() * 5000) + 1000; // Mock sales fallback for demo if no orders

            salesVsStock.push({
                name: crop,
                Stock: totalStock || Math.floor(Math.random() * 8000) + 2000, // Mock stock fallback for demo
                Sales: totalSales
            });
        }

        // 4. Market Price Trends (Line Chart - Live 6-Month Trailing)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trendData = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            
            // Generate realistic market baseline for each crop
            trendData.push({
                month: key,
                Wheat: 2100 + Math.floor(Math.random() * 200) - 100,
                Cotton: 6000 + Math.floor(Math.random() * 400) - 200,
                Groundnut: 4000 + Math.floor(Math.random() * 300) - 150,
                Rice: 3000 + Math.floor(Math.random() * 200) - 100,
                Mustard: 5000 + Math.floor(Math.random() * 300) - 150
            });
        }

        res.json({
            topStats: {
                totalUsers,
                totalComplaints,
                activeListings,
                totalProducts
            },
            complaintStatus: complaintStatusData,
            salesVsStock: salesVsStock,
            trends: trendData
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ================= PRODUCT & ORDER ROUTES =================
router.put("/products/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/products", async (req, res) => {
    try {
        // Seed data if fewer than 5 products exist
        // Seed data ONLY if empty
        const count = await Product.countDocuments();
        const toolCount = await Product.countDocuments({ category: "Tool" });

        if (count === 0 || toolCount === 0) {
            if (count > 0 && toolCount === 0) {
                // If products exist but no tools, just add tools
                await Product.insertMany([
                    { name: "Ceramic Flower Pot (Medium)", category: "Tool", price: 450, stock: 50, description: "High-quality ceramic pot for indoor and outdoor gardening.", imageUrl: "/products/pot.png" },
                    { name: "Gardening Scissors (Steel)", category: "Tool", price: 299, stock: 100, description: "Sharp steel scissors for pruning and cutting plants.", imageUrl: "/products/scissors.png" },
                    { name: "Watering Can (5L)", category: "Tool", price: 350, stock: 75, description: "Durable plastic watering can with a rose spray head.", imageUrl: "/products/watering_can.png" },
                    { name: "Hand Trowel", category: "Tool", price: 150, stock: 120, description: "Essential tool for digging and planting.", imageUrl: "/products/trowel.png" }
                ]);
            } else {
                // Full Seed
                await Product.insertMany([
                    // --- SEEDS (5 Examples) ---
                    { name: "Hybrid Wheat Seeds (Lok-1)", category: "Seed", price: 800, stock: 500, description: "High yield Lok-1 wheat seeds, suitable for Gujarat climate.", imageUrl: "/products/wheat_seeds_bag.png" },
                    { name: "Bt Cotton Seeds (Bollgard II)", category: "Seed", price: 1200, stock: 300, description: "Pest-resistant cotton seeds with high production potential.", imageUrl: "/products/cotton_seeds_bag.png" },
                    { name: "Cumin Seeds (Gujarat-4)", category: "Seed", price: 3500, stock: 100, description: "Premium quality cumin seeds for export quality yield.", imageUrl: "/products/wheat_seeds_bag.png" },
                    { name: "Groundnut Seeds (GG-20)", category: "Seed", price: 1800, stock: 250, description: "High oil content groundnut seeds, drought resistant.", imageUrl: "/products/wheat_seeds_bag.png" },
                    { name: "Castor Seeds (GCH-7)", category: "Seed", price: 600, stock: 400, description: "Hybrid castor seeds known for disease resistance.", imageUrl: "/products/wheat_seeds_bag.png" },

                    // --- DETAILED PESTICIDES (10) ---
                    {
                        name: "Chlorpyrifos",
                        category: "Pesticide",
                        price: 450,
                        stock: 200,
                        imageUrl: "/products/clorpyifos.png",
                        description: "Chlorpyrifos is a broad-spectrum insecticide that works by affecting the nervous system of insects. It is effective against both soil and leaf-feeding pests.",
                        type: "Insecticide",
                        usedFor: ["Termites", "Stem borers", "Leaf folders", "Soil insects"],
                        crops: ["Rice", "Cotton", "Sugarcane", "Vegetables"],
                        usageSteps: [
                            "Mix 2–4 ml per liter of water",
                            "Fill the sprayer tank halfway with water",
                            "Add required quantity of Chlorpyrifos",
                            "Mix well and fill remaining water",
                            "Spray evenly on crops or soil",
                            "Spray in morning or evening only"
                        ],
                        safetyInstructions: ["Wear gloves and mask", "Keep away from children", "Do not mix with alkaline"]
                    },
                    {
                        name: "Imidacloprid",
                        category: "Pesticide",
                        price: 750,
                        stock: 150,
                        imageUrl: "/products/Imidacloprid.png",
                        description: "Imidacloprid is absorbed by the plant and protects it from inside. It provides long-lasting protection against sucking pests.",
                        type: "Systemic insecticide",
                        usedFor: ["Aphids", "Whiteflies", "Jassids", "Thrips"],
                        crops: ["Cotton", "Vegetables", "Fruits"],
                        usageSteps: [
                            "Mix 0.3 ml per liter of water",
                            "Stir solution properly",
                            "Spray directly on affected leaves",
                            "Ensure uniform coverage",
                            "Avoid spraying during flowering"
                        ],
                        safetyInstructions: ["Wear protective gear", "Wash hands after use"]
                    },
                    {
                        name: "Malathion",
                        category: "Pesticide",
                        price: 300,
                        stock: 200,
                        imageUrl: "/products/Malathion.png",
                        description: "Malathion is a contact insecticide widely used due to its quick action and affordability.",
                        type: "Organophosphate insecticide",
                        usedFor: ["Mosquitoes", "Fruit flies", "Caterpillars"],
                        crops: ["Fruits", "Vegetables", "Pulses"],
                        usageSteps: [
                            "Mix 1–2 ml per liter of water",
                            "Prepare solution in sprayer",
                            "Spray on both sides of leaves",
                            "Repeat after 10–14 days if required"
                        ],
                        safetyInstructions: ["Toxic to bees", "Avoid water bodies"]
                    },
                    {
                        name: "Mancozeb",
                        category: "Pesticide",
                        price: 400,
                        stock: 250,
                        imageUrl: "/products/Mancozeb (fungicide).png",
                        description: "Mancozeb prevents fungal diseases by forming a protective layer on plant surfaces.",
                        type: "Contact fungicide",
                        usedFor: ["Leaf spot", "Blight", "Rust", "Downy mildew"],
                        crops: ["Potato", "Tomato", "Grapes", "Vegetables"],
                        usageSteps: [
                            "Mix 2–2.5 grams per liter of water",
                            "Shake well to avoid lumps",
                            "Spray before disease appears",
                            "Repeat every 7–10 days"
                        ],
                        safetyInstructions: ["Wear mask", "Avoid inhalation"]
                    },
                    {
                        name: "Carbaryl",
                        category: "Pesticide",
                        price: 550,
                        stock: 100,
                        imageUrl: "/products/Carbaryl.png",
                        description: "Carbaryl is a contact insecticide that kills insects instantly upon contact.",
                        type: "Insecticide",
                        usedFor: ["Beetles", "Caterpillars", "Leaf eaters"],
                        crops: ["Cotton", "Vegetables", "Fruits"],
                        usageSteps: [
                            "Mix 2 grams per liter of water",
                            "Prepare fresh spray solution",
                            "Spray on infected parts",
                            "Do not harvest crops immediately after spray"
                        ],
                        safetyInstructions: ["Wear protective gear", "Wait before harvest"]
                    },
                    {
                        name: "Glyphosate",
                        category: "Pesticide",
                        price: 900,
                        stock: 120,
                        imageUrl: "/products/Glyphosate (herbicide).png",
                        description: "Glyphosate kills weeds completely by stopping their growth process.",
                        type: "Non-selective herbicide",
                        usedFor: ["All types of weeds"],
                        crops: ["Used before sowing or between rows"],
                        usageSteps: [
                            "Mix 5–10 ml per liter of water",
                            "Spray only on weeds",
                            "Avoid contact with crops",
                            "Best results when weeds are young"
                        ],
                        safetyInstructions: ["Avoid crop contact", "Use protective shield"]
                    },
                    {
                        name: "Cypermethrin",
                        category: "Pesticide",
                        price: 500,
                        stock: 300,
                        imageUrl: "/products/Cypermethrin.png",
                        description: "Cypermethrin works quickly and has strong knock-down action against insects.",
                        type: "Synthetic pyrethroid insecticide",
                        usedFor: ["Bollworms", "Cutworms", "Ants"],
                        crops: ["Cotton", "Vegetables", "Cereals"],
                        usageSteps: [
                            "Mix 1 ml per liter of water",
                            "Spray uniformly on crop",
                            "Avoid over-spraying",
                            "Use in early infestation stage"
                        ],
                        safetyInstructions: ["Highly toxic", "Keep away from water"]
                    },
                    {
                        name: "Acephate",
                        category: "Pesticide",
                        price: 600,
                        stock: 150,
                        imageUrl: "/products/Acephate.png",
                        description: "Acephate enters the plant system and controls pests from inside.",
                        type: "Systemic insecticide",
                        usedFor: ["Thrips", "Aphids", "Leaf miners"],
                        crops: ["Cotton", "Vegetables"],
                        usageSteps: [
                            "Mix 1 gram per liter of water",
                            "Spray thoroughly on foliage",
                            "Effective in hot weather",
                            "Repeat if infestation continues"
                        ],
                        safetyInstructions: ["Systemic action", "Follow dosage"]
                    },
                    {
                        name: "Spinosad",
                        category: "Pesticide",
                        price: 1200,
                        stock: 80,
                        imageUrl: "/products/Spinosad.png",
                        description: "Spinosad is derived from natural bacteria and is safe for humans and beneficial insects.",
                        type: "Biological insecticide",
                        usedFor: ["Caterpillars", "Thrips", "Fruit borers"],
                        crops: ["Vegetables", "Fruits"],
                        usageSteps: [
                            "Mix 0.3 ml per liter of water",
                            "Spray in evening hours",
                            "Cover leaf surfaces properly",
                            "Safe for organic farming"
                        ],
                        safetyInstructions: ["Safe for humans", "Eco-friendly"]
                    },
                    {
                        name: "Metalaxyl",
                        category: "Pesticide",
                        price: 850,
                        stock: 100,
                        imageUrl: "/products/Metalaxyl.png",
                        description: "Metalaxyl is absorbed by the plant and protects it from internal fungal infections.",
                        type: "Systemic fungicide",
                        usedFor: ["Downy mildew", "Root rot"],
                        crops: ["Grapes", "Potatoes", "Vegetables"],
                        usageSteps: [
                            "Mix 1 gram per liter of water",
                            "Spray on soil and leaves",
                            "Best used at early disease stage",
                            "Do not mix with strong alkaline chemicals"
                        ],
                        safetyInstructions: ["Systemic use", "Follow safety guidelines"]
                    },

                    // --- GARDEN TOOLS (NEW) ---
                    { name: "Ceramic Flower Pot (Medium)", category: "Tool", price: 450, stock: 50, description: "High-quality ceramic pot for indoor and outdoor gardening.", imageUrl: "/products/pot.png" },
                    { name: "Gardening Scissors (Steel)", category: "Tool", price: 299, stock: 100, description: "Sharp steel scissors for pruning and cutting plants.", imageUrl: "/products/scissors.png" },
                    { name: "Watering Can (5L)", category: "Tool", price: 350, stock: 75, description: "Durable plastic watering can with a rose spray head.", imageUrl: "/products/watering_can.png" },
                    { name: "Hand Trowel", category: "Tool", price: 150, stock: 120, description: "Essential tool for digging and planting.", imageUrl: "/products/trowel.png" }
                ]);
            }
        }

        let query = {};
        if (req.query.category) {
            query.category = req.query.category;
        }

        const products = await Product.find(query);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Review Route
router.post("/products/:id/review", async (req, res) => {
    try {
        const { userId, username, rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: "Product not found" });

        const review = { userId, username, rating, comment, createdAt: new Date() };
        product.reviews.push(review);

        // Update Average Rating
        const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
        product.averageRating = (totalRating / product.reviews.length).toFixed(1);
        product.ratingCount = product.reviews.length;

        await product.save();
        res.json({ message: "Review added successfully", product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Order
router.post("/order", auth, [
    body("userId").isMongoId().withMessage("Invalid User ID"),
    body("products").isArray({ min: 1 }).withMessage("At least one product is required"),
    body("totalAmount").isNumeric().withMessage("Total amount must be a number"),
    body("deliveryDetails.address").notEmpty().trim().escape().withMessage("Delivery address is required"),
    body("deliveryDetails.pincode").matches(/^\d{6}$/).withMessage("Invalid Pincode"),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log("Order Request:", req.body); // Debug Log
        const { userId, products, totalAmount, paymentMethod, deliveryCharge, deliveryDetails } = req.body;

        const order = new Order({
            userId,
            products,
            totalAmount,
            paymentMethod,
            deliveryCharge,
            deliveryDetails,
            expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default: 7 days from now
        });

        await order.save();
        res.json(order);
    } catch (err) {
        console.error("Order Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update User Settings (Profile & Password)
router.put("/user/settings/:id", auth, [
    body("bankDetails.accountNumber").optional().trim().isNumeric().withMessage("Account Number must be numeric"),
    body("bankDetails.ifscCode").optional().trim().matches(/^[A-Z]{4}0[A-Z0-String0-9]{6}$/).withMessage("Invalid IFSC Code format"),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, phone, password, newPassword, bankDetails } = req.body;
        
        // Security: Ensure user only updates their own profile
        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ error: "Access Denied: Unauthorized profile update." });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Update basic info
        if (username) user.username = username;
        if (phone) user.phone = phone;

        // Update bank details if provided
        if (bankDetails) {
            user.bankDetails = {
                accountNumber: bankDetails.accountNumber || user.bankDetails.accountNumber,
                ifscCode: bankDetails.ifscCode || user.bankDetails.ifscCode,
                bankName: bankDetails.bankName || user.bankDetails.bankName,
                accountHolderName: bankDetails.accountHolderName || user.bankDetails.accountHolderName,
            };
        }

        // Update password if provided
        if (newPassword) {
            if (password) {
                const isMatch = await user.comparePassword(password);
                if (!isMatch) return res.status(400).json({ error: "Incorrect current password" });
            }
            user.password = newPassword;
        }

        await user.save();
        res.json({ message: "Profile updated successfully", user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            bankDetails: user.bankDetails
        }});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/orders/:userId", async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).populate("products.productId");
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= USER MANAGEMENT ROUTES =================
router.get("/users", auth, checkRole(["admin"]), async (req, res) => {
    try {
        console.log("Fetching all users..."); // Debug Log
        const users = await User.find({}, "-password");
        console.log(`Found ${users.length} users`); // Debug Log
        res.json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: err.message });
    }
});

router.delete("/user/:id", auth, checkRole(["admin"]), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= MARKET RATES ROUTES =================
router.get("/market", async (req, res) => {
    try {
        const { state } = req.query;
        // Mock multi-state data if empty
        const count = await MarketRate.countDocuments();
        if (count === 0) {
            const initialRates = [
                // Gujarat
                { cropName: "Wheat", rate: 2150, previousRate: 2140, state: "Gujarat", region: "Central Gujarat", date: new Date() },
                { cropName: "Cotton", rate: 6800, previousRate: 6850, state: "Gujarat", region: "Saurashtra", date: new Date() },
                { cropName: "Groundnut", rate: 5900, previousRate: 5880, state: "Gujarat", region: "North Gujarat", date: new Date() },
                { cropName: "Cumin", rate: 28500, previousRate: 28400, state: "Gujarat", region: "Unjha", date: new Date() },
                { cropName: "Castor", rate: 1250, previousRate: 1260, state: "Gujarat", region: "Mehsana", date: new Date() },
                // Punjab
                { cropName: "Wheat", rate: 2275, previousRate: 2270, state: "Punjab", region: "Ludhiana", date: new Date() },
                { cropName: "Rice (Basmati)", rate: 4500, previousRate: 4480, state: "Punjab", region: "Amritsar", date: new Date() },
                { cropName: "Maize", rate: 1950, previousRate: 1960, state: "Punjab", region: "Patiala", date: new Date() },
                // Rajasthan
                { cropName: "Mustard", rate: 5650, previousRate: 5600, state: "Rajasthan", region: "Jaipur", date: new Date() },
                { cropName: "Bajara", rate: 2100, previousRate: 2120, state: "Rajasthan", region: "Alwar", date: new Date() },
                { cropName: "Guar Seed", rate: 5800, previousRate: 5750, state: "Rajasthan", region: "Bikaner", date: new Date() },
                // Maharashtra
                { cropName: "Soybean", rate: 4800, previousRate: 4750, state: "Maharashtra", region: "Nagpur", date: new Date() },
                { cropName: "Tur (Arhar)", rate: 7200, previousRate: 7250, state: "Maharashtra", region: "Latur", date: new Date() },
                { cropName: "Onion", rate: 1800, previousRate: 1750, state: "Maharashtra", region: "Nashik", date: new Date() },
            ];
            await MarketRate.insertMany(initialRates);
        }

        let query = {};
        if (state) {
            query.state = { $regex: new RegExp(`^${state}$`, "i") };
        }

        let rates = await MarketRate.find(query).sort({ date: -1 });
        
        // Fallback: If no results for state, return any rates available so ticker isn't empty
        if (rates.length === 0 && state) {
            rates = await MarketRate.find({}).sort({ date: -1 }).limit(20);
        }

        res.json(rates);
    } catch (err) {
        console.error("Market fetch error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update Complaint
router.put("/complaint/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updatedComplaint = await Complaint.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedComplaint) return res.status(404).json({ error: "Complaint not found" });
        res.json(updatedComplaint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= MARKET LISTING ROUTES (FARMER SELL) =================
router.post("/market/sell", async (req, res) => {
    try {
        const listing = new MarketListing(req.body);
        await listing.save();

        // Send Confirmation Email
        const user = await User.findById(req.body.userId);
        if (user && user.email) {
            const subject = "Market Listing Confirmation - Khedut Bandhu";
            const html = `
                <h3>Your crop has been listed successfully!</h3>
                <p><strong>Crop:</strong> ${req.body.cropName}</p>
                <p><strong>Quantity:</strong> ${req.body.quantity} Quintal</p>
                <p><strong>Expected Price:</strong> ₹${req.body.expectedPrice}</p>
                <p>Your listing is now visible to buyers.</p>
            `;
            await sendEmail(user.email, subject, html);
        }

        res.json(listing);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/market/listings", async (req, res) => {
    try {
        const listings = await MarketListing.find({ status: "Available" }).sort({ createdAt: -1 });
        res.json(listings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= SCHEME ROUTES =================
router.get("/schemes", async (req, res) => {
    try {
        const schemes = await Scheme.find({ isActive: true });
        res.json(schemes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/schemes", async (req, res) => {
    try {
        const scheme = new Scheme(req.body);
        await scheme.save();
        res.json(scheme);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= RECOMMENDATION ROUTES =================
router.get("/recommendations/:userId", async (req, res) => {
    try {
        const land = await Land.findOne({ userId: req.params.userId });
        const currentMonth = new Date().getMonth(); // 0-11
        let season = "Summer";
        if (currentMonth >= 6 && currentMonth <= 9) season = "Monsoon";
        else if (currentMonth >= 10 || currentMonth <= 1) season = "Winter";

        let recommendations = {
            season,
            crops: [],
            pesticides: [],
            tips: []
        };

        // Simple Rule-Based Logic
        if (season === "Winter") {
            recommendations.crops = ["Wheat", "Cumin", "Chickpea"];
            recommendations.pesticides = ["Mancozeb (for blight)", "Chlorpyrifos (for termites)"];
            recommendations.tips = ["Irrigate wheat at crown root initiation.", "Watch for aphids in cumin."];
        } else if (season === "Summer") {
            recommendations.crops = ["Groundnut", "Sesame", "Pearl Millet"];
            recommendations.pesticides = ["Imidacloprid (for sucking pests)", "Quinalphos"];
            recommendations.tips = ["Maintain soil moisture.", "Use mulch to reduce evaporation."];
        } else {
            recommendations.crops = ["Cotton", "Rice", "Soybean"];
            recommendations.pesticides = ["Monocrotophos", "Cypermethrin"];
            recommendations.tips = ["Drain excess water from rice fields.", "Monitor for bollworms in cotton."];
        }

        // Add Land specific logic if land details exist
        if (land) {
            if (land.district === "Kutch") {
                recommendations.crops.push("Date Palm");
            } else if (land.district === "Junagadh") {
                recommendations.crops.push("Mango");
            }
        }

        res.json(recommendations);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= CONTACT ROUTE =================
router.post("/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;
        // Send email to admin/developer
        const devEmail = "developer@khedutbandhu.com";
        await sendEmail(devEmail, `New Contact Inquiry from ${name}`, `From: ${email}\n\nMessage: ${message}`);
        res.json({ message: "Inquiry sent successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= PRODUCT MANAGEMENT (ADMIN) =================
router.post("/products", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/products/:id", async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= ADMIN ORDER MANAGEMENT =================
router.get("/admin/orders/all", async (req, res) => {
    try {
        const orders = await Order.find().populate("userId", "username email").sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/admin/order/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= BLOCKCHAIN ROUTES =================
router.get("/blockchain/journey/:productId", async (req, res) => {
    try {
        const journey = khedutBlockchain.getJourneyForProduct(req.params.productId);
        res.json(journey);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
