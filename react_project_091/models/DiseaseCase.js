const mongoose = require("mongoose");

const DiseaseCaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cropName: { type: String, required: true },
    imageUrl: { type: String, required: true },
    diagnosedDisease: { type: String },
    confidence: { type: Number },
    userFeedback: { 
        isCorrect: { type: Boolean },
        actualDisease: { type: String }
    },
    metadata: {
        location: { type: String },
        device: { type: String },
        timestamp: { type: Date, default: Date.now }
    },
    isTrainingReady: { type: Boolean, default: false } // Flag for manual labeling
});

module.exports = mongoose.model("DiseaseCase", DiseaseCaseSchema);
