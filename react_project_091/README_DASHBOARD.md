# Khedut 2.0 - Farmer Dashboard Application

## Overview
This is a comprehensive farmer application dashboard built with React and Node.js, designed for the Gujarat government's agriculture department (Khedut 2.0).

## Features

### Dashboard
- Beautiful hero section matching the official Khedut 2.0 design
- Gujarati language support
- Responsive design

### User Profile
- Personal information display (name, email, contact number)
- Live location tracking
- Subsidy information with dates (confirmation, approval, validation, renewal)
- Order management (pending orders and cart)
- Complaint status tracking

### Navigation Bar
- Subsidy/Schemes (with dropdown)
- Pesticide
- Seeds
- Today's Market Price
- Help
- Complaint

### Backend Features
- User authentication
- Subsidy management
- Order and cart management
- Complaint system
- Market price API
- Schemes management
- Location tracking

## Project Structure

```
react_project_091/
├── backend/
│   ├── models/
│   │   └── User.js          # User model with subsidies, orders, complaints
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── user.js          # User profile, orders, complaints routes
│   │   ├── market.js        # Market price routes
│   │   └── schemes.js       # Schemes routes
│   └── server.js            # Main server file
├── src/
│   ├── components/
│   │   ├── Dashboard.js     # Main dashboard component
│   │   ├── Navbar.js        # Navigation bar
│   │   ├── UserProfile.js   # User profile component
│   │   ├── Schemes.js      # Schemes page
│   │   ├── Pesticide.js     # Pesticide products
│   │   ├── Seeds.js         # Seed products
│   │   ├── MarketPrice.js   # Market prices
│   │   ├── Help.js          # Help page
│   │   └── Complaint.js     # Complaint form
│   ├── App.js               # Main app component
│   └── index.js             # React entry point
└── public/
    └── index.html           # HTML template
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```
MONGO_URI=mongodb://localhost:27017/khedut
PORT=3000
SESSION_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Start Backend Server

```bash
npm start
# or for development
npm run dev
```

### 4. Start React App (if using Create React App)

```bash
cd src
npm install
npm start
```

Or if you're using a build tool, build the React app:

```bash
npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### User
- `GET /api/user/profile/:userId` - Get user profile
- `PUT /api/user/location/:userId` - Update user location
- `GET /api/user/subsidies/:userId` - Get user subsidies
- `POST /api/user/subsidies/:userId` - Add subsidy application
- `GET /api/user/orders/:userId` - Get user orders and cart
- `POST /api/user/cart/:userId` - Add item to cart
- `POST /api/user/orders/:userId` - Create order from cart
- `GET /api/user/complaints/:userId` - Get user complaints
- `POST /api/user/complaints/:userId` - Submit complaint

### Market
- `GET /api/market/prices` - Get today's market prices

### Schemes
- `GET /api/schemes` - Get all available schemes

## Usage

1. **Login**: Users can login through the farmer login page
2. **Dashboard**: After login, users are redirected to the dashboard
3. **User Profile**: Click on "User Profile" in the navbar to view:
   - Personal information
   - Subsidy details with all dates
   - Pending orders
   - Cart items
   - Complaint status
4. **Navigation**: Use the navbar to navigate to different sections
5. **Location**: User's location is automatically tracked and displayed

## Technologies Used

- **Frontend**: React, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Authentication**: Passport.js, Google OAuth
- **Other**: bcryptjs, express-session

## Notes

- All backend files are organized in the `backend/` folder
- The dashboard design matches the official Khedut 2.0 website
- Location tracking uses browser's geolocation API
- All dates are displayed in a user-friendly format
- The application supports both English and Gujarati text

