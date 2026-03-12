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
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Step 1: Login Request
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

            // Role Check
            const isFarmer = role === "farmer";
            const isBuyer = role === "buyer";
            const isAdmin = role === "admin";

            const validFarmer = isFarmer && user.role === "farmer";
            const validBuyer = isBuyer && user.role === "buyer";
            const validAdmin = isAdmin && (user.role === "admin" || user.role === "dept_admin");

            if (!validFarmer && !validBuyer && !validAdmin) {
                alert(`You are not registered as ${role}. You are a ${user.role}.`);
                window.location.reload();
                return;
            }

            // Store token and user data in localStorage
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
            localStorage.setItem("user", JSON.stringify(user));

            setUser(user);
            if (user.role === "farmer") navigate("/dashboard/farmer");
            else if (user.role === "buyer") navigate("/dashboard/buyer");
            else navigate("/dashboard/admin");

        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="login-page-body">
            <h2 className="login-heading">Farmer Login</h2>

            <div className="login-form-container">
                <div className="role-selector">
                    <button className={role === "farmer" ? "active" : ""} onClick={() => setRole("farmer")}>Farmer</button>
                    <button className={role === "buyer" ? "active" : ""} onClick={() => setRole("buyer")}>User</button>
                    <button className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}>Admin</button>
                </div>

                {!showOtp ? (
                    <form onSubmit={handleLogin} style={{ width: "100%", display: "contents" }}>
                        <label>Username or Email:</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />

                        <label>Password:</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

                        <button type="submit">Login</button>

                        <div className="divider">OR</div>

                        <button
                            type="button"
                            className="google-btn"
                            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}
                        >
                            <img src="/google-icon.png" alt="Google" />
                            Login with Google
                        </button>

                        <p style={{ textAlign: "center", marginTop: "15px", color: "white", fontSize: "14px" }}>
                            Don't have an account? <Link to="/signup" style={{ color: "#ffff00", cursor: "pointer", textDecoration: "underline" }}>Sign up here</Link>
                        </p>
                    </form>
                ) : (
                    <div className="otp-section">
                        <label>Enter OTP</label>
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Wait for email..." />
                        <button onClick={handleVerifyOtp} className="verify-btn">Verify OTP</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
