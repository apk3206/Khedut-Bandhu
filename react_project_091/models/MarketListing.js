const mongoose = require("mongoose");

const marketListingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String }, // Snapshot of farmer name
    cropName: { type: String, required: true },
    quantity: { type: Number, required: true }, // in kg or quintal
    unit: { type: String, default: "Quintal" },
    expectedPrice: { type: Number, required: true }, // Per unit
    description: { type: String },
    location: {
        village: String,
        district: String
    },
    status: {
        type: String,
        enum: ["Available", "Sold", "Cancelled"],
        default: "Available"
    },
    contactPhone: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("MarketListing", marketListingSchema);
