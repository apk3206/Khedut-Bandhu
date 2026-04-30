import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../apiConfig";
import "./Login.css";

const Login = ({ setUser }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("farmer");
    const [otp, setOtp] = useState("");
    const [showOtp, setShowOtp] = useState(false);
    const [userId, setUserId] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [forgotStep, setForgotStep] = useState(0); // 0: Login, 1: Ask Email, 2: Reset Form
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();

    React.useEffect(() => {
        // Intercept Google OAuth Redirect Token
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const urlRole = urlParams.get('role');
        const urlUserId = urlParams.get('userId');

        if (token && urlUserId) {
            localStorage.setItem("token", token);
            // We need a dummy user object to satisfy the app state
            const googleUser = {
                _id: urlUserId,
                id: urlUserId,
                role: urlRole || "buyer",
                username: "Google User"
            };
            localStorage.setItem("user", JSON.stringify(googleUser));
            setUser(googleUser);
            
            // Redirect based on role
            if (googleUser.role === "farmer") navigate("/dashboard/farmer");
            else if (googleUser.role === "admin") navigate("/dashboard/admin");
            else navigate("/dashboard/buyer");
        }

        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown, navigate, setUser]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setResendCooldown(60);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setUserId(data.userId);
            setShowOtp(true);
            alert("OTP sent to your email!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            const user = data.user;
            const validFarmer = role === "farmer" && user.role === "farmer";
            const validBuyer = role === "buyer" && user.role === "buyer";
            const validAdmin = role === "admin" && (user.role === "admin" || user.role === "dept_admin");
            if (!validFarmer && !validBuyer && !validAdmin) {
                alert(`You are not registered as ${role}. You are a ${user.role}.`);
                window.location.reload();
                return;
            }
            if (data.token) localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(user));
            setUser(user);
            if (user.role === "farmer") navigate("/dashboard/farmer");
            else if (user.role === "buyer") navigate("/dashboard/buyer");
            else navigate("/dashboard/admin");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleForgotPasswordSendOtp = async (e) => {
        if (e) e.preventDefault();
        setResendCooldown(60);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setUserId(data.userId);
            setForgotStep(2);
            alert("Password Reset OTP sent to your email!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleResetPassword = async (e) => {
        if (e) e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, otp, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert(data.message);
            setForgotStep(0);
            setShowOtp(false);
            setOtp("");
            setPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="login-page-body">

            {/* ===== LEFT PANEL — FORM ===== */}
            <div className="login-left">
                <div className="login-left-inner">

                    <div className="secure-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 11V5l-9-4zm-1 14l-4-4 1.41-1.41L11 12.17l6.59-6.58L19 7l-8 8z"/>
                        </svg>
                        Secure Farmer Login
                    </div>

                    <h1 className="login-title">Welcome Back 👋</h1>
                    <p className="login-subtitle">
                        Log in to access your <span>agriculture dashboard.</span>
                    </p>

                    {/* Role Selector */}
                    <div className="role-selector">
                        <button className={role === "farmer" ? "active" : ""} onClick={() => setRole("farmer")}>🌾 Farmer</button>
                        <button className={role === "buyer" ? "active" : ""} onClick={() => setRole("buyer")}>🛒 Buyer</button>
                        <button className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}>🏛 Admin</button>
                    </div>

                    {forgotStep === 1 ? (
                        <form onSubmit={handleForgotPasswordSendOtp}>
                            <h3 style={{color: '#444', marginBottom: '15px'}}>Reset Password</h3>
                            <div className="field-group">
                                <label>Username or Email</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        style={{ width: '100%', padding: '12px 15px', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="login-btn" disabled={resendCooldown > 0}>
                                {resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Send Reset OTP"}
                            </button>
                            <p className="signup-link" style={{ textAlign: "center", marginTop: "15px" }}>
                                <span onClick={() => setForgotStep(0)} style={{ cursor: "pointer", color: "#007bff" }}>Back to Login</span>
                            </p>
                        </form>

                    ) : forgotStep === 2 ? (
                        <form onSubmit={handleResetPassword} className="otp-section">
                            <h3 style={{color: '#444', marginBottom: '15px'}}>Set New Password</h3>
                            
                            <label>Enter OTP sent to {username}</label>
                            <div className="input-wrapper" style={{ marginBottom: '15px' }}>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="6-digit code..."
                                    required
                                    style={{ width: '100%', padding: '12px 15px', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <label>New Password</label>
                            <div className="input-wrapper" style={{ marginBottom: '15px' }}>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ width: '100%', padding: '12px 15px', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <label>Confirm Password</label>
                            <div className="input-wrapper" style={{ marginBottom: '20px' }}>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ width: '100%', padding: '12px 15px', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <button type="submit" className="verify-btn">
                                ✓ Reset Password
                            </button>
                            <div className="resend-row" style={{ marginTop: '15px' }}>
                                <button type="button" onClick={() => setForgotStep(0)} className="resend-btn" style={{ color: '#dc3545' }}>Cancel</button>
                                <button
                                    type="button"
                                    onClick={handleForgotPasswordSendOtp}
                                    disabled={resendCooldown > 0}
                                    className="resend-btn"
                                    style={{ color: resendCooldown > 0 ? '#3d5a73' : '#2ecc71' }}
                                >
                                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend OTP"}
                                </button>
                            </div>
                        </form>

                    ) : !showOtp ? (
                        <form onSubmit={handleLogin}>
                            <div className="field-group">
                                <label>Username or Email</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                            <path d="M7 11V7a5 5 0 0110 0v4"/>
                                        </svg>
                                    </span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ textAlign: "right", margin: "-10px 0 20px" }}>
                                <span onClick={() => setForgotStep(1)} style={{ cursor: "pointer", fontSize: "14px", color: "#28a745", fontWeight: "600" }}>Forgot Password?</span>
                            </div>

                            <button type="submit" className="login-btn">
                                Login →
                            </button>

                            <div className="divider">Or continue with</div>

                            <button
                                type="button"
                                className="google-btn"
                                onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}
                            >
                                <img src="/google-icon.png" alt="Google" />
                                Sign in with Google
                            </button>

                            <p className="signup-link">
                                Don't have an account? <Link to="/signup">Sign up here</Link>
                            </p>
                        </form>
                    ) : (
                        <div className="otp-section">
                            <label>Enter OTP sent to {username}</label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.61A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/>
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter 6-digit code..."
                                />
                            </div>

                            <button onClick={handleVerifyOtp} className="verify-btn">
                                ✓ Verify OTP
                            </button>

                            <div className="resend-row">
                                <p>Didn't receive the code?</p>
                                <button
                                    onClick={handleLogin}
                                    disabled={resendCooldown > 0}
                                    className="resend-btn"
                                    style={{ color: resendCooldown > 0 ? '#3d5a73' : '#2ecc71' }}
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== RIGHT PANEL — HERO ===== */}
            <div className="login-right">
                <div className="login-right-bg"></div>
                <div className="login-right-overlay"></div>
                <div className="login-right-content">
                    <span className="hero-badge">🇮🇳 Powered by Khedut Bandhu</span>
                    <h2 className="hero-title">
                        Smart Farming<br />for <span>Modern India</span>
                    </h2>
                    <p className="hero-desc">
                        Join thousands of farmers, buyers, and departments managing their agriculture journey with real-time data and precision analytics.
                    </p>
                    <div className="hero-stats">
                        <div className="stat-card">
                            <div className="stat-value">10K+</div>
                            <div className="stat-label">Active Farmers</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">24/7</div>
                            <div className="stat-label">Market Access</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">98%</div>
                            <div className="stat-label">Satisfaction Rate</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">₹5Cr+</div>
                            <div className="stat-label">Trade Facilitated</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Login;
