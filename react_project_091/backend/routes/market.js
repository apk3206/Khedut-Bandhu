const express = require("express");
const router = express.Router();

// Get today's market prices
router.get("/prices", async (req, res) => {
  try {
    // Sample market price data - in production, this would come from a database or external API
    const marketPrices = [
      { crop: "ઘઉં (Wheat)", price: 2100, unit: "Quintal", change: "+2.5%" },
      { crop: "બાજરી (Bajra)", price: 1850, unit: "Quintal", change: "+1.8%" },
      { crop: "જુવાર (Jowar)", price: 1950, unit: "Quintal", change: "-0.5%" },
      { crop: "મગફળી (Groundnut)", price: 6200, unit: "Quintal", change: "+3.2%" },
      { crop: "કપાસ (Cotton)", price: 7500, unit: "Quintal", change: "+1.2%" },
      { crop: "ડાંગર (Rice)", price: 2400, unit: "Quintal", change: "+0.8%" },
      { crop: "ચણા (Chickpea)", price: 5200, unit: "Quintal", change: "-1.2%" },
      { crop: "ટુમેટાં (Tomato)", price: 35, unit: "Kg", change: "+5.5%" },
    ];

    res.json({ prices: marketPrices, date: new Date().toISOString() });
  } catch (err) {
    console.error("Get market prices error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

