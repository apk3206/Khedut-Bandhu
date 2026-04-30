const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orderId: {
            type: String,
            required: true,
            unique: true
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: { type: Number, required: true, default: 1 },
                priceAtPurchase: { type: Number, required: true },
            },
        ],
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ["Pending", "Shipped", "Delivered", "Cancelled", "pending", "shipped", "delivered", "cancelled"],
            default: "Pending",
        },
        deliveryDetails: {
            address: { type: String, required: true },
            pincode: { type: String, required: true },
            alternatePhone: { type: String },
            locationCoordinates: {
                lat: Number,
                lng: Number
            }
        },
        paymentMethod: {
            type: String,
            enum: ["COD", "UPI", "Netbanking", "Card"],
            required: true
        },
        cancellationDetails: {
            fee: Number,
            refundAmount: Number,
            refundStatus: String,
            refundETA: String,
            userRefundUpi: String
        },
        transactionId: String,
        deliveryCharge: { type: Number, default: 0 },
        isTermsAccepted: { type: Boolean, required: true, default: true },
        expectedDeliveryDate: { type: Date }
    },
    { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
