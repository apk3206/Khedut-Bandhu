import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL from "../apiConfig";
import "./Login.css";
import "./Signup.css";

const Signup = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phone: "",
        password: "",
        role: "farmer",
        department: "Pesticide"
    });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
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
            alert("Error in signup: " + err.message);
        }
    };

    const roleInfo = {
        farmer: { icon: "🌾", desc: "Register as a Farmer to manage land, apply for subsidies, and sell produce." },
        buyer: { icon: "🛒", desc: "Register as a Buyer to browse the marketplace and purchase agricultural products." },
        dept_admin: { icon: "🏛", desc: "Register as a Department Admin to manage government schemes and oversight." },
        admin: { icon: "⚙️", desc: "Register as a Supreme Admin to manage all users and system configurations." },
    };

    return (
        <div className="login-page-body">

            {/* ===== LEFT PANEL — SIGNUP FORM ===== */}
            <div className="login-left">
                <div className="login-left-inner">

                    <div className="secure-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 11V5l-9-4zm-1 14l-4-4 1.41-1.41L11 12.17l6.59-6.58L19 7l-8 8z"/>
                        </svg>
                        Create Your Account
                    </div>

                    <h1 className="login-title">Join Khedut Bandhu 🌱</h1>
                    <p className="login-subtitle">
                        India's most trusted <span>agricultural platform</span> for farmers &amp; buyers.
                    </p>

                    <form onSubmit={handleSubmit} className="signup-form-inner">

                        {/* Role Selector */}
                        <div className="field-group">
                            <label>I am a</label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                                    </svg>
                                </span>
                                <select name="role" value={formData.role} onChange={handleChange} className="signup-select">
                                    <option value="farmer">🌾 Farmer</option>
                                    <option value="buyer">🛒 General User (Buyer)</option>
                                    <option value="dept_admin">🏛 Department Admin</option>
                                    <option value="admin">⚙️ Supreme Admin</option>
                                </select>
                            </div>
                            <p className="role-hint">{roleInfo[formData.role]?.desc}</p>
                        </div>

                        {formData.role === "dept_admin" && (
                            <div className="field-group">
                                <label>Department</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                                        </svg>
                                    </span>
                                    <select name="department" value={formData.department} onChange={handleChange} className="signup-select">
                                        <option value="Pesticide">Pesticide</option>
                                        <option value="MarketPrice">Market Price</option>
                                        <option value="Seed">Seeds</option>
                                        <option value="Subsidy">Subsidy</option>
                                        <option value="Help">Help &amp; Support</option>
                                        <option value="Orders">Orders</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Two-column grid for username + phone */}
                        <div className="signup-two-col">
                            <div className="field-group">
                                <label>Username</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                        </svg>
                                    </span>
                                    <input name="username" value={formData.username} onChange={handleChange} required placeholder="your_name" />
                                </div>
                            </div>
                            <div className="field-group">
                                <label>Phone</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.61A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/>
                                        </svg>
                                    </span>
                                    <input name="phone" value={formData.phone} onChange={handleChange} required placeholder="+91 98765..." />
                                </div>
                            </div>
                        </div>

                        <div className="field-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                </span>
                                <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" />
                            </div>
                        </div>

                        <div className="field-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                                    </svg>
                                </span>
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Min. 8 characters"
                                />
                                <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? "🙈" : "👁"}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-btn" style={{ marginTop: "10px" }}>
                            Create Account →
                        </button>

                        <p className="signup-link" style={{ marginTop: "18px" }}>
                            Already have an account? <Link to="/">Login here</Link>
                        </p>

                    </form>
                </div>
            </div>

            {/* ===== RIGHT PANEL — TRUST INFO ===== */}
            <div className="login-right">
                <div className="login-right-bg"></div>
                <div className="login-right-overlay"></div>
                <div className="login-right-content">
                    <span className="hero-badge">🇮🇳 Government Approved Platform</span>
                    <h2 className="hero-title">
                        Trusted by <span>India's Farmers</span>
                    </h2>
                    <p className="hero-desc">
                        Khedut Bandhu is a secure, government-backed agricultural platform providing farmers, buyers, and administrators with real-time data, subsidies, and market access.
                    </p>

                    {/* Trust Badges */}
                    <div className="trust-list">
                        <div className="trust-item">
                            <span className="trust-icon">🔒</span>
                            <div>
                                <strong>Bank-grade Security</strong>
                                <p>OTP-based login & end-to-end encryption for all transactions</p>
                            </div>
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">🏦</span>
                            <div>
                                <strong>Razorpay Secured Payments</strong>
                                <p>Certified payments gateway — same as used by Flipkart, Swiggy</p>
                            </div>
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">📋</span>
                            <div>
                                <strong>Aadhaar-backed KYC</strong>
                                <p>Identity verified via Digio Aadhaar offline KYC system</p>
                            </div>
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">🌐</span>
                            <div>
                                <strong>Multi-language Support</strong>
                                <p>Available in English, हिंदी, and ગુજરાતી</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Signup;
