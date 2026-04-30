const express = require("express");
const router = express.Router();
const isAdmin = require("../middleware/isAdmin");

const User = require("../models/User");
const Complaint = require("../models/complaint"); // Fixed lowercase
const MarketRateHistory = require("../models/MarketRateHistory");
const MarketListing = require("../models/MarketListing");
const Product = require("../models/Product");
const Order = require("../models/Order");
const MarketRate = require("../models/MarketRate");

// 📊 CONSOLIDATED STATS LOGIC
const getFullStats = async (filter = {}) => {
  console.log("[DEBUG] getFullStats called with filter:", JSON.stringify(filter));
  try {
    const totalUsers = await User.countDocuments();
    const farmerCount = await User.countDocuments({ role: "farmer" });

    // Build filter query for complaints and products
    let queryFilter = {};
    if (filter.department) {
      queryFilter = { department: { $regex: new RegExp(`^${filter.department}$`, "i") } };
    }

    const totalComplaints = await Complaint.countDocuments(queryFilter);
    const activeListings = await MarketListing.countDocuments({ status: "Available" });
    const totalProducts = await Product.countDocuments(filter.department ? { category: { $regex: new RegExp(`^${filter.department}$`, "i") } } : {});

    console.log(`[DEBUG] Counts: Users=${totalUsers}, Farmers=${farmerCount}, Complaints=${totalComplaints}, Listings=${activeListings}, Products=${totalProducts}`);

    // Complaint Status Distribution
    const complaintAggregation = await Complaint.aggregate([
      { $match: queryFilter },
      { $group: { _id: "$status", value: { $sum: 1 } } }
    ]);
    const statusMap = { "Pending": 0, "In Progress": 0, "Resolved": 0, "Rejected": 0 };
    complaintAggregation.forEach(s => statusMap[s._id] = s.value);
    const complaintStatusData = Object.keys(statusMap).map(status => ({ name: status, value: statusMap[status] }));

    // Product Sales vs Stock
    const productsOfFocus = filter.department ? [filter.department] : ["Wheat", "Cotton", "Cumin", "Groundnut", "Castor"];
    const salesVsStock = [];
    for (const crop of productsOfFocus) {
      const products = await Product.find({
        $or: [
          { name: { $regex: crop, $options: "i" } },
          { category: crop }
        ]
      });
      const productIds = products.map(p => p._id);
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      const orderAggregation = await Order.aggregate([
        { $unwind: "$products" },
        { $match: { "products.productId": { $in: productIds } } },
        { $group: { _id: null, totalSales: { $sum: "$products.quantity" } } }
      ]);
      const totalSales = orderAggregation.length > 0 ? orderAggregation[0].totalSales : 0;

      if (products.length > 0 || !filter.department) {
        salesVsStock.push({ name: crop, Stock: totalStock, Sales: totalSales });
      }
    }

    // Market Price Trends
    const history = await MarketRateHistory.aggregate([
      { $group: { _id: { month: { $month: "$date" }, year: { $year: "$date" }, crop: { $toLower: "$cropName" } }, avgPrice: { $avg: "$price" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendData = [];
    const monthMap = {};
    history.forEach(h => {
      const key = `${months[h._id.month - 1]} ${h._id.year}`;
      if (!monthMap[key]) {
        monthMap[key] = { month: key };
        trendData.push(monthMap[key]);
      }
      const normalizedCrop = h._id.crop.charAt(0).toUpperCase() + h._id.crop.slice(1);
      monthMap[key][normalizedCrop] = Math.round(h.avgPrice);
    });

    return {
      topStats: {
        totalUsers,
        totalComplaints,
        activeListings,
        totalProducts,
        farmers: farmerCount
      },
      users: totalUsers,
      farmers: farmerCount,
      complaints: {
        total: totalComplaints,
        pending: statusMap["Pending"],
        resolved: statusMap["Resolved"]
      },
      activeListings,
      products: totalProducts,
      complaintStatus: complaintStatusData,
      salesVsStock,
      trends: trendData.slice(-6)
    };
  } catch (err) {
    console.error("[DEBUG] getFullStats ERROR:", err);
    throw err;
  }
};

// 🔐 GET ALL USERS
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📄 GET ALL COMPLAINTS
router.get("/complaints", isAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find().populate("userId", "username email");
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE COMPLAINT STATUS
router.put("/complaint/:id", isAdmin, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    await Complaint.findByIdAndUpdate(req.params.id, { status, adminResponse });
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📊 DASHBOARD STATISTICS (Supreme Admin)
router.get("/stats/supreme", isAdmin, async (req, res) => {
  try {
    const stats = await getFullStats();
    res.json(stats);
  } catch (err) {
    console.error("Supreme Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📊 DEPARTMENT STATISTICS (Dept Admin)
router.get("/stats/dept/:dataset", isAdmin, async (req, res) => {
  try {
    const dept = req.params.dataset;
    // For Dept Admin, provide full structure but filtered if possible
    const stats = await getFullStats({ department: dept });
    res.json(stats);
  } catch (err) {
    console.error("Dept Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📦 GET ALL ORDERS
router.get("/orders/all", isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("userId", "username email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔄 UPDATE ORDER STATUS (Global)
router.put("/order/:orderId/status", isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { status },
      { new: true }
    );
    
    // Also sync back to User's nested orders for consistency
    if (order) {
        await User.updateOne(
          { _id: order.userId, "orders.orderId": order.orderId },
          { $set: { "orders.$.status": status } }
        );
    }
    
    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
