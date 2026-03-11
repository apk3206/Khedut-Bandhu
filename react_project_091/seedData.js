const mongoose = require("mongoose");
require("dotenv").config();
const MarketRateHistory = require("./models/MarketRateHistory");
const MarketRate = require("./models/MarketRate");
const Product = require("./models/Product");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/farmerdb";

const regions = ["Saurashtra", "Central Gujarat", "North Gujarat", "South Gujarat"];
const crops = ["Wheat", "Rice", "Cotton", "Groundnut", "Mustard"];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // 1. Clear existing history and current rates (Optional, for demo)
        await MarketRateHistory.deleteMany({});
        await MarketRate.deleteMany({});

        // 2. Generate 6 months of historical data
        const historyData = [];
        const now = new Date();

        for (let i = 0; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

            crops.forEach(crop => {
                regions.forEach(region => {
                    // Random realistic price fluctuations
                    const basePrice = crop === "Wheat" ? 2100 : crop === "Rice" ? 3000 : crop === "Cotton" ? 6000 : 4000;
                    const randomVariation = Math.floor(Math.random() * 500) - 250;

                    historyData.push({
                        cropName: crop,
                        price: basePrice + randomVariation,
                        region: region,
                        date: date
                    });
                });
            });
        }

        await MarketRateHistory.insertMany(historyData);
        console.log(`✅ Seeded ${historyData.length} records into MarketRateHistory`);

        // 3. Generate Current Rates
        const currentRates = crops.flatMap(crop =>
            regions.map(region => ({
                cropName: crop,
                rate: (crop === "Wheat" ? 2200 : 4000) + Math.floor(Math.random() * 200),
                previousRate: (crop === "Wheat" ? 2150 : 3900),
                region: region
            }))
        );
        await MarketRate.insertMany(currentRates);
        console.log(`✅ Seeded ${currentRates.length} records into MarketRate`);

        // 4. Ensure some Pesticides/Seeds exist for focus crops
        const focusCrops = ["Wheat", "Cotton", "Cumin", "Groundnut", "Castor"];
        const productsData = [];
        focusCrops.forEach(crop => {
            productsData.push({
                name: `${crop} Focus Seed`,
                category: "Seed",
                price: Math.floor(Math.random() * 2000) + 500,
                stock: Math.floor(Math.random() * 8000) + 2000
            });
            productsData.push({
                name: `${crop} Defense Pesticide`,
                category: "Pesticide",
                price: Math.floor(Math.random() * 1500) + 300,
                stock: Math.floor(Math.random() * 6000) + 1500,
                type: "Insecticide"
            });
        });

        // --- GARDEN TOOLS (NEW) ---
        const gardenTools = [
            { name: "Ceramic Flower Pot (Medium)", category: "Tool", price: 450, stock: 50, description: "High-quality ceramic pot for indoor and outdoor gardening.", imageUrl: "/products/pot.png" },
            { name: "Gardening Scissors (Steel)", category: "Tool", price: 299, stock: 100, description: "Sharp steel scissors for pruning and cutting plants.", imageUrl: "/products/scissors.png" },
            { name: "Watering Can (5L)", category: "Tool", price: 350, stock: 75, description: "Durable plastic watering can with a rose spray head.", imageUrl: "/products/watering_can.png" },
            { name: "Hand Trowel", category: "Tool", price: 150, stock: 120, description: "Essential tool for digging and planting.", imageUrl: "/products/trowel.png" }
        ];
        productsData.push(...gardenTools);

        await Product.insertMany(productsData);
        console.log("✅ Seeded products for focus crops and garden tools");

        // 5. Seed diverse complaints
        const User = require("./models/User");
        const aUser = await User.findOne({ role: "farmer" });
        if (aUser) {
            const complaintData = [
                { userId: aUser._id, department: "Seed", subject: "Bad Germination", description: "The seeds did not sprout.", status: "Pending" },
                { userId: aUser._id, department: "Pesticide", subject: "Effectiveness issue", description: "Not working on aphids.", status: "In Progress" },
                { userId: aUser._id, department: "MarketPrice", subject: "Rate mismatch", description: "Market rate is lower than listed.", status: "Resolved" },
                { userId: aUser._id, department: "Help", subject: "App crash", description: "Dashboard not loading.", status: "Rejected" },
                { userId: aUser._id, department: "Seed", subject: "Delayed delivery", description: "Seed bag late.", status: "Pending" }
            ];
            await require("./models/complaint").insertMany(complaintData);
            console.log("✅ Seeded diverse complaints");
        }

        console.log("🚀 Seeding Completed Successfully!");
        process.exit();
    } catch (err) {
        console.error("❌ Seeding Failed:", err);
        process.exit(1);
    }
}

seed();
