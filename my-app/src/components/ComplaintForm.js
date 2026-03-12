import React, { useState } from "react";
import API_BASE_URL from "../apiConfig";
import "./ComplaintForm.css";

const ComplaintForm = ({ user, onSuccess }) => {
    const [subject, setSubject] = useState("");
    const [department, setDepartment] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Use FormData for file upload
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("subject", subject);
        formData.append("department", department);
        formData.append("description", description);
        if (file) formData.append("media", file);

        try {
            const res = await fetch(`${API_BASE_URL}/api/complaint`, {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                alert(data.message || "Complaint Submitted Successfully!");
                setSubject("");
                setDescription("");
                setFile(null);
                setDepartment("");
                onSuccess();
            } else if (res.status === 400) {
                const errorData = await res.json();
                alert(`Improper Complaint: ${errorData.reason || "Please provide a clear description of your issue."}`);
            } else {
                alert("Failed to submit complaint.");
            }
        } catch (err) {
            alert("Error submitting complaint");
        }
    };

    return (
        <div className="complaint-form-container">
            <h3 className="form-header">File a New Complaint</h3>
            <form onSubmit={handleSubmit} className="complaint-form">

                <div className="form-group">
                    <label>Department (Auto-Routing Supported)</label>
                    <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="form-control"
                    >
                        <option value="">-- Select Department (Optional) --</option>
                        <option value="Pesticide">Pesticide & Fertilizers</option>
                        <option value="MarketPrice">Market Price & APMC</option>
                        <option value="Seed">Seeds & Quality</option>
                        <option value="Subsidy">Subsidy & Grants</option>
                        <option value="Orders">Orders & Delivery</option>
                        <option value="Help">General Assistance</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Subject</label>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        placeholder="e.g. Subsidy amount not received"
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows="5"
                        placeholder="Describe your issue in detail..."
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Upload Supporting Evidence (Image/Video)</label>
                    <div className="file-upload-wrapper">
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            accept="image/*,video/*"
                            className="file-input"
                        />
                    </div>
                </div>

                <button type="submit" className="submit-btn">Submit Complaint</button>
            </form>
        </div>
    );
};

export default ComplaintForm;
