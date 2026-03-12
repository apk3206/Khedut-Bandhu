import React, { useState } from 'react';
import API_BASE_URL from "../apiConfig";
import './ComplaintForm.css'; // Reuse CSS

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) alert("Message Sent Successfully");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="complaint-form-container" style={{ marginTop: '100px' }}>
            <h2>Contact Us</h2>
            <form className="complaint-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="form-group">
                    <label>Message</label>
                    <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required></textarea>
                </div>
                <button type="submit" className="submit-btn" style={{ background: '#007bff' }}>Send Message</button>
            </form>
            <div className="contact-info" style={{ marginTop: '30px', textAlign: 'center' }}>
                <p><strong>Official Mail:</strong> help@khedutbandhu.gov.in</p>
                <p><strong>Developer Contact:</strong> dev@khedutbandhu.com</p>
            </div>
        </div>
    );
};

export default Contact;
