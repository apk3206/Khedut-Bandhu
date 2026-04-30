let GoogleGenerativeAI;
try {
    GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
} catch (e) {
    console.warn("⚠️ @google/generative-ai module not found. AI features are disabled.");
}

require("dotenv").config();

/**
 * Validates a complaint and determines the best department.
 * @param {string} subject 
 * @param {string} description 
 * @returns {Promise<{isProper: boolean, department: string, message: string}>}
 */
const validateAndClassifyComplaint = async (subject, description) => {
    if (!GoogleGenerativeAI) {
        return { isProper: true, department: "Help", message: "AI validation disabled (module missing)" };
    }

    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
            console.warn("GEMINI_API_KEY is not set. Skipping AI validation.");
            return { isProper: true, department: "Help", message: "AI validation skipped (no API key)" };
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Analyze the following complaint from a farmer/user:
        Subject: "${subject}"
        Description: "${description}"

        Tasks:
        1. Determine if the complaint is "proper". A complaint is NOT proper if it is gibberish (e.g., "bibsibgingding"), contains no meaningful information, or is just random characters.
        2. If proper, determine which of the following departments it belongs to: ["Pesticide", "MarketPrice", "Seed", "Subsidy", "Help"].
        
        Respond ONLY in JSON format like this:
        {
            "isProper": true,
            "department": "DepartmentName"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return { isProper: true, department: "Help", message: "AI response format error" };
    } catch (error) {
        console.error("AI Service Error:", error);
        return { isProper: true, department: "Help", message: "AI Service Unavailable" };
    }
};

module.exports = { validateAndClassifyComplaint };
