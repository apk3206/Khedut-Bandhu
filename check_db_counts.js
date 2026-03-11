const mongoose = require("mongoose");
require("dotenv").config({ path: "./react_project_091/.env" });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/khedut_bandhu_db";

const checkDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const User = require("./react_project_091/models/User");
        const Complaint = require("./react_project_091/models/complaint");
        const MarketListing = require("./react_project_091/models/MarketListing");
        const Product = require("./react_project_091/models/Product");

        const users = await User.countDocuments();
        const complaints = await Complaint.countDocuments();
        const listings = await MarketListing.countDocuments({ status: "Available" });
        const products = await Product.countDocuments();

        console.log("--- DB COUNTS ---");
        console.log("Total Users:", users);
        console.log("Total Complaints:", complaints);
        console.log("Active Listings:", listings);
        console.log("Total Products:", products);

        const depts = await Complaint.distinct("department");
        console.log("Complaint Departments in DB:", depts);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
