const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        category: {
            type: String,
            enum: ["Seed", "Pesticide", "Tool", "Other"],
            required: true,
        },
        price: { type: Number, required: true },
        description: { type: String },
        imageUrl: { type: String },
        stock: { type: Number, default: 0 },

        // --- Detailed Pesticide Info ---
        type: { type: String }, // e.g., Insecticide, Herbicide
        usedFor: [{ type: String }], // e.g., Termites, Aphids
        crops: [{ type: String }], // e.g., Cotton, Rice
        usageSteps: [{ type: String }], // Step-by-step instructions
        safetyInstructions: [{ type: String }], // Safety warnings

        // --- Review System ---
        reviews: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                username: String,
                rating: { type: Number, required: true, min: 1, max: 5 },
                comment: String,
                createdAt: { type: Date, default: Date.now }
            }
        ],
        averageRating: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 }
    },
    { timestamps: true }
);

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
