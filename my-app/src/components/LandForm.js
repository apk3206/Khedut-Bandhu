import React, { useState, useEffect } from "react";
import API_BASE_URL from "../apiConfig";
import { useTranslation } from "react-i18next";
import "./LandForm.css";

const LandForm = ({ user, existingData, onSuccess }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        ownerName: "",
        gender: "Male",
        dob: "",
        aadharNumber: "",
        district: "",
        village: "",
        area: "",
        soilType: "", // Added Soil Type
        holders: [],
    });

    const [newMember, setNewMember] = useState({ name: "", relation: "", aadharNumber: "" });
    const [showMemberForm, setShowMemberForm] = useState(false);

    // Verification States
    const [ownerVerified, setOwnerVerified] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");

    // Member verification states
    const [memberOtpSent, setMemberOtpSent] = useState(false);
    const [memberOtp, setMemberOtp] = useState("");
    const [memberVerified, setMemberVerified] = useState(false);

    useEffect(() => {
        if (existingData) {
            setFormData(prev => ({ ...prev, ...existingData }));
            if (existingData.aadharNumber) setOwnerVerified(true);
        }
    }, [existingData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Aadhar Verification Logic (Same as before) ---
    const sendAadharOtp = async (isMember = false) => {
        const aadhar = isMember ? newMember.aadharNumber : formData.aadharNumber;
        if (!aadhar || aadhar.length < 12) {
            alert("Please enter a valid Aadhar Number (12 digits)");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/aadhar-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, aadharNumber: aadhar }),
            });
            if (res.ok) {
                alert(`OTP sent to your registered email for Aadhar: ${aadhar}`);
                if (isMember) setMemberOtpSent(true);
                else setOtpSent(true);
            } else {
                alert("Failed to send OTP");
            }
        } catch (err) {
            alert("Error sending OTP");
        }
    };

    const verifyAadharOtp = async (isMember = false) => {
        const inputOtp = isMember ? memberOtp : otp;
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/verify-aadhar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, otp: inputOtp }),
            });
            if (res.ok) {
                alert(t("verified") + " Successfully!");
                if (isMember) {
                    setMemberVerified(true);
                    setMemberOtpSent(false);
                    setMemberOtp("");
                } else {
                    setOwnerVerified(true);
                    setOtpSent(false);
                    setOtp("");
                }
            } else {
                alert("Invalid OTP");
            }
        } catch (err) {
            alert("Verification failed");
        }
    };

    const addMember = () => {
        if (!memberVerified) {
            alert("Please verify member's Aadhar first!");
            return;
        }
        setFormData({
            ...formData,
            holders: [...formData.holders, newMember],
        });
        setNewMember({ name: "", relation: "", aadharNumber: "" });
        setMemberVerified(false); // Reset for next
        setShowMemberForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!ownerVerified) {
            alert("Please verify Owner Aadhar Number first!");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/land`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, ...formData }),
            });
            if (res.ok) {
                alert("Land Details Saved Successfully!");
                onSuccess();
            } else {
                alert("Failed to save details");
            }
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="land-form-container">
            <h3 className="form-header">{t("complete_profile")}</h3>

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label>{t("owner_name")}</label>
                        <input name="ownerName" value={formData.ownerName} onChange={handleChange} required />
                    </div>

                    {/* Owner Aadhar Verification */}
                    <div className="form-group">
                        <label>{t("aadhar")}</label>
                        <div className="aadhar-group">
                            <input
                                name="aadharNumber"
                                value={formData.aadharNumber}
                                onChange={handleChange}
                                required
                                disabled={ownerVerified}
                                placeholder="12-digit Aadhar"
                            />
                            {!ownerVerified && !otpSent && (
                                <button type="button" onClick={() => sendAadharOtp(false)} className="verify-btn">{t("verify")}</button>
                            )}
                        </div>
                        {otpSent && (
                            <div className="otp-group">
                                <input
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="otp-input"
                                />
                                <button type="button" onClick={() => verifyAadharOtp(false)} className="confirm-btn">Confirm OTP</button>
                            </div>
                        )}
                        {ownerVerified && <span className="verified-badge">✅ {t("verified")}</span>}
                    </div>

                    <div className="form-group">
                        <label>Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleChange}>
                            <option>Male</option>
                            <option>Female</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Date of Birth</label>
                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>{t("district")}</label>
                        <input name="district" value={formData.district} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>{t("village")}</label>
                        <input name="village" value={formData.village} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>{t("area")}</label>
                        <input name="area" type="number" value={formData.area} onChange={handleChange} required />
                    </div>

                    {/* NEW: Soil Type Dropdown */}
                    <div className="form-group">
                        <label>{t("soil_type")}</label>
                        <select name="soilType" value={formData.soilType} onChange={handleChange} required>
                            <option value="">Select Soil Type</option>
                            <option value="Black">Black Soil (Kali)</option>
                            <option value="Alluvial">Alluvial (Kapasi)</option>
                            <option value="Red">Red Soil (Lal)</option>
                            <option value="Sandy">Sandy (Retal)</option>
                            <option value="Loamy">Loamy (Goradu)</option>
                        </select>
                    </div>
                </div>

                <div className="holders-section">
                    <h4>Land Holders (Family Members)</h4>
                    {formData.holders.length > 0 && (
                        <div className="holders-list">
                            {formData.holders.map((h, i) => (
                                <div key={i} className="holder-tag">
                                    {h.name} ({h.relation}) - {h.aadharNumber}
                                </div>
                            ))}
                        </div>
                    )}

                    {!showMemberForm ? (
                        <button type="button" className="add-member-btn" onClick={() => setShowMemberForm(true)}>+ {t("add_member")}</button>
                    ) : (
                        <div className="member-form-box">
                            <h5>Add New Member</h5>
                            <div className="member-input-row">
                                <input placeholder="Name" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} />
                                <input placeholder="Relation" value={newMember.relation} onChange={e => setNewMember({ ...newMember, relation: e.target.value })} />
                            </div>

                            {/* Member Aadhar Verification */}
                            <div className="member-aadhar-row">
                                <input
                                    placeholder="Aadhar Number"
                                    value={newMember.aadharNumber}
                                    onChange={e => setNewMember({ ...newMember, aadharNumber: e.target.value })}
                                    disabled={memberVerified}
                                />
                                {!memberVerified && !memberOtpSent && (
                                    <button type="button" onClick={() => sendAadharOtp(true)} className="verify-small-btn">{t("verify")}</button>
                                )}
                                {memberVerified && <span className="verified-text">✅</span>}
                            </div>

                            {memberOtpSent && (
                                <div className="otp-group-small">
                                    <input
                                        placeholder="OTP"
                                        value={memberOtp}
                                        onChange={(e) => setMemberOtp(e.target.value)}
                                        className="otp-input-small"
                                    />
                                    <button type="button" onClick={() => verifyAadharOtp(true)} className="confirm-small-btn">Confirm</button>
                                </div>
                            )}

                            <div className="member-actions">
                                <button type="button" onClick={addMember} className="save-member-btn" disabled={!memberVerified}>{t("add_member")}</button>
                                <button type="button" onClick={() => setShowMemberForm(false)} className="cancel-btn">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>

                <button type="submit" className="save-all-btn">{t("save_details")}</button>
            </form>
        </div>
    );
};

export default LandForm;
