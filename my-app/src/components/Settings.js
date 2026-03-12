import React, { useState } from "react";
import API_BASE_URL from "../apiConfig";
import "./Settings.css";

const Settings = ({ user }) => {
    const [formData, setFormData] = useState({
        username: user.username || "",
        phone: user.phone || "",
        currentPassword: "",
        newPassword: "",
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

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
                    password: formData.currentPassword, // Backend checks this
                    newPassword: formData.newPassword // Only if changing
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage("Settings updated successfully!");
                // Optionally update local user state or storage if username changed
            } else {
                setError(data.error || "Failed to update settings");
            }
        } catch (err) {
            setError("Server error. Please try again.");
        }
    };

    return (
        <div className="settings-container">
            <h3>Account Settings</h3>
            <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label>Email (Read-only)</label>
                    <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="readonly-input"
                    />
                </div>

                <div className="form-group">
                    <label>Phone Number</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                    />
                </div>

                <hr />
                <h4>Change Password</h4>
                <div className="form-group">
                    <label>Current Password</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Required to set new password"
                    />
                </div>
                <div className="form-group">
                    <label>New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Leave blank to keep current"
                    />
                </div>

                {message && <p className="success-msg">{message}</p>}
                {error && <p className="error-msg">{error}</p>}

                <button type="submit" className="save-btn">Save Changes</button>
            </form>
        </div>
    );
};

export default Settings;
