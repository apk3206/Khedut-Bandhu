import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../apiConfig';
import { useTranslation } from 'react-i18next';
import './LogisticsBooking.css';

const LogisticsBooking = ({ user }) => {
    const { t } = useTranslation();
    const [myListings, setMyListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState(null);
    const [bookingStatus, setBookingStatus] = useState(null); // 'loading', 'success', null

    const logisticPartners = [
        { id: 1, name: "AgriTrans Logistics", rate: "₹12/km", rating: 4.8, vehicles: ["Tractor-Trailer", "Tempo"] },
        { id: 2, name: "Khedut Carrier Co.", rate: "₹10/km", rating: 4.5, vehicles: ["Mini Truck", "Pick-up"] },
        { id: 3, name: "Village Express", rate: "₹15/km", rating: 4.9, vehicles: ["Heavy Truck"] }
    ];

    useEffect(() => {
        fetchMyListings();
    }, []);

    const fetchMyListings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/market/listings`);
            const data = await res.json();
            // In a real app, we'd filter at the API level
            const mine = data.filter(l => l.userId === user.id || l.userId === user._id);
            setMyListings(mine);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleBook = (partner) => {
        setBookingStatus('loading');
        // Simulate API call to 3PL
        setTimeout(() => {
            setBookingStatus('success');
            setTimeout(() => {
                setBookingStatus(null);
                setSelectedListing(null);
                // In real app, we'd update the listing status to 'In Transit'
            }, 3000);
        }, 2000);
    };

    return (
        <div className="logistics-container">
            <div className="logistics-header">
                <h2>{t('logistics_management') || "Transport & Logistics"}</h2>
                <p>{t('logistics_subtitle') || "Book professional transport for your sold crops directly to the buyer's location."}</p>
            </div>

            {loading ? (
                <p className="loading-text">Loading your listings...</p>
            ) : myListings.length === 0 ? (
                <div className="empty-state">
                    <p>No active listings found. List your crops in the MarketPlace first.</p>
                </div>
            ) : (
                <div className="logistics-grid">
                    <div className="listings-panel">
                        <h3>{t('select_crop_to_ship') || "Select Crop to Ship"}</h3>
                        {myListings.map(l => (
                            <div 
                                key={l._id} 
                                className={`listing-item ${selectedListing?._id === l._id ? 'selected' : ''}`}
                                onClick={() => setSelectedListing(l)}
                            >
                                <div className="listing-info">
                                    <strong>{l.cropName}</strong>
                                    <span>{l.quantity} {l.unit || 'Quintal'}</span>
                                </div>
                                <span className={`status-tag ${l.status.toLowerCase()}`}>{l.status}</span>
                            </div>
                        ))}
                    </div>

                    <div className="booking-panel">
                        {selectedListing ? (
                            <>
                                <h3>{t('choose_transport_partner') || "Choose Transport Partner"}</h3>
                                <div className="partner-list">
                                    {logisticPartners.map(p => (
                                        <div key={p.id} className="partner-card">
                                            <div className="partner-main">
                                                <h4>{p.name}</h4>
                                                <div className="partner-meta">
                                                    <span className="rating">⭐ {p.rating}</span>
                                                    <span className="rate">{p.rate}</span>
                                                </div>
                                                <div className="vehicles">
                                                    {p.vehicles.map(v => <span key={v} className="v-tag">{v}</span>)}
                                                </div>
                                            </div>
                                            <button className="book-btn" onClick={() => handleBook(p)}>
                                                {t('book_pickup') || "Book Pickup"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="no-selection">
                                <p>Please select a listing from the left to see available transport partners.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {bookingStatus && (
                <div className="booking-overlay">
                    <div className="status-modal">
                        {bookingStatus === 'loading' ? (
                            <>
                                <div className="loader"></div>
                                <p>Connecting to Logistics Partner API...</p>
                            </>
                        ) : (
                            <>
                                <div className="success-icon">✔️</div>
                                <h3>Booking Confirmed!</h3>
                                <p>Truck is assigned and will arrive at your farm within 4 hours.</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogisticsBooking;
