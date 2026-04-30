// Centralized API configuration
// During development, it uses localhost:5000
// When deployed, you should replace 'YOUR_BACKEND_URL' with your actual deployed backend URL (e.g. on Render/Railway)

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://khedut-bandhu.onrender.com' // <-- Replace with your actual Render URL
    : 'http://localhost:5000';

export const RAZORPAY_KEY_ID = 'rzp_test_SVOnGNLqaV0p0O';
export default API_BASE_URL;
