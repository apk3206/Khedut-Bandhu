const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Get user profile
router.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user location
router.put("/location/:userId", async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        location: {
          latitude,
          longitude,
          address,
          lastUpdated: new Date()
        }
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Location updated", user });
  } catch (err) {
    console.error("Update location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user subsidies
router.get("/subsidies/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("subsidies");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ subsidies: user.subsidies });
  } catch (err) {
    console.error("Get subsidies error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add subsidy
router.post("/subsidies/:userId", async (req, res) => {
  try {
    const { schemeName, formLink } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.subsidies.push({
      schemeName,
      formLink,
      status: 'pending'
    });

    await user.save();
    res.json({ message: "Subsidy application added", subsidies: user.subsidies });
  } catch (err) {
    console.error("Add subsidy error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user orders
router.get("/orders/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("orders cart");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ orders: user.orders, cart: user.cart });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add to cart
router.post("/cart/:userId", async (req, res) => {
  try {
    const { name, type, quantity, price, image } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart.push({ name, type, quantity, price, image });
    await user.save();
    res.json({ message: "Item added to cart", cart: user.cart });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create order from cart
router.post("/orders/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const totalAmount = user.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const order = {
      orderId,
      items: user.cart.map(item => ({
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      totalAmount,
      status: 'pending'
    };

    user.orders.push(order);
    user.cart = [];
    await user.save();

    res.json({ message: "Order created", order });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user complaints
router.get("/complaints/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("complaints");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ complaints: user.complaints });
  } catch (err) {
    console.error("Get complaints error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add complaint
router.post("/complaints/:userId", async (req, res) => {
  try {
    const { subject, description } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const complaintId = `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    user.complaints.push({
      complaintId,
      subject,
      description,
      status: 'pending'
    });

    await user.save();
    res.json({ message: "Complaint submitted", complaints: user.complaints });
  } catch (err) {
    console.error("Add complaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

