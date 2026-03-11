const mongoose = require("mongoose");
require("dotenv").config({ path: "./react_project_091/.env" });

// USE THE SAME URI AS THE SERVER
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/farmerdb";

const checkUsers = async () => {
    try {
        console.log("Connecting to:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const User = require("./react_project_091/models/User");
        const admins = await User.find({ role: { $in: ["admin", "dept_admin"] } }, "username role department");
        console.log("--- ADMIN USERS ---");
        console.log(JSON.stringify(admins, null, 2));

        const MarketListing = require("./react_project_091/models/MarketListing");
        const listingsCount = await MarketListing.countDocuments({ status: "Available" });
        console.log("Active Listings Count:", listingsCount);

        const Product = require("./react_project_091/models/Product");
        const productsCount = await Product.countDocuments();
        console.log("Total Products Count:", productsCount);

        const Complaint = require("./react_project_091/models/complaint");
        const complaintsCount = await Complaint.countDocuments();
        console.log("Total Complaints Count:", complaintsCount);

        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
};

checkUsers();
