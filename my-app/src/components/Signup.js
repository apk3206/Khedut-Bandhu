import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL from "../apiConfig";
import "./Login.css";
import "./Signup.css"; // Import generic styles

const Signup = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phone: "",
        password: "",
        role: "farmer",
        department: "Pesticide"
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log("Sending Signup Request:", formData);
            const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server returned non-JSON response. Check backend logs.");
            }

            const data = await res.json();

            if (res.ok) {
                alert("Signup Successful! Please login.");
                navigate("/");
            } else {
                alert(data.message || "Signup failed");
            }
        } catch (err) {
            console.error("Signup Error:", err);
            alert("Error in signup: " + err.message + ". Ensure backend is running.");
        }
    };

    return (
        <div className="login-page-body">
            <h2 className="login-heading">Create Account</h2>
            <div className="signup-container">
                <form onSubmit={handleSubmit} className="signup-form">

                    <div className="form-group">
                        <label>I am a:</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="farmer">Farmer</option>
                            <option value="buyer">General User (Buyer)</option>
                            <option value="dept_admin">Department Admin</option>
                            <option value="admin">Supreme Admin</option>
                        </select>
                    </div>

                    {formData.role === "dept_admin" && (
                        <div className="form-group">
                            <label>Department:</label>
                            <select name="department" value={formData.department} onChange={handleChange}>
                                <option value="Pesticide">Pesticide</option>
                                <option value="MarketPrice">MarketPrice</option>
                                <option value="Seed">Seed</option>
                                <option value="Subsidy">Subsidy</option>
                                <option value="Help">Help</option>
                                <option value="Orders">Orders</option>
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Username</label>
                        <input name="username" value={formData.username} onChange={handleChange} required placeholder="Enter username" />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="Enter email" />
                    </div>

                    <div className="form-group">
                        <label>Phone</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} required placeholder="Enter phone number" />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Enter password" />
                    </div>

                    <button type="submit" className="signup-btn">Sign Up</button>

                    <p style={{ textAlign: "center", marginTop: "15px", color: "white", fontSize: "14px" }}>
                        Already have an account? <Link to="/" style={{ color: "#ffff00" }}>Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signup;
