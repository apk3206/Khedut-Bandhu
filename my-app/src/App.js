import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./i18n"; // Import i18n config
import Login from "./components/Login";
import Signup from "./components/Signup";
import FarmerDashboard from "./components/FarmerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import BuyerDashboard from "./components/BuyerDashboard";
import Navbar from "./components/Navbar";
import Pesticide from "./Pesticide"; // Import Pesticide
import Schemes from "./Schemes"; // Import Schemes
import MarketPlace from "./components/MarketPlace"; // Import MarketPlace
import Contact from "./components/Contact"; // Import Contact
import UserProfile from "./UserProfile"; // Import UserProfile
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <Navbar user={user} setUser={setUser} />
        <Routes>
          <Route path="/" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard/farmer"
            element={user && user.role === "farmer" ? <FarmerDashboard user={user} /> : <Navigate to="/" />}
          />
          <Route
            path="/dashboard/admin"
            element={user && (user.role === "admin" || user.role === "dept_admin") ? <AdminDashboard user={user} /> : <Navigate to="/" />}
          />
          <Route
            path="/dashboard/buyer"
            element={user && user.role === "buyer" ? <BuyerDashboard user={user} /> : <Navigate to="/" />}
          />
          <Route path="/pesticide" element={<Pesticide user={user} />} />
          <Route path="/schemes" element={<Schemes user={user} />} />
          <Route path="/market" element={<MarketPlace user={user} />} />
          <Route path="/help" element={<Contact />} />
          <Route path="/complaint" element={user ? <FarmerDashboard user={user} activeTab="complaints" /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <UserProfile user={user} /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
