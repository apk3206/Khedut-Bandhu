import React from 'react';
import './Help.css';

const Help = () => {
  return (
    <div className="help-page">
      <div className="help-header">
        <h2>મદદ / Help & Support</h2>
        <p>Get assistance with your queries and applications</p>
      </div>

      <div className="help-content">
        <div className="help-section">
          <h3>Application Guide</h3>
          <div className="guide-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Registration</h4>
                <p>Complete your profile registration with all required details including name, contact number, and location.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Select Scheme</h4>
                <p>Browse available schemes and select the one that suits your needs.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Fill Form</h4>
                <p>Fill out the application form with accurate information and required documents.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Submit & Track</h4>
                <p>Submit your application and track its status through your profile dashboard.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="help-section">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-list">
            <div className="faq-item">
              <h4>How do I register for a scheme?</h4>
              <p>Go to the Schemes section, select a scheme, and click "Apply Now". Fill out the form and submit.</p>
            </div>
            <div className="faq-item">
              <h4>How can I track my application status?</h4>
              <p>Visit your User Profile and check the Subsidy section to see the status of all your applications.</p>
            </div>
            <div className="faq-item">
              <h4>What documents are required?</h4>
              <p>Typically, you need Aadhaar card, bank account details, land documents, and farmer ID. Specific requirements vary by scheme.</p>
            </div>
            <div className="faq-item">
              <h4>How do I file a complaint?</h4>
              <p>Go to the Complaint section, fill out the complaint form with details, and submit. You can track status in your profile.</p>
            </div>
          </div>
        </div>

        <div className="help-section">
          <h3>Contact Support</h3>
          <div className="contact-info">
            <p><strong>Helpline:</strong> 1800-XXX-XXXX</p>
            <p><strong>Email:</strong> support@khedut.gujarat.gov.in</p>
            <p><strong>Office Hours:</strong> Monday to Friday, 9:00 AM - 6:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;

