const mongoose = require("mongoose");

const marketRateSchema = new mongoose.Schema(
    {
        cropName: { type: String, required: true },
        rate: { type: Number, required: true }, // Current rate
        previousRate: { type: Number }, // Yesterday's rate
        state: { type: String, default: "Gujarat" },
        region: { type: String, default: "Central Gujarat" },
        marketName: { type: String, default: "APMC Main" },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.models.MarketRate || mongoose.model("MarketRate", marketRateSchema);
