const express = require("express");
const router = express.Router();

// Get all available schemes
router.get("/", async (req, res) => {
  try {
    // Sample schemes data - in production, this would come from a database
    const schemes = [
      {
        id: 1,
        name: "પ્રધાનમંત્રી કિસાન સમ્માન નિધિ (PM-KISAN)",
        description: "વાર્ષિક ₹6,000 ની આર્થિક સહાય",
        formLink: "/forms/pm-kisan",
        category: "Financial Support"
      },
      {
        id: 2,
        name: "પ્રધાનમંત્રી ફસલ બીમા યોજના (PMFBY)",
        description: "ફસલ નુકશાન સામે બીમા",
        formLink: "/forms/pmfby",
        category: "Insurance"
      },
      {
        id: 3,
        name: "કિસાન ક્રેડિટ કાર્ડ (KCC)",
        description: "કૃષિ લોન માટે ક્રેડિટ કાર્ડ",
        formLink: "/forms/kcc",
        category: "Credit"
      },
      {
        id: 4,
        name: "સોલાર પંપ સબસિડી",
        description: "સોલાર પંપ માટે સબસિડી",
        formLink: "/forms/solar-pump",
        category: "Equipment"
      },
      {
        id: 5,
        name: "ડ્રિપ ઇરિગેશન સબસિડી",
        description: "ડ્રિપ ઇરિગેશન સિસ્ટમ માટે સહાય",
        formLink: "/forms/drip-irrigation",
        category: "Equipment"
      },
      {
        id: 6,
        name: "ખાતર સબસિડી",
        description: "ઓર્ગેનિક ખાતર માટે સહાય",
        formLink: "/forms/fertilizer",
        category: "Input"
      },
      {
        id: 7,
        name: "બીજ સબસિડી",
        description: "ગુણવત્તાપૂર્ણ બીજ માટે સહાય",
        formLink: "/forms/seeds",
        category: "Input"
      },
      {
        id: 8,
        name: "ટ્રેક્ટર સબસિડી",
        description: "ટ્રેક્ટર ખરીદી માટે સહાય",
        formLink: "/forms/tractor",
        category: "Equipment"
      }
    ];

    res.json({ schemes });
  } catch (err) {
    console.error("Get schemes error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

