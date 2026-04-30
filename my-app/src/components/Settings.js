import React, { useState } from "react";
import API_BASE_URL from "../apiConfig";
import "./Settings.css";

const Settings = ({ user }) => {
    const [formData, setFormData] = useState({
        username: user.username || "",
        phone: user.phone || "",
        currentPassword: "",
        newPassword: "",
        bankDetails: {
            accountNumber: user.bankDetails?.accountNumber || "",
            ifscCode: user.bankDetails?.ifscCode || "",
            bankName: user.bankDetails?.bankName || "",
            accountHolderName: user.bankDetails?.accountHolderName || "",
        }
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        if (e.target.name.startsWith("bank_")) {
            const field = e.target.name.replace("bank_", "");
            setFormData({
                ...formData,
                bankDetails: { ...formData.bankDetails, [field]: e.target.value }
            });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/user/settings/${user.id || user._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: formData.username,
                    phone: formData.phone,
                    password: formData.currentPassword,
                    newPassword: formData.newPassword,
                    bankDetails: formData.bankDetails
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage("Settings updated successfully!");
                // Clear password fields for security
                setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
            } else {
                setError(data.error || "Failed to update settings");
            }
        } catch (err) {
            setError("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <span>⚙️</span>
                <h3>Account Settings</h3>
            </div>

            <form onSubmit={handleSubmit} className="settings-form">
                
                {/* PROFILE SECTION */}
                <div className="settings-section">
                    <h4>👤 Profile Information</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={user.email}
                                readOnly
                                className="readonly-input"
                                title="Email cannot be changed"
                            />
                        </div>
                        <div className="form-group">
                            <label>Mobile Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 XXXXX XXXXX"
                            />
                        </div>
                    </div>
                </div>

                <hr />

                {/* SECURITY SECTION */}
                <div className="settings-section">
                    <h4>🔒 Security & Password</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                placeholder="Required to change password"
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="Min. 8 characters"
                            />
                        </div>
                    </div>
                </div>

                <hr />

                {/* BANK SECTION */}
                <div className="settings-section">
                    <h4>🏦 Bank Account Details</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Account Holder Name</label>
                            <input
                                type="text"
                                name="bank_accountHolderName"
                                value={formData.bankDetails.accountHolderName}
                                onChange={handleChange}
                                placeholder="As per bank records"
                            />
                        </div>
                        <div className="form-group">
                            <label>Account Number</label>
                            <input
                                type="text"
                                name="bank_accountNumber"
                                value={formData.bankDetails.accountNumber}
                                onChange={handleChange}
                                placeholder="Your 11-16 digit account number"
                            />
                        </div>
                        <div className="form-group">
                            <label>IFSC Code</label>
                            <input
                                type="text"
                                name="bank_ifscCode"
                                value={formData.bankDetails.ifscCode}
                                onChange={handleChange}
                                placeholder="e.g. SBIN0001234"
                            />
                        </div>
                        <div className="form-group">
                            <label>Bank Name</label>
                            <input
                                type="text"
                                name="bank_bankName"
                                value={formData.bankDetails.bankName}
                                onChange={handleChange}
                                placeholder="e.g. State Bank of India"
                            />
                        </div>
                    </div>
                </div>

                <div className="message-box">
                    {message && <p className="success-msg">✅ {message}</p>}
                    {error && <p className="error-msg">⚠️ {error}</p>}
                </div>

                <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? "Saving Changes..." : "Update Settings"}
                </button>
            </form>
        </div>
    );
};

export default Settings;
