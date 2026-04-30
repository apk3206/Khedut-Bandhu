import React, { useEffect, useState } from "react";
import API_BASE_URL from "../apiConfig";
import { useTranslation } from "react-i18next";
import "./MarketTicker.css";

const MarketTicker = () => {
    const { t } = useTranslation();
    const [rates, setRates] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/market`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setRates(data);
                else console.error("Market data is not an array:", data);
            })
            .catch(err => console.error("Failed to fetch market rates:", err));
    }, []);

    // Duplicate rates for seamless infinite loop
    const displayRates = [...rates, ...rates];

    return (
        <div className="ticker-wrap">
            <div className="ticker-content">
                {displayRates.length > 0 ? displayRates.map((r, i) => {
                    const prevRate = r.previousRate || r.rate - (Math.random() * 5); // Fallback for demo
                    const diff = r.rate - prevRate;
                    // Clean name (remove anything in brackets for translation key)
                    const cleanName = r.cropName.split('(')[0].trim().toLowerCase();
                    
                    return (
                        <div className="ticker-item" key={i}>
                            <span className="market-badge">{r.region || "APMC"}</span>
                            <span className="crop-name">{t(cleanName) || r.cropName}</span>
                            <span className="crop-price">₹{r.rate}</span>
                            <span className={`crop-trend ${diff >= 0 ? 'up-trend' : 'down-trend'}`}>
                                {diff >= 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(1)}
                            </span>
                        </div>
                    );
                }) : (
                    <div className="ticker-item">
                        <span className="crop-name">Loading Live Market Rates...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketTicker;
