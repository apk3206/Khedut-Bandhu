// Centralized API configuration
// During development, it uses localhost:5000
// When deployed, you should replace 'YOUR_BACKEND_URL' with your actual deployed backend URL (e.g. on Render/Railway)

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://your-backend-api.onrender.com' // REPLACE THIS with your deployed backend URL
    : 'http://localhost:5000';

export default API_BASE_URL;
