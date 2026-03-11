const mongoose = require("mongoose");
const uri = "mongodb://127.0.0.1:27017/farmerdb";
console.log("Connecting to:", uri);
mongoose.connect(uri)
    .then(() => {
        console.log("Connected!");
        process.exit(0);
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
setTimeout(() => {
    console.log("Timeout reached");
    process.exit(1);
}, 5000);
