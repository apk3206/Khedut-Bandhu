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
            .then(data => setRates(data));
    }, []);

    // Duplicate rates for seamless infinite loop
    const displayRates = [...rates, ...rates];

    return (
        <div className="ticker-wrap">
            <div className="ticker-content">
                {displayRates.map((r, i) => (
                    <div className="ticker-item" key={i}>
                        <span className="crop-name">{t(r.cropName.toLowerCase())}</span>
                        <span className="crop-price">₹{r.rate}</span>
                        <span className={`crop-trend ${r.rate >= r.previousRate ? 'up' : 'down'}`}>
                            {r.rate >= r.previousRate ? "▲" : "▼"} {Math.abs(r.rate - r.previousRate).toFixed(1)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketTicker;
