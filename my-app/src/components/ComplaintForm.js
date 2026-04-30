import React, { useState } from "react";
import API_BASE_URL from "../apiConfig";
import "./ComplaintForm.css";
import { useTranslation } from "react-i18next";

const ComplaintForm = ({ user, onSuccess }) => {
    const { t } = useTranslation();
    const [complaint, setComplaint] = useState({
        subject: "",
        department: "",
        description: "",
        media: null,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setComplaint((prevComplaint) => ({
            ...prevComplaint,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        setComplaint((prevComplaint) => ({
            ...prevComplaint,
            media: e.target.files[0],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Use FormData for file upload
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("subject", complaint.subject);
        formData.append("department", complaint.department);
        formData.append("description", complaint.description);
        if (complaint.media) formData.append("media", complaint.media);

        try {
            const res = await fetch(`${API_BASE_URL}/api/complaint`, {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                alert(t("complaint_submitted_success") || "Complaint Submitted Successfully!");
                setComplaint({ department: '', subject: '', description: '', media: null });
                onSuccess();
            } else if (res.status === 400) {
                const errorData = await res.json();
                alert(`Improper Complaint: ${errorData.reason || t("improper_complaint_default") || "Please provide a clear description of your issue."}`);
            } else {
                alert(t("failed_to_submit_complaint") || "Failed to submit complaint.");
            }
        } catch (err) {
            alert(t("error_submitting_complaint") || "Error submitting complaint");
        }
    };

    return (
        <div className="complaint-form-card">
            <h3>{t("file_new_complaint") || "File a New Complaint"}</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>{t("dept_label") || "Department (Auto-Routing Supported)"}</label>
                    <select
                        name="department"
                        value={complaint.department}
                        onChange={handleChange}
                    >
                        <option value="">{t("select_dept") || "-- Select Department (Optional) --"}</option>
                        <option value="Pesticide">{t("pesticide_fertilizer") || "Pesticide & Fertilizers"}</option>
                        <option value="MarketPrice">{t("market_apmc") || "Market Price & APMC"}</option>
                        <option value="Seed">{t("seed_quality") || "Seeds & Quality"}</option>
                        <option value="Subsidy">{t("subsidy_grants") || "Subsidy & Grants"}</option>
                        <option value="Orders">{t("order_delivery") || "Orders & Delivery"}</option>
                        <option value="Help">{t("gen_assistance") || "General Assistance"}</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>{t("subject_label") || "Subject"}</label>
                    <input
                        type="text"
                        name="subject"
                        placeholder={t("subject_placeholder") || "e.g. Subsidy amount not received"}
                        value={complaint.subject}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>{t("description_label") || "Description"}</label>
                    <textarea
                        name="description"
                        placeholder={t("desc_placeholder") || "Describe your issue in detail..."}
                        value={complaint.description}
                        onChange={handleChange}
                        required
                    ></textarea>
                </div>

                <div className="form-group">
                    <label>{t("upload_evidence") || "Upload Supporting Evidence (Image/Video)"}</label>
                    <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                    />
                </div>

                <button type="submit" className="submit-complaint-btn">
                    {t("submit_complaint_btn") || "Submit Complaint"}
                </button>
            </form>
        </div>
    );
};

export default ComplaintForm;
