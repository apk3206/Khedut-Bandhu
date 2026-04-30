const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../../models/User");
const Order = require("../../models/Order");
const sendEmail = require("../../services/emailService");

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
      status: 'Pending'
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

// Update cart (replace entire cart)
router.put("/cart/:userId", async (req, res) => {
  try {
    const { cart } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = cart;
    await user.save();
    res.json({ message: "Cart updated", cart: user.cart });
  } catch (err) {
    console.error("Update cart error:", err);
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

    const { paymentMethod, deliveryCharge, deliveryDetails, transactionId } = req.body;
    const subtotal = user.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = subtotal + (deliveryCharge || 0);
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
      paymentMethod: paymentMethod || 'COD',
      deliveryCharge: deliveryCharge || 0,
      deliveryDetails: deliveryDetails || {},
      status: 'Pending',
      transactionId: transactionId || null
    };

    user.orders.push(order);
    user.cart = [];
    
    // Create global order for Admin panel
    const globalOrder = new Order({
      userId: user._id,
      orderId: order.orderId,
      products: order.items.map(i => ({
         productId: new mongoose.Types.ObjectId(), // Placeholder since cart doesn't store ID
         quantity: i.quantity,
         priceAtPurchase: i.price
      })),
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      deliveryCharge: order.deliveryCharge,
      deliveryDetails: {
        address: order.deliveryDetails.address || 'N/A',
        pincode: order.deliveryDetails.pincode || 'N/A',
        alternatePhone: order.deliveryDetails.alternatePhone
      },
      status: 'Pending',
      transactionId: order.transactionId
    });
    await globalOrder.save();

    await user.save();

    res.json({ message: "Order created successfully", order });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel order
router.post("/orders/cancel/:userId/:orderId", async (req, res) => {
  const { userId, orderId } = req.params;
  console.log(`[DEBUG] Cancel Request: user=${userId}, order=${orderId}`);
  
  try {
    const { refundUpi } = req.body;

    // Validate if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log(`[DEBUG] Invalid UserId format: ${userId}`);
        return res.status(400).json({ message: "Invalid User ID format", error: "The provided User ID is not a valid MongoDB ObjectId." });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("[DEBUG] User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const order = user.orders.find(o => o.orderId === orderId);
    if (!order) {
      console.log("[DEBUG] Order not found in user orders");
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    console.log(`[DEBUG] Order found: status=${order.status}, method=${order.paymentMethod}`);

    // Logic for refund and cancellation fee
    let refundAmount = order.totalAmount;
    let cancellationFee = 0;

    if (order.paymentMethod !== 'COD') {
      cancellationFee = order.totalAmount * 0.05;
      refundAmount = order.totalAmount - cancellationFee;
      order.cancellationDetails = {
        fee: cancellationFee,
        refundAmount: refundAmount,
        refundStatus: 'Processing',
        refundETA: '10-15 minutes',
        userRefundUpi: refundUpi || 'Not provided'
      };
      console.log("[DEBUG] Cancellation details set for digital order");
    }

    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    
    // Explicitly mark orders array as modified for Mongoose
    user.markModified('orders');

    console.log("[DEBUG] Saving user document...");
    await user.save();
    console.log("[DEBUG] User saved successfully");

    // Sync with the global Order collection
    try {
        const globalOrder = await Order.findOneAndUpdate(
            { orderId: orderId },
            { 
              status: 'Cancelled', 
              cancellationDetails: order.cancellationDetails 
            },
            { new: true }
        );
        console.log("[DEBUG] Global Order Sync result:", globalOrder ? "Success" : "Not Found (Skipped)");
    } catch (syncErr) {
        console.error("[DEBUG] Global order sync error:", syncErr.message);
    }

    // Send Real-time notification to Admin for Refund
    if (order.paymentMethod !== 'COD' && order.cancellationDetails) {
        try {
            console.log("[DEBUG] Preparing admin notification...");
            const adminEmail = process.env.EMAIL_USER || "anshpat032@gmail.com";
            const refundUpiId = order.cancellationDetails.userRefundUpi;
            const refundAmt = order.cancellationDetails.refundAmount;
            
            const apiBase = process.env.API_BASE_URL || "http://localhost:5000";
            const processLink = `${apiBase}/api/user/orders/refund-process/${userId}/${orderId}`;
            
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
                    <h2 style="color: #d9534f; border-bottom: 2px solid #d9534f; padding-bottom: 10px;">🚨 New Refund Request</h2>
                    <p>Hello Admin,</p>
                    <p>An order has been cancelled and requires a manual refund. You can now use the button below to process it automatically.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Order ID:</strong> #${order.orderId}</p>
                        <p><strong>Customer:</strong> ${user.username} (${user.email})</p>
                        <p><strong>Total Paid:</strong> ₹${order.totalAmount}</p>
                        <p><strong>Handling Fee (5%):</strong> ₹${cancellationFee.toFixed(2)}</p>
                        <p style="font-size: 20px; color: #28a745; margin-top: 10px;"><strong>Refund Amount: ₹${refundAmt.toFixed(2)}</strong></p>
                        <p><strong>Refund to UPI ID:</strong> <code style="background: #eee; padding: 2px 5px; border-radius: 3px;">${refundUpiId}</code></p>
                    </div>

                    <div style="margin-top: 30px; text-align: center;">
                        <a href="${processLink}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            Pay/Refund Now via UPI App
                        </a>
                        <p style="color: #666; font-size: 12px; margin-top: 15px;">Clicking this button will automatically mark the order as "Refunded" and open your UPI app.</p>
                    </div>
                </div>
            `;

            console.log("[DEBUG] Sending email to admin...");
            await sendEmail(adminEmail, `Refund Request: Order #${order.orderId}`, emailHtml);
        } catch (emailErr) {
            console.error("[DEBUG] Admin notification failed:", emailErr.message);
        }
    }

    return res.json({ 
      message: "Order cancelled successfully", 
      order,
      refundInfo: order.paymentMethod !== 'COD' ? {
        fee: cancellationFee.toFixed(2),
        refund: refundAmount.toFixed(2),
        eta: '10-15 minutes'
      } : null
    });
  } catch (err) {
    console.error("❌ Final Order cancellation error:", err);
    return res.status(500).json({ message: "Server error during cancellation", error: err.message });
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
      status: 'Pending'
    });

    await user.save();
    res.json({ message: "Complaint submitted", complaints: user.complaints });
  } catch (err) {
    console.error("Add complaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= AUTOMATED REFUND PROCESS =================
router.get("/orders/refund-process/:userId/:orderId", async (req, res) => {
    try {
        const { userId, orderId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).send("User not found");

        const order = user.orders.find(o => o.orderId === orderId);
        if (!order) return res.status(404).send("Order not found");

        // 1. Update status in User document
        order.cancellationDetails.refundStatus = "Refunded";
        user.markModified('orders');
        await user.save();

        // 2. Update status in Global Order collection
        await Order.findOneAndUpdate(
            { orderId: orderId },
            { "cancellationDetails.refundStatus": "Refunded" }
        );

        const refundUpiId = order.cancellationDetails.userRefundUpi;
        const refundAmt = order.cancellationDetails.refundAmount;
        const upiPayLink = `upi://pay?pa=${refundUpiId}&pn=${encodeURIComponent(user.username)}&am=${refundAmt.toFixed(2)}&cu=INR`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayLink)}`;

        // Render Professional Response Page
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Process Refund - Khedut Bandhu</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                    .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; }
                    .success-icon { font-size: 50px; color: #28a745; margin-bottom: 20px; }
                    h2 { color: #333; margin-bottom: 10px; }
                    p { color: #666; margin-bottom: 25px; }
                    .qr-box { background: #f8f9fa; padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 1px dashed #ccc; }
                    .amount { font-size: 24px; font-weight: bold; color: #28a745; margin-bottom: 15px; }
                    .upi-id { font-family: monospace; background: #eee; padding: 5px 10px; border-radius: 5px; font-size: 14px; }
                    .pay-btn { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; width: 100%; box-sizing: border-box; transition: background 0.3s; }
                    .pay-btn:hover { background: #218838; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="success-icon">✅</div>
                    <h2>Status Updated!</h2>
                    <p>Order <strong>#${orderId}</strong> has been marked as <strong>Refunded</strong> in the system.</p>
                    
                    <div class="qr-box">
                        <div class="amount">₹${refundAmt.toFixed(2)}</div>
                        <img src="${qrCodeUrl}" alt="UPI QR Code" style="width: 200px; height: 200px; margin-bottom: 15px;">
                        <div>To: <span class="upi-id">${refundUpiId}</span></div>
                    </div>

                    <a href="${upiPayLink}" class="pay-btn">Open UPI App to Pay</a>
                    <p style="font-size: 12px; margin-top: 15px; color: #999;">Scan the QR code or click the button above to complete the payment.</p>
                </div>
            </body>
            </html>
        `;

        res.send(html);

    } catch (err) {
        console.error("Refund process error:", err);
        res.status(500).send("An error occurred during refund processing.");
    }
});

module.exports = router;

