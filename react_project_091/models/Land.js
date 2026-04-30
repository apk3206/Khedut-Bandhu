const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: Date },
    aadharNumber: { type: String, required: true }, // Encrypt in real app
    relation: { type: String, required: true }, // Relation to owner
});

const landSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // One land record per user for simplicity, or array in User
        },
        ownerName: { type: String, required: true },
        gender: { type: String, required: true },
        dob: { type: Date },
        aadharNumber: { type: String, required: true, unique: true },

        // Location
        state: { type: String, default: "Gujarat" },
        district: { type: String, required: true },
        taluka: { type: String },
        village: { type: String, required: true },
        city: { type: String }, // NEW
        address: { type: String }, // NEW
        pincode: { type: String }, // NEW

        // Land Info
        landNumber: { type: String }, // NEW
        surveyNumber: { type: String },
        area: { type: Number }, // in acres or guntha
        soilType: { type: String }, // e.g., Black, Red, Alluvial

        holders: [memberSchema], // Other holders
    },
    { timestamps: true }
);

module.exports = mongoose.models.Land || mongoose.model("Land", landSchema);
