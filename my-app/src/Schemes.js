import React, { useState, useEffect } from 'react';
import API_BASE_URL from "./apiConfig";
import './Schemes.css';

const Schemes = ({ user }) => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schemes`);
      const data = await response.json();
      setSchemes(data || []); // Adjusted based on expected API response format which might just be array
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schemes:', error);
      setLoading(false);
    }
  };

  const handleApplyScheme = async (scheme) => {
    if (!user?.id) {
      alert('Please login to apply for schemes');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/subsidies/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeName: scheme.name,
          formLink: scheme.formLink
        })
      });

      if (response.ok) {
        alert('Scheme application submitted successfully!');
      } else {
        alert('Error submitting application');
      }
    } catch (error) {
      console.error('Error applying scheme:', error);
      alert('Error submitting application');
    }
  };

  if (loading) {
    return <div className="loading">Loading schemes...</div>;
  }

  return (
    <div className="schemes-page">
      <div className="schemes-header">
        <h2>યોજના / Schemes</h2>
        <p>All available government schemes and subsidies for farmers</p>
      </div>

      <div className="schemes-grid">
        {schemes.map((scheme) => (
          <div key={scheme.id} className="scheme-card">
            <div className="scheme-header">
              <h3>{scheme.name}</h3>
              <span className="scheme-category">{scheme.category}</span>
            </div>
            <p className="scheme-description">{scheme.description}</p>
            <div className="scheme-actions">
              <button
                className="btn-view-form"
                onClick={() => window.open(scheme.formLink, '_blank')}
              >
                View Form
              </button>
              <button
                className="btn-apply"
                onClick={() => handleApplyScheme(scheme)}
              >
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Schemes;

