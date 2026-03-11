const mongoose = require("mongoose");

const marketRateHistorySchema = new mongoose.Schema(
    {
        cropName: { type: String, required: true },
        price: { type: Number, required: true },
        region: { type: String, required: true }, // e.g., "Saurashtra", "Central Gujarat", "North Gujarat", "South Gujarat"
        marketName: { type: String, default: "APMC Main" },
        date: { type: Date, required: true }, // Historically indexed
    },
    { timestamps: true }
);

module.exports = mongoose.models.MarketRateHistory || mongoose.model("MarketRateHistory", marketRateHistorySchema);
