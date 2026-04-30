import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./i18n";
import "./theme.css";
import Login from "./components/Login";
import Signup from "./components/Signup";
import FarmerDashboard from "./components/FarmerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import BuyerDashboard from "./components/BuyerDashboard";
import Navbar from "./components/Navbar";
import Pesticide from "./Pesticide";
import Schemes from "./Schemes";
import MarketPlace from "./components/MarketPlace";
import Contact from "./components/Contact";
import UserProfile from "./UserProfile";
import Cart from "./components/Cart";
import CheckoutPage from "./components/CheckoutPage";
import Invoice from "./components/Invoice";
import Footer from "./components/Footer_New";
import "./App.css";

// Inner component so useLocation works inside Router
function AppInner({ user, setUser }) {
  const location = useLocation();
  const hideNavbar = location.pathname === "/" || location.pathname === "/signup";

  return (
    <div className="App">
      {!hideNavbar && <Navbar user={user} setUser={setUser} />}
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to={`/dashboard/${(user.role === 'admin' || user.role === 'dept_admin') ? 'admin' : user.role}`} /> : <Login setUser={setUser} />}
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/cart" element={user ? <Cart user={user} /> : <Navigate to="/" />} />
        <Route path="/checkout" element={user ? <CheckoutPage user={user} /> : <Navigate to="/" />} />
        <Route path="/invoice" element={user ? <Invoice /> : <Navigate to="/" />} />
        <Route path="/dashboard/farmer" element={user && user.role === "farmer" ? <FarmerDashboard user={user} /> : <Navigate to="/" />} />
        <Route path="/dashboard/admin" element={user && (user.role === "admin" || user.role === "dept_admin") ? <AdminDashboard user={user} /> : <Navigate to="/" />} />
        <Route path="/dashboard/buyer" element={user && user.role === "buyer" ? <BuyerDashboard user={user} /> : <Navigate to="/" />} />
        <Route path="/pesticide" element={<Pesticide user={user} />} />
        <Route path="/schemes" element={<Schemes user={user} />} />
        <Route path="/market" element={<MarketPlace user={user} />} />
        <Route path="/help" element={<Contact />} />
        <Route path="/complaint" element={user ? <FarmerDashboard user={user} activeTab="complaints" /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <UserProfile user={user} /> : <Navigate to="/" />} />
      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (storedUser && token) setUser(JSON.parse(storedUser));
    };
    syncUser(); // Load state immediately on mount
    window.addEventListener("storage", syncUser);
    window.addEventListener("cartUpdated", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("cartUpdated", syncUser);
    };
  }, []);

  return (
    <Router>
      <AppInner user={user} setUser={setUser} />
    </Router>
  );
}

export default App;
