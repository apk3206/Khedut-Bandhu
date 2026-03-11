const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "react_project_091", ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/farmerdb";

const User = require("./react_project_091/models/User");
const Complaint = require("./react_project_091/models/complaint");
const MarketListing = require("./react_project_091/models/MarketListing");
const Product = require("./react_project_091/models/Product");

async function seed() {
    try {
        console.log("Connecting to:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Connected!");

        const user = await User.findOne({ role: "farmer" });
        if (!user) {
            console.log("No farmer found to associate complaints with. Please sign up a farmer first.");
            process.exit(1);
        }

        // Seed Complaints
        await Complaint.deleteMany({});
        await Complaint.insertMany([
            { userId: user._id, department: "Seed", subject: "Seed Quality", description: "The seeds are not germinating well.", status: "Pending" },
            { userId: user._id, department: "Pesticide", subject: "Expired Pesticide", description: "Received expired bottles.", status: "In Progress" },
            { userId: user._id, department: "MarketPrice", subject: "Price Update", description: "Market prices are not updated daily.", status: "Resolved" }
        ]);
        console.log("Seeded Complaints");

        // Seed Products if none exist
        const prodCount = await Product.countDocuments();
        if (prodCount === 0) {
            await Product.insertMany([
                { name: "Hybrid Wheat", category: "Seed", price: 1200, stock: 50, description: "High yield wheat seeds" },
                { name: "Organic Pesticide", category: "Pesticide", price: 800, stock: 30, description: "100% natural" }
            ]);
            console.log("Seeded Products");
        }

        console.log("Done!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

seed();
