import React, { useState, useEffect } from 'react';
import API_BASE_URL from "../apiConfig";
import { useTranslation } from "react-i18next";
import '../MarketPrice.css'; // Reuse CSS

const MarketPlace = ({ user }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('prices');
    const [prices, setPrices] = useState([]);
    const [listings, setListings] = useState([]);
    const [sellForm, setSellForm] = useState({
        cropName: '',
        quantity: '',
        expectedPrice: '',
        description: '',
        contactPhone: user?.phone || ''
    });

    useEffect(() => {
        fetchMarketPrices();
        fetchListings();
    }, []);

    const fetchMarketPrices = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/market`);
            const data = await response.json();
            setPrices(data);
        } catch (error) {
            console.error('Error fetching prices:', error);
        }
    };

    const fetchListings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/market/listings`);
            const data = await response.json();
            setListings(data);
        } catch (error) {
            console.error('Error fetching listings:', error);
        }
    };

    const handleSellSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert("Please Login First");

        try {
            const res = await fetch(`${API_BASE_URL}/api/market/sell`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...sellForm, userId: user.id, username: user.username })
            });
            if (res.ok) {
                alert("Listing Added & Email Sent!");
                setActiveTab('buy');
                fetchListings();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="market-price-page">
            <div className="market-header">
                <h2>{t("market_header")}</h2>
            </div>

            <div className="profile-tabs">
                <button className={activeTab === 'prices' ? 'active' : ''} onClick={() => setActiveTab('prices')}>{t("market_price")}</button>
                <button className={activeTab === 'buy' ? 'active' : ''} onClick={() => setActiveTab('buy')}>{t("buy_crops")}</button>
                <button className={activeTab === 'sell' ? 'active' : ''} onClick={() => setActiveTab('sell')}>{t("sell_crops")}</button>
            </div>

            <div className="market-content" style={{ marginTop: '20px' }}>
                {activeTab === 'prices' && (
                    <table className="price-table">
                        <thead>
                            <tr><th>Crop</th><th>Rate (₹/Quintal)</th></tr>
                        </thead>
                        <tbody>
                            {prices.map((p, i) => (
                                <tr key={i}><td>{p.cropName}</td><td>₹{p.rate}</td></tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'buy' && (
                    <div className="products-grid">
                        {listings.map(l => (
                            <div key={l._id} className="product-card">
                                <h3>{l.cropName}</h3>
                                <p>Qty: {l.quantity} {l.unit}</p>
                                <p>Price: ₹{l.expectedPrice}</p>
                                <p>Farmer: {l.username}</p>
                                <button className="btn-add-cart" onClick={() => alert(`Contact Farmer: ${l.contactPhone}`)}>Contact Farmer</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'sell' && (
                    <form className="complaint-form" onSubmit={handleSellSubmit}>
                        <div className="form-group">
                            <label>{t("crop_name")}</label>
                            <select value={sellForm.cropName} onChange={e => setSellForm({ ...sellForm, cropName: e.target.value })} required>
                                <option value="">Select Crop</option>
                                <option value="Wheat">Wheat</option>
                                <option value="Rice">Rice</option>
                                <option value="Cotton">Cotton</option>
                                <option value="Groundnut">Groundnut</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t("quantity")}</label>
                            <input type="number" value={sellForm.quantity} onChange={e => setSellForm({ ...sellForm, quantity: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>{t("expected_price")}</label>
                            <input type="number" value={sellForm.expectedPrice} onChange={e => setSellForm({ ...sellForm, expectedPrice: e.target.value })} required />
                        </div>
                        <button type="submit" className="submit-btn">{t("list_crop")}</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default MarketPlace;
