const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: String,
      enum: ["Pesticide", "MarketPrice", "Seed", "Subsidy", "Help", "Orders", "Other"],
      required: true,
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    mediaUrl: { type: String }, // Path to uploaded image/video

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    adminResponse: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);
