const mongoose = require("mongoose");

const marketRateHistorySchema = new mongoose.Schema(
    {
        cropName: { type: String, required: true },
        price: { type: Number, required: true },
        region: { type: String, required: true }, // e.g., "Saurashtra", "Central Gujarat", "North Gujarat", "South Gujarat"
        state: { type: String, default: "Gujarat" },
        marketName: { type: String, default: "APMC Main" },
        date: { type: Date, default: Date.now }, // Historically indexed
    },
    { timestamps: true }
);

module.exports = mongoose.models.MarketRateHistory || mongoose.model("MarketRateHistory", marketRateHistorySchema);
