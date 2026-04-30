import React, { useState, useEffect } from 'react';
import API_BASE_URL from "../apiConfig";
import { useTranslation } from "react-i18next";
import '../MarketPrice.css'; // Reuse CSS

const MarketPlace = ({ user }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('prices');
    const [prices, setPrices] = useState([]);
    const [listings, setListings] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [sellForm, setSellForm] = useState({
        cropName: '',
        quantity: '',
        expectedPrice: '',
        description: '',
        contactPhone: user?.phone || ''
    });

    const [selectedState, setSelectedState] = useState('Gujarat');

    useEffect(() => {
        fetchMarketPrices();
        fetchListings();
    }, [selectedState]);

    const fetchMarketPrices = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/market?state=${selectedState}`);
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
                body: JSON.stringify({ ...sellForm, userId: user.id || user._id, username: user.username })
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

    const handleAddToCart = async (listing) => {
        const userId = user?.id || user?._id;
        if (!userId) return alert("Please login to buy crops");

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/cart/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: listing.cropName,
                    type: 'Crop',
                    quantity: 1, 
                    price: listing.expectedPrice,
                    image: "/products/wheat_seeds_bag.png" 
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert("Added to Cart Successfully!");
                const updatedUser = { ...(user || {}), cart: data.cart };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('cartUpdated'));
            } else {
                const errorData = await res.json();
                console.error("Server Error:", errorData);
                alert(`Failed: ${errorData.message || errorData.error || "Unknown server error"}`);
            }
        } catch (err) {
            console.error("Cart error:", err);
            alert("Failed to add to cart");
        }
    };

    return (
        <div className="market-price-page">
            <div className="market-header">
                <h2>{t("market_header")}</h2>
            </div>

            <div className="profile-tabs" style={{ flexWrap: 'wrap', gap: '5px' }}>
                <button className={activeTab === 'prices' ? 'active' : ''} onClick={() => setActiveTab('prices')}>{t("market_price")}</button>
                <button className={activeTab === 'buy' ? 'active' : ''} onClick={() => setActiveTab('buy')}>{t("buy_crops")}</button>
                <button className={activeTab === 'sell' ? 'active' : ''} onClick={() => setActiveTab('sell')}>{t("sell_crops")}</button>
            </div>

            {activeTab === 'prices' && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                    <select 
                        value={selectedState} 
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="state-selector"
                        style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ddd' }}
                    >
                        <option value="Gujarat">Gujarat</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Maharashtra">Maharashtra</option>
                    </select>
                </div>
            )}

            <div className="market-content" style={{ marginTop: '20px' }}>
                {activeTab === 'prices' && (
                    <table className="price-table">
                        <thead>
                            <tr><th>Crop</th><th>Rate (₹/Quintal)</th></tr>
                        </thead>
                        <tbody>
                            {prices.length === 0 ? (
                                <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>Loading market rates for {selectedState}...</td></tr>
                            ) : prices.map((p, i) => (
                                <tr key={i}><td>{p.cropName}</td><td>₹{p.rate}</td></tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'buy' && (
                    <div className="products-grid">
                        {listings.length === 0 ? (
                            <p style={{ textAlign: 'center', gridColumn: '1/-1' }}>No crop listings available.</p>
                        ) : listings.map(l => (
                            <div key={l._id} className="product-card">
                                <h3>{l.cropName}</h3>
                                <p>Qty: {l.quantity} {l.unit || 'Quintal'}</p>
                                <p>Price: ₹{l.expectedPrice}</p>
                                <p>Farmer: {l.username}</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button className="btn-add-cart" onClick={() => handleAddToCart(l)}>Buy Now</button>
                                    <button className="btn-secondary" onClick={() => setSelectedContact(l)}>Contact</button>
                                </div>
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

            {selectedContact && (
                <div className="contact-modal" style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '1000' }}>
                    <div style={{ background: '#1c2b39', padding: '30px', borderRadius: '10px', width: '300px', textAlign: 'center', color: '#fff', border: '1px solid #4CAF50', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>Seller Details</h3>
                        <p style={{ margin: '5px 0' }}><strong>Farmer:</strong> {selectedContact.username}</p>
                        <p style={{ margin: '5px 0' }}><strong>Crop:</strong> {selectedContact.cropName}</p>
                        <div style={{ margin: '20px 0', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                            📞 {selectedContact.contactPhone || 'N/A'}
                        </div>
                        <button onClick={() => setSelectedContact(null)} style={{ padding: '8px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketPlace;
