import React, { useState, useEffect } from "react";
import API_BASE_URL from "../apiConfig";
import LandForm from "./LandForm";
import ComplaintForm from "./ComplaintForm";
import FeedbackForm from "./FeedbackForm";
import MarketTicker from "./MarketTicker";
import ProductList from "./ProductList";
import MarketPlace from "./MarketPlace";
import Settings from "./Settings";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { useTranslation } from "react-i18next";
import "./FarmerDashboard.css";

const FarmerDashboard = ({ user }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [complaints, setComplaints] = useState([]);
    const [landData, setLandData] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [publicStats, setPublicStats] = useState(null);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (activeTab === "complaints") fetchComplaints();
        if (activeTab === "profile") fetchLand();
        if (activeTab === "dashboard") fetchRecommendations();
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

    const fetchRecommendations = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/recommendations/${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setRecommendations(data);
            }
        } catch (e) {
            console.error("Failed to fetch recommendations");
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

    const fetchLand = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/land/${user.id}`);
            const data = await res.json();
            setLandData(data);
        } catch (e) {
            console.error("Failed to fetch land data");
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
                    <div className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                        {t("home")}
                    </div>
                    <div className={`menu-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                        {t("my_profile")}
                    </div>
                    <div className={`menu-item ${activeTab === "buy" ? "active" : ""}`} onClick={() => setActiveTab("buy")}>
                        {t("buy_products")}
                    </div>
                    <div className={`menu-item ${activeTab === "sell" ? "active" : ""}`} onClick={() => setActiveTab("sell")}>
                        {t("sell_crops")}
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
                    <div className={`menu-item ${activeTab === "subsidy" ? "active" : ""}`} onClick={() => setActiveTab("subsidy")}>
                        {t("subsidy_track")}
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

                {/* Content Area - Transparent for dashboard tab to show background */}
                <div className="content-area" style={{ backgroundColor: activeTab === "dashboard" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.95)" }}>
                    {activeTab === "dashboard" && (
                        <div className="welcome-panel">
                            {/* Text needs to be white again if background is transparent */}
                            <h2 style={{ color: "white", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>Welcome to Khedut Bandhu</h2>
                            <p style={{ color: "white", textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>Select a service from the menu to proceed.</p>

                            {/* RECOMMENDATIONS SECTION */}
                            <div className="recommendations-box" style={{ background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '10px', marginTop: '20px', color: 'white', textAlign: 'left' }}>
                                <h3 style={{ color: '#90ee90', borderBottom: '1px solid #90ee90', paddingBottom: '5px' }}>
                                    Recommended for {recommendations?.season || "this Season"}
                                </h3>
                                {recommendations ? (
                                    <>
                                        <p><strong>Crops:</strong> {recommendations.crops.join(", ")}</p>
                                        <p><strong>Pesticides:</strong> {recommendations.pesticides.join(", ")}</p>
                                        <div style={{ marginTop: "10px" }}>
                                            <strong>Tips:</strong>
                                            <ul style={{ paddingLeft: "20px", margin: "5px 0" }}>
                                                {recommendations.tips.map((tip, index) => (
                                                    <li key={index}>{tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <p>Loading recommendations based on your land...</p>
                                )}
                            </div>

                            <div className="quick-links">
                                <button onClick={() => setActiveTab("buy")}>Buy Products</button>
                                <button onClick={() => setActiveTab("complaints")}>File Complaint</button>
                                <button onClick={() => setActiveTab("subsidy")}>Apply for Subsidy</button>
                            </div>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="profile-container">
                            {/* Passed to LandForm for "Complete Profile & Land Details" style */}
                            <LandForm user={user} existingData={landData} onSuccess={fetchLand} />
                        </div>
                    )}

                    {activeTab === "buy" && <ProductList user={user} />}

                    {activeTab === "sell" && <MarketPlace user={user} />}

                    {activeTab === "complaints" && (
                        <div className="complaints-section">
                            <h3>My Complaints</h3>
                            <ComplaintForm user={user} onSuccess={fetchComplaints} />
                            <div className="complaint-list" style={{ marginTop: "20px" }}>
                                {complaints.map(c => (
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
                                ))}
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

                    {activeTab === "subsidy" && (
                        <div className="subsidy-section">
                            <h3 style={{ borderBottom: "2px solid #28a745", paddingBottom: "10px", color: "#28a745" }}>
                                Government Subsidy Portals
                            </h3>
                            <div className="subsidy-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginTop: "20px" }}>

                                <div className="portal-card" style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px", textAlign: "center", background: "#fdfdfd" }}>
                                    <h4 style={{ color: "#28a745" }}>i-Khedut Portal</h4>
                                    <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>Official Gujarat Govt Portal for various agricultural schemes and subsidies.</p>
                                    <a href="https://ikhedut.gujarat.gov.in" target="_blank" rel="noopener noreferrer"
                                        style={{ display: "inline-block", padding: "10px 15px", background: "#007bff", color: "white", textDecoration: "none", borderRadius: "5px" }}>
                                        Visit i-Khedut
                                    </a>
                                </div>

                                <div className="portal-card" style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px", textAlign: "center", background: "#fdfdfd" }}>
                                    <h4 style={{ color: "#28a745" }}>PM Kisan</h4>
                                    <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>PM Kisan Samman Nidhi Yojana statuses and beneficiary details.</p>
                                    <a href="https://pmkisan.gov.in" target="_blank" rel="noopener noreferrer"
                                        style={{ display: "inline-block", padding: "10px 15px", background: "#007bff", color: "white", textDecoration: "none", borderRadius: "5px" }}>
                                        Visit PM Kisan
                                    </a>
                                </div>

                                <div className="portal-card" style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px", textAlign: "center", background: "#fdfdfd" }}>
                                    <h4 style={{ color: "#28a745" }}>Digital Gujarat</h4>
                                    <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>Common Service Portal for citizen services and scholarships.</p>
                                    <a href="https://www.digitalgujarat.gov.in" target="_blank" rel="noopener noreferrer"
                                        style={{ display: "inline-block", padding: "10px 15px", background: "#007bff", color: "white", textDecoration: "none", borderRadius: "5px" }}>
                                        Visit Digital Gujarat
                                    </a>
                                </div>

                                <div className="portal-card" style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px", textAlign: "center", background: "#fdfdfd" }}>
                                    <h4 style={{ color: "#28a745" }}>Agri DBT</h4>
                                    <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>Direct Benefit Transfer for Agricultural Mechanization.</p>
                                    <a href="https://agri-dbt.gov.in" target="_blank" rel="noopener noreferrer"
                                        style={{ display: "inline-block", padding: "10px 15px", background: "#007bff", color: "white", textDecoration: "none", borderRadius: "5px" }}>
                                        Visit Agri DBT
                                    </a>
                                </div>

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

export default FarmerDashboard;
