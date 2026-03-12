const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.join(__dirname, "react_project_091", ".env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI || MONGO_URI.includes("<db_password>")) {
    console.error("❌ Error: MONGO_URI is missing or contains <db_password> placeholder.");
    process.exit(1);
}

const User = require("./react_project_091/models/User");

const seedUsers = async () => {
    try {
        console.log("Connecting to Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB Atlas");

        const hashedPassword = await bcrypt.hash("anshpat032006", 10);

        const users = [
            {
                username: "anshpat032",
                email: "anshpat032@gmail.com",
                password: hashedPassword,
                role: "admin",
                phone: "1234567890"
            },
            {
                username: "marketplace",
                email: "market@example.com",
                password: hashedPassword,
                role: "farmer",
                phone: "9876543210"
            }
        ];

        for (const userData of users) {
            const existing = await User.findOne({ username: userData.username });
            if (!existing) {
                await User.create(userData);
                console.log(`✅ Created user: ${userData.username} (${userData.role})`);
            } else {
                console.log(`ℹ️ User already exists: ${userData.username}`);
            }
        }

        console.log("🚀 User Seeding Finished!");
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR:", err);
        process.exit(1);
    }
};

seedUsers();
