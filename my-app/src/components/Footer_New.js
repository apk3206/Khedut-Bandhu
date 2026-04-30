import React, { useState, useEffect } from "react";
import "./Footer.css";

const Footer = () => {
  const images = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  ];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <footer className="footer-wrapper">
      <div className="footer-grass-border"></div>
      
      <div className="footer-main">
        <div className="footer-slider-container">
          <div className="footer-slider">
            <img src={images[currentImage]} alt="Agriculture" className="slider-image" />
            <button className="slider-btn slider-btn-left" onClick={prevImage}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button className="slider-btn slider-btn-right" onClick={nextImage}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        <div className="footer-content">
          <div className="footer-title-block">
            <h2 className="footer-title">અમારા વિશે</h2>
            <div className="footer-divider-container">
              <div className="footer-divider-line"></div>
              <svg className="footer-wheat-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2C11.5,4 11,6 11,8C11,10 11.5,12 12,14C12.5,12 13,10 13,8C13,6 12.5,4 12,2M12,16C11.5,18 11,20 11,22M13,22C13,20 12.5,18 12,16C12,14 12.5,12 13,10C13.5,12 14,14 14,16C14,18 13.5,20 13,22M11,22C10.5,20 10,18 10,16C10,14 10.5,12 11,10C10.5,12 10,14 10,16C10,18 10.5,20 11,22Z" />
              </svg>
              <h3 className="footer-subtitle">કૃષિ વિશે</h3>
            </div>
          </div>

          <p className="footer-text">
            કૃષિ એ ભારતની અર્થવ્યવસ્થાનું પાયાનું સ્તંભ છે, જે કરોડો ખેડૂતો અને સંબંધિત ઉદ્યોગોને રોજગાર પ્રદાન કરે છે. 
            આધુનિક કૃષિ ટેકનોલોજી, ટકાઉ ખેતી પદ્ધતિઓ, અને સરકારની વિવિધ સહાય યોજનાઓ દ્વારા, કૃષિ ક્ષેત્ર સતત વિકાસ પામી રહ્યું છે.
          </p>

          <p className="footer-text highlighted">
            આપણે સૌ સાથે મળીને ખેતીને ડીજીટલ અને આધુનિક બનાવીએ. આ પ્લેટફોર્મ પર તમને બિયારણથી લઈને બજાર ભાવ અને સરકારી યોજનાઓ સુધીની તમામ માહિતી એક જ જગ્યાએ મળશે. આવો, એક મજબૂત અને સમૃદ્ધ ખેડૂત સમાજનું નિર્માણ કરીએ, કારણ કે જો <strong>ખેડૂત સુખી હશે, તો જ દેશ સુખી થશે!</strong>
          </p>

          <div className="footer-settings-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Khedut Bandhu. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
