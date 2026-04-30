# -*- coding: utf-8 -*-
import io

# Restoring "Older"/Portal Captions as requested
# Title: અમારા વિશે
# Subtitle: કૃષિ વિશે

content = u'''import React, { useState, useEffect } from 'react';
import './Footer.css';

const images = [
  "https://images.pexels.com/photos/2165688/pexels-photo-2165688.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/735956/pexels-photo-735956.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1560942/pexels-photo-1560942.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1112080/pexels-photo-1112080.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1482101/pexels-photo-1482101.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/235721/pexels-photo-235721.jpeg?auto=compress&cs=tinysrgb&w=800"
];

const Footer = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prevIdx) => (prevIdx + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentIdx((prevIdx) => (prevIdx + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIdx((prevIdx) => (prevIdx === 0 ? images.length - 1 : prevIdx - 1));
  };

  return (
    <footer className="footer-wrapper">
      <div className="footer-grass-border"></div>

      <div className="footer-main">
        
        {/* LEFT COMPONENT: IMAGE SLIDER */}
        <div className="footer-slider-container">
          <div className="footer-slider">
            <button className="slider-btn slider-btn-left" onClick={prevSlide} aria-label="Previous Slide">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <img 
                key={currentIdx} 
                src={images[currentIdx]} 
                alt="Agriculture Life" 
                className="slider-image"
            />
            <button className="slider-btn slider-btn-right" onClick={nextSlide} aria-label="Next Slide">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          <div className="leaf-overlay"></div>
        </div>

        {/* RIGHT COMPONENT: ORIGINAL PORTAL CONTENT */}
        <div className="footer-content">
          <div className="footer-title-block">
            <h2 className="footer-title">અમારા વિશે</h2>
            <div className="footer-divider-container">
              <span className="footer-divider-line"></span>
              <svg className="footer-wheat-icon" viewBox="0 0 24 24" fill="#fbbf24">
                <path d="M12 2c-.52 0-1.03.04-1.52.11l-.48.07V4.2l.48-.07c.5-.07 1-.13 1.52-.13 4.41 0 8 3.59 8 8 0 1.2-.27 2.34-.74 3.35l-.18.4 1.83.82.18-.4c.59-1.28.91-2.7.91-4.17 0-5.52-4.48-10-10-10zm-1 14l-4-4 1.41-1.41L11 12.17l6.59-6.58L19 7l-8 8z"/>
              </svg>
              <span className="footer-divider-line"></span>
            </div>
            <h3 className="footer-subtitle">કૃષિ વિશે</h3>
          </div>

          <div className="footer-message">
            <p className="footer-text">
              કૃષિ એ ભારતની અર્થવ્યવસ્થાનું પાયાનું સ્તંભ છે, જે કરોડો ખેડૂતો અને સંબંધિત ઉદ્યોગોને રોજગાર પ્રદાન કરે છે. આધુનિક કૃષિ ટેકનોલોજી, ટકાઉ ખેતી પદ્ધતિઓ, અને સરકારની વિવિધ સહાય યોજનાઓ દ્વારા, કૃષિ ક્ષેત્ર સતત વિકાસ પામી રહ્યું છે. પેદાશ વધારવા, કુદરતી સંસાધનોનું સંરક્ષણ, અને ખેડૂતોનું કલ્યાણ સુનિશ્ચિત કરવું એ કૃષિ ક્ષેત્રનું મુખ્ય લક્ષ્ય છે.
            </p>
            <p className="footer-text">
              કૃષિ એ ભારતની અર્થવ્યવસ્થાનું પાયાનું સ્તંભ છે, જે કરોડો ખેડૂતો અને સંબંધિત ઉદ્યોગોને રોજગાર પ્રદાન કરે છે. આધુનિક કૃષિ ટેકનોલોજી, ટકાઉ ખેતી પદ્ધતિઓ, અને સરકારની વિવિધ સહાય યોજનાઓ દ્વારા, કૃષિ ક્ષેત્ર સતત વિકાસ પામી રહ્યું છે. પેદાશ વધારવા, કુદરતી સંસાધનોનું સંરક્ષણ, અને ખેડૂતોનું કલ્યાણ સુનિશ્ચિત કરવું એ કૃષિ ક્ષેત્રનું મુખ્ય લક્ષ્ય છે.
            </p>
          </div>

          <div className="footer-settings-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
            </svg>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Khedut Bandhu. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
'''

with io.open(r'd:\frontend\my-app\src\components\Footer.js', 'w', encoding='utf-8') as f:
    f.write(content)
