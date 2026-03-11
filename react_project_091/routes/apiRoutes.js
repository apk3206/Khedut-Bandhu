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
const Feedback = require("../models/Feedback"); // Import Feedback Model
const sendEmail = require("../services/emailService"); // Import Email Service

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
router.post("/land", async (req, res) => {
    try {
        const { userId, ...landData } = req.body;
        let land = await Land.findOne({ userId });

        if (land) {
            // Update existing
            Object.assign(land, landData);
            await land.save();
        } else {
            // Create new
            land = new Land({ userId, ...landData });
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
router.get("/complaint/admin/all", async (req, res) => {
    try {
        const { role, department } = req.query;
        console.log(`[DEBUG] Fetching Complaints. Role: ${role}, Dept: ${department}`);

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
router.get("/admin/stats/supreme", async (req, res) => {
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
router.get("/admin/stats/dept/:department", async (req, res) => {
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

        const feedbacks = await Feedback.find(query).populate("userId", "username email");
        res.json(feedbacks);
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

        // 4. Market Price Trends (Line Chart - Last 6 months for ALL crops)
        const history = await MarketRateHistory.aggregate([
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        year: { $year: "$date" },
                        crop: { $toLower: "$cropName" }
                    },
                    avgPrice: { $avg: "$price" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trendData = [];
        const monthMap = {};

        history.forEach(h => {
            const key = `${months[h._id.month - 1]} ${h._id.year}`;
            if (!monthMap[key]) {
                monthMap[key] = { month: key };
                trendData.push(monthMap[key]);
            }
            // Normalize to CamelCase for frontend consistency
            const normalizedCrop = h._id.crop.charAt(0).toUpperCase() + h._id.crop.slice(1);
            monthMap[key][normalizedCrop] = Math.round(h.avgPrice);
        });

        res.json({
            topStats: {
                totalUsers,
                totalComplaints,
                activeListings,
                totalProducts
            },
            complaintStatus: complaintStatusData,
            salesVsStock: salesVsStock,
            trends: trendData.slice(-6)
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
router.post("/order", async (req, res) => {
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
router.put("/user/settings/:id", async (req, res) => {
    try {
        const { username, phone, password, newPassword } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ error: "User not found" });

        // Update basic info
        if (username) user.username = username;
        if (phone) user.phone = phone;

        // Update password if provided
        if (newPassword) {
            // Verify old password (optional but recommended, for now simplified)
            if (password) {
                const isMatch = await user.comparePassword(password);
                if (!isMatch) return res.status(400).json({ error: "Incorrect current password" });
            }
            user.password = newPassword; // Will be hashed by pre-save hook
        }

        await user.save();
        res.json({ message: "Profile updated successfully", user });
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
router.get("/users", async (req, res) => {
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

router.delete("/user/:id", async (req, res) => {
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
        // Mock live data if empty
        const count = await MarketRate.countDocuments();
        if (count === 0) {
            await MarketRate.insertMany([
                { cropName: "Wheat", rate: 2100, previousRate: 2050 },
                { cropName: "Rice", rate: 3200, previousRate: 3150 },
                { cropName: "Cotton", rate: 6500, previousRate: 6400 },
            ]);
        }
        const rates = await MarketRate.find().sort({ date: -1 });
        res.json(rates);
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

module.exports = router;
