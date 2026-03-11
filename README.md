# Khedut Bandhu (Farmer's Friend)

Khedut Bandhu is a digital platform designed to support farmers by providing direct access to market prices, a marketplace for crops and agricultural products, and a streamlined complaint resolution system.

## Project Structure

This is a monorepo containing both the frontend and backend of the application:

- `my-app/`: React-based frontend application.
- `react_project_091/`: Node.js/Express backend API.

## Features

- **Market Price Tracker**: Real-time updates on crop rates.
- **Agricultural Marketplace**: Buy and sell seeds, pesticides, tools, and crops.
- **Complaint Management**: Automated routing of user issues to relevant departments.
- **Admin Dashboard**: Comprehensive statistics and data visualization for admins and department heads.
- **Subsidy Portal**: Digital application and tracking for government subsidies.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/apk3206/Khedut-Bandhu.git
   cd Khedut-Bandhu
   ```

2. **Setup Backend**:
   ```bash
   cd react_project_091
   npm install
   # Create a .env file and add your MONGODB_URI
   npm start
   ```

3. **Setup Frontend**:
   ```bash
   cd ../my-app
   npm install
   npm start
   ```

## Tech Stack

- **Frontend**: React, CSS, Mermaid (for diagrams)
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **Communication**: Multer (File uploads), AI-assisted routing (Complaints)

## Documentation

For a detailed technical report, including diagrams and data schemas, see the `website_report.md` (generated locally in the brain directory).
