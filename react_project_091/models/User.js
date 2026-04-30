const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const subsidySchema = new mongoose.Schema({
  schemeName: { type: String, required: true },
  confirmationDate: { type: Date },
  approvalDate: { type: Date },
  validationDate: { type: Date },
  renewalDate: { type: Date },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Validated'], default: 'Pending' },
  formLink: { type: String }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    type: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    image: { type: String }
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'COD' },
  deliveryCharge: { type: Number, default: 0 },
  deliveryDetails: {
    address: String,
    pincode: String,
    alternatePhone: String,
    locationCoordinates: {
      lat: Number,
      lng: Number
    }
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'], 
    default: 'Pending' 
  },
  transactionId: { type: String },
  cancelledAt: { type: Date },
  cancellationDetails: {
    fee: Number,
    refundAmount: Number,
    refundStatus: String,
    refundETA: String,
    userRefundUpi: String
  },
  orderDate: { type: Date, default: Date.now }
}, { timestamps: true });

const cartItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  image: { type: String }
}, { timestamps: true });

const embedComplaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'], default: 'Pending' },
  submittedDate: { type: Date, default: Date.now },
  resolutionDate: { type: Date }
}, { timestamps: true });

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String },
  lastUpdated: { type: Date, default: Date.now }
});

const bankDetailsSchema = new mongoose.Schema({
  accountNumber: { type: String, trim: true },
  ifscCode: { type: String, trim: true },
  bankName: { type: String, trim: true },
  accountHolderName: { type: String, trim: true },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["farmer", "admin", "dept_admin", "buyer"],
      default: "farmer",
    },
    department: {
      type: String,
      enum: ["Pesticide", "MarketPrice", "Seed", "Subsidy", "Help", "Orders", null],
      default: null,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    landDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Land",
    },
    // Merged from backend/models/User.js
    location: locationSchema,
    subsidies: [subsidySchema],
    orders: [orderSchema],
    cart: [cartItemSchema],
    complaints: [embedComplaintSchema],
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// ✅ ASYNC PRE-SAVE
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// ✅ PASSWORD COMPARE
userSchema.methods.comparePassword = function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
