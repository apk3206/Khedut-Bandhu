const mongoose = require("mongoose");

const schemeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    benefits: { type: String }, // What user gets
    eligibility: { type: String }, // Criteria
    department: {
        type: String,
        enum: ["Pesticide", "MarketPrice", "Seed", "Subsidy", "Help"],
        required: true
    },
    link: { type: String }, // External link if any
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Scheme", schemeSchema);
