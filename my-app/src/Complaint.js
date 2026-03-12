import React, { useState } from 'react';
import API_BASE_URL from './apiConfig';
import './Complaint.css';

const Complaint = ({ user }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      alert('Please login to submit a complaint');
      return;
    }

    if (!formData.subject || !formData.description) {
      setMessage('Please fill all fields');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/complaints/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('Complaint submitted successfully!');
        setFormData({ subject: '', description: '' });
      } else {
        setMessage('Error submitting complaint. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setMessage('Error submitting complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="complaint-page">
      <div className="complaint-header">
        <h2>ફરિયાદ / File a Complaint</h2>
        <p>Submit your complaint or grievance</p>
      </div>

      <div className="complaint-form-container">
        <form className="complaint-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Enter complaint subject"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your complaint in detail"
              rows="6"
              required
            />
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Complaint;

