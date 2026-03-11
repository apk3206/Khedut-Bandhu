const express = require('express');
const app = express();
const PORT = 5001; // Use a different port to avoid conflicts

console.log("Starting minimal diagnostic server...");

app.get('/test', (req, res) => {
    res.send('Backend is reachable!');
});

app.listen(PORT, () => {
    console.log(`Diagnostic server listening on port ${PORT}`);
}).on('error', (err) => {
    console.error("Error starting diagnostic server:", err.message);
});
