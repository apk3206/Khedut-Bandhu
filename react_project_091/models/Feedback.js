const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["General", "Department-wise"],
            required: true,
        },
        department: {
            type: String,
            enum: ["Pesticide", "MarketPrice", "Seed", "Subsidy", "Help", "Orders", "Other"],
            required: function () { return this.type === "Department-wise"; }
        },
        subject: { type: String, required: true },
        description: { type: String, required: true },
        mediaUrl: { type: String }, // Path to uploaded image/video
        status: {
            type: String,
            enum: ["Pending", "Reviewed", "Addressed"],
            default: "Pending",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
