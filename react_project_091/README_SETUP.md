# Farmer Login/Signup Setup Guide

## Prerequisites
- Node.js installed
- MongoDB installed and running (or MongoDB Atlas account)
- Google Cloud Console account (for Google OAuth)

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up MongoDB

**Option A: Local MongoDB**
- Make sure MongoDB is running on your system
- Default connection: `mongodb://localhost:27017/khedutbandhu`

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at https://www.mongodb.com/cloud/atlas
- Create a cluster and get your connection string
- Replace the MONGO_URI in .env file

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - User Type: External (for testing) or Internal
   - Add your email to test users
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
7. Copy the Client ID and Client Secret

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

2. Edit `.env` file and fill in your values:
```
MONGO_URI=your-mongodb-connection-string
PORT=3000
SESSION_SECRET=your-random-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. Run the Server

```bash
npm run server
```

The server will start on `http://localhost:3000`

### 6. Access the Application

- Login Page: `http://localhost:3000/farmerlogin.html`
- Signup Page: `http://localhost:3000/farmersignup.html`

## Features

✅ User Signup with username, email, phone, and password
✅ User Login with username/email and password
✅ Password validation and hashing
✅ Google OAuth Signup/Login
✅ Database validation for duplicate users
✅ Error messages for invalid credentials
✅ MongoDB integration

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

## Troubleshooting

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify MONGO_URI in .env file
   - Check firewall settings

2. **Google OAuth Not Working**
   - Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   - Check redirect URI matches exactly: `http://localhost:3000/api/auth/google/callback`
   - Ensure Google+ API is enabled

3. **Port Already in Use**
   - Change PORT in .env file
   - Or stop the process using port 3000

## Notes

- Passwords are hashed using bcrypt before storing in database
- Google OAuth users don't need a password
- Username, email, and phone must be unique
- All fields are required for signup (except password for Google users)

