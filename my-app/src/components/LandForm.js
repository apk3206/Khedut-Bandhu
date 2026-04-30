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
        soilType: "",
        city: "", // NEW
        address: "", // NEW
        pincode: "", // NEW
        landNumber: "", // NEW
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
        // Dynamically load Digio Script
        if (!document.getElementById("digio-sdk")) {
            const script = document.createElement("script");
            script.id = "digio-sdk";
            script.src = "https://app.digio.in/sdk/v11/digio.js";
            script.async = true;
            document.body.appendChild(script);
        }

        if (existingData) {
            setFormData(prev => ({ ...prev, ...existingData }));
            if (existingData.aadharNumber) setOwnerVerified(true);
        }
    }, [existingData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Aadhar Verification Logic ---
    const triggerDigioKyc = (tokenId, customerIdentifier, isMember) => {
        if (!window.Digio) {
            alert("Digio SDK Failed to load. Check your internet connection.");
            return;
        }

        const options = {
            environment: "sandbox",
            callback: function(response) {
                if(response.hasOwnProperty('error_code')) {
                    alert("Aadhar Verification Failed / Cancelled: " + response.message);
                } else {
                    alert("Digio Aadhaar Verified Successfully!");
                    if (isMember) {
                        setMemberVerified(true);
                        setMemberOtpSent(false);
                    } else {
                        setOwnerVerified(true);
                        setOtpSent(false);
                    }
                }
            },
            logo: "https://yourwebsite.com/logo.png",
            theme: { primaryColor: "#28a745" } 
        };

        const digioInst = new window.Digio(options);
        digioInst.init();
        digioInst.submit(tokenId, customerIdentifier);
    };

    const sendAadharOtp = async (isMember = false) => {
        const aadhar = isMember ? newMember.aadharNumber : formData.aadharNumber;
        if (!aadhar || aadhar.length < 12) {
            alert("Please enter a valid Aadhar Number (12 digits)");
            return;
        }

        try {
            // Step 1: Attempt Real Digio Integration first
            let useDigio = false;
            let digioData = null;
            
            try {
                const digioRes = await fetch(`${API_BASE_URL}/api/auth/digio-request`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user?.id || user?._id, aadharNumber: aadhar, customerName: formData.ownerName }),
                });
                
                if (digioRes.ok) {
                    digioData = await digioRes.json();
                    if (digioData && digioData.useDigio) {
                        useDigio = true;
                    }
                } else {
                    console.log("Digio route missing or failed, likely backend needs restart.");
                }
            } catch (e) {
                console.log("Failed to hit Digio endpoint - triggering fallback: ", e.message);
            }

            if (useDigio && digioData) {
                // Launch Digio SDK
                triggerDigioKyc(digioData.tokenId, digioData.customerIdentifier, isMember);
            } else {
                // Step 2: Fallback to Demo Simulation if `.env` API keys are missing on Server
                const res = await fetch(`${API_BASE_URL}/api/auth/aadhar-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user?.id || user?._id, aadharNumber: aadhar }),
                });
                if (res.ok) {
                    const last4Aadhar = aadhar.slice(-4);
                    alert(`OTP has been sent to your Aadhar registered mobile number (******${last4Aadhar}).\n\n(For this demo, the OTP is also available in your registered email).`);
                    if (isMember) setMemberOtpSent(true);
                    else setOtpSent(true);
                } else {
                    alert("Failed to send simulation OTP from backend");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Error communicating with servers: " + err.message);
        }
    };

    const verifyAadharOtp = async (isMember = false) => {
        const inputOtp = isMember ? memberOtp : otp;
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/verify-aadhar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.id || user?._id, otp: inputOtp }),
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
            alert("Verification failed: " + err.message);
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
                body: JSON.stringify({ userId: user.id || user._id, ...formData }),
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

            {/* KYC Resources Section */}
            <div className="kyc-resources" style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #007bff' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#0056b3' }}>{t("aadhar_kyc_links")}</h5>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <a href="https://myaadhaar.uidai.gov.in/verifyAadhaar" target="_blank" rel="noopener noreferrer" className="visit-btn" style={{ fontSize: '12px' }}>{t("verify_aadhar_official")}</a>
                    <a href="https://myaadhaar.uidai.gov.in/" target="_blank" rel="noopener noreferrer" className="visit-btn" style={{ fontSize: '12px', background: '#28a745' }}>{t("update_aadhar_official")}</a>
                    <a href="https://myaadhaar.uidai.gov.in/offline-ekyc" target="_blank" rel="noopener noreferrer" className="visit-btn" style={{ fontSize: '12px', background: '#6c757d' }}>{t("offline_kyc_official")}</a>
                </div>
            </div>

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

                    <div className="form-group">
                        <label>City/Town</label>
                        <input name="city" value={formData.city} onChange={handleChange} required />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Full Address</label>
                        <input name="address" value={formData.address} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Pincode</label>
                        <input name="pincode" value={formData.pincode} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Land Number (Account/Khata No)</label>
                        <input name="landNumber" value={formData.landNumber} onChange={handleChange} required />
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
