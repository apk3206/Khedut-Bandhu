import React, { useState, useEffect } from "react";
import API_BASE_URL from "../apiConfig";
import ComplaintForm from "./ComplaintForm";
import FeedbackForm from "./FeedbackForm";
import MarketTicker from "./MarketTicker";
import ProductList from "./ProductList"; // For buying Inputs (Pesticides, Seeds)
import MarketPlace from "./MarketPlace"; // For buying Crops
import Settings from "./Settings";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { useTranslation } from "react-i18next";
import "./FarmerDashboard.css"; // Reuse Farmer styles for consistency

const BuyerDashboard = ({ user }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [complaints, setComplaints] = useState([]);
    const [publicStats, setPublicStats] = useState(null);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (activeTab === "complaints") fetchComplaints();
        if (activeTab === "stats") fetchPublicStats();
        if (activeTab === "orders") fetchOrders();
    }, [activeTab]);

    const fetchPublicStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/complaint/stats/public`);
            if (res.ok) {
                const data = await res.json();
                setPublicStats(data);
            }
        } catch (e) {
            console.error("Failed to fetch public stats");
        }
    };

    const fetchComplaints = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/complaint/user/${user.id}`);
            const data = await res.json();
            setComplaints(data);
        } catch (e) {
            console.error("Failed to fetch complaints");
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/${user.id}/orders`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (e) {
            console.error("Failed to fetch orders");
        }
    };

    return (
        <div className="khedut-dashboard">
            <MarketTicker />

            <div className="main-layout">
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="sidebar-header">
                        <h3>{t("welcome")}, {user.username}</h3>
                        <small>General User</small>
                    </div>

                    <div className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                        {t("home")}
                    </div>
                    <div className={`menu-item ${activeTab === "market" ? "active" : ""}`} onClick={() => setActiveTab("market")}>
                        {t("buy_crops")} {/* MarketPlace */}
                    </div>
                    <div className={`menu-item ${activeTab === "store" ? "active" : ""}`} onClick={() => setActiveTab("store")}>
                        {t("buy_inputs")} {/* ProductList (Seeds/Pesticides) */}
                    </div>
                    <div className={`menu-item ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
                        {t("my_orders")} 📦
                        {orders.filter(o => o.status !== "Delivered").length > 0 && (
                            <span className="sidebar-badge">{orders.filter(o => o.status !== "Delivered").length}</span>
                        )}
                    </div>
                    <div className={`menu-item ${activeTab === "complaints" ? "active" : ""}`} onClick={() => setActiveTab("complaints")}>
                        {t("complaints")}
                        {complaints.filter(c => c.status === "Pending" || c.status === "In Progress").length > 0 && (
                            <span className="sidebar-badge">{complaints.filter(c => c.status === "Pending" || c.status === "In Progress").length}</span>
                        )}
                    </div>
                    <div className={`menu-item ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
                        {t("settings")}
                    </div>
                    <div className={`menu-item ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>
                        {t("statistics")} 📊
                    </div>
                    <div className={`menu-item ${activeTab === "feedback" ? "active" : ""}`} onClick={() => setActiveTab("feedback")}>
                        Feedback & Suggestions 💡
                    </div>
                </div>

                {/* Content Area */}
                <div className="content-area" style={{ backgroundColor: activeTab === "dashboard" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.95)" }}>

                    {activeTab === "dashboard" && (
                        <div className="welcome-panel">
                            <h2 style={{ color: "white", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>Welcome to Khedut Bandhu</h2>
                            <p style={{ color: "white", textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>
                                Access fresh crops directly from farmers and premium agricultural inputs.
                            </p>

                            <div className="quick-links" style={{ justifyContent: 'center' }}>
                                <button onClick={() => setActiveTab("market")}>Buy Crops</button>
                                <button onClick={() => setActiveTab("store")}>Buy Seeds/Pesticides</button>
                                <button onClick={() => setActiveTab("complaints")}>File Complaint</button>
                            </div>
                        </div>
                    )}

                    {/* MarketPlace for Buying Crops */}
                    {activeTab === "market" && <MarketPlace user={user} defaultTab="buy" />}

                    {/* ProductList for Buying Inputs */}
                    {activeTab === "store" && <ProductList user={user} />}

                    {/* Complaints Section */}
                    {activeTab === "complaints" && (
                        <div className="complaints-section">
                            <h3>My Complaints</h3>
                            <ComplaintForm user={user} onSuccess={fetchComplaints} />
                            <div className="complaint-list" style={{ marginTop: "20px" }}>
                                {complaints.length === 0 ? <p>No complaints found.</p> : (
                                    complaints.map(c => (
                                        <div key={c._id} className="complaint-card">
                                            <h4>{c.subject} - <span style={{ color: c.status === "Pending" ? "orange" : "green", fontWeight: "bold" }}>{c.status}</span></h4>
                                            <p>{c.description}</p>
                                            {c.mediaUrl && (
                                                <div style={{ marginTop: "10px" }}>
                                                    <a href={`${API_BASE_URL}${c.mediaUrl}`} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={`${API_BASE_URL}${c.mediaUrl}`}
                                                            alt="Complaint Media"
                                                            className="complaint-thumb"
                                                        />
                                                    </a>
                                                </div>
                                            )}
                                            {c.adminResponse && <p style={{ background: "#f8f9fa", padding: "10px", borderLeft: "4px solid #28a745" }}><strong>Admin:</strong> {c.adminResponse}</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "orders" && (
                        <div className="orders-section">
                            <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>{t("my_orders")}</h3>
                            <div className="order-list" style={{ marginTop: "20px" }}>
                                {orders.length === 0 ? <p>{t("no_orders_found")}</p> : (
                                    orders.map(order => (
                                        <div key={order._id} className="complaint-card" style={{ marginBottom: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h4>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</h4>
                                                <span className={`status-badge status-${order.status || 'Pending'}`} style={{
                                                    padding: '5px 10px',
                                                    borderRadius: '15px',
                                                    background: order.status === 'Delivered' ? '#d4edda' : '#fff3cd',
                                                    color: order.status === 'Delivered' ? '#155724' : '#856404',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {order.status || 'Pending'}
                                                </span>
                                            </div>
                                            <div style={{ margin: '10px 0' }}>
                                                {order.products.map((p, idx) => (
                                                    <div key={idx} style={{ fontSize: '14px', color: '#555' }}>
                                                        {p.productId ? p.productId.name : 'Product'} x {p.quantity} - ₹{p.priceAtPurchase * p.quantity}
                                                    </div>
                                                ))}
                                            </div>
                                            <p style={{ fontWeight: 'bold' }}>Total: ₹{order.totalAmount}</p>
                                            <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                                                <p style={{ margin: 0, fontSize: '14px' }}>
                                                    <strong>🚚 Expected Delivery:</strong> {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '3-5 Business Days'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "settings" && <Settings user={user} />}

                    {activeTab === "stats" && (
                        <div className="stats-section" style={{ background: "transparent", padding: "0" }}>
                            {publicStats ? (
                                <AnalyticsDashboard stats={publicStats} userRole={user.role} />
                            ) : (
                                <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
                                    <p>Loading Agricultural Intelligence...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "feedback" && (
                        <div className="feedback-section">
                            <FeedbackForm user={user} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuyerDashboard;
