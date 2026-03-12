import React, { useState } from "react";
import API_BASE_URL from "../apiConfig";
import "./FeedbackForm.css";

const FeedbackForm = ({ user, onSuccess }) => {
    const [type, setType] = useState("General");
    const [department, setDepartment] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("type", type);
        if (type === "Department-wise") formData.append("department", department);
        formData.append("subject", subject);
        formData.append("description", description);
        if (file) formData.append("media", file);

        try {
            const res = await fetch(`${API_BASE_URL}/api/feedback`, {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                alert("Thank you for your feedback/suggestion!");
                setSubject("");
                setDescription("");
                setFile(null);
                setDepartment("");
                if (onSuccess) onSuccess();
            } else {
                alert("Failed to submit feedback.");
            }
        } catch (err) {
            alert("Error submitting feedback");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="feedback-form-container">
            <h3 className="form-header">Feedback & Suggestions</h3>
            <p className="form-subtitle">Help us improve Khedut Bandhu with your valuable ideas.</p>

            <form onSubmit={handleSubmit} className="feedback-form">
                <div className="form-group">
                    <label>Feedback Type</label>
                    <div className="type-selector">
                        <button
                            type="button"
                            className={`type-btn ${type === "General" ? "active" : ""}`}
                            onClick={() => setType("General")}
                        >
                            General
                        </button>
                        <button
                            type="button"
                            className={`type-btn ${type === "Department-wise" ? "active" : ""}`}
                            onClick={() => setType("Department-wise")}
                        >
                            Department-wise
                        </button>
                    </div>
                </div>

                {type === "Department-wise" && (
                    <div className="form-group fade-in">
                        <label>Select Department</label>
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="form-control"
                            required
                        >
                            <option value="">-- Select Department --</option>
                            <option value="Pesticide">Pesticide & Fertilizers</option>
                            <option value="MarketPrice">Market Price & APMC</option>
                            <option value="Seed">Seeds & Quality</option>
                            <option value="Subsidy">Subsidy & Grants</option>
                            <option value="Orders">Orders & Delivery</option>
                            <option value="Help">General Assistance</option>
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label>Subject</label>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        placeholder="Brief title of your feedback"
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Description / Suggestion</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows="5"
                        placeholder="Write your feedback or suggestion here..."
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Upload Attachment (Optional)</label>
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        accept="image/*,video/*"
                        className="file-input"
                    />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Feedback"}
                </button>
            </form>
        </div>
    );
};

export default FeedbackForm;
