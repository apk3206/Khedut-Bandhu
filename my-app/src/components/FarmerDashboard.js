import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../apiConfig";
import LandForm from "./LandForm";
import ComplaintForm from "./ComplaintForm";
import FeedbackForm from "./FeedbackForm";
import MarketTicker from "./MarketTicker";
import ProductList from "./ProductList";
import MarketPlace from "./MarketPlace";
import Settings from "./Settings";
import AnalyticsDashboard from "./AnalyticsDashboard";
import UserProfile from "../UserProfile";
import CropDiagnostics from "./CropDiagnostics";
import LogisticsBooking from "./LogisticsBooking";
import VoiceNavigation from "./VoiceNavigation";
import SmartWeatherWidget from "./SmartWeatherWidget";
import { useTranslation } from "react-i18next";
import "./FarmerDashboard.css";

const FarmerDashboard = ({ user }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [complaints, setComplaints] = useState([]);
    const [landData, setLandData] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [publicStats, setPublicStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [cStartDate, setCStartDate] = useState("");
    const [cEndDate, setCEndDate] = useState("");
    const [oStartDate, setOStartDate] = useState("");
    const [oEndDate, setOEndDate] = useState("");

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
            setComplaints(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Failed to fetch complaints");
            setComplaints([]);
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
            const userId = user?.id || user?._id || user?.user?.id || user?.user?._id;
            const res = await fetch(`${API_BASE_URL}/api/user/orders/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []));
            }
        } catch (e) {
            console.error("Failed to fetch orders");
            setOrders([]);
        }
    };

    const addToCart = async (product) => {
        const userId = user?.id || user?._id;
        if (!userId) return alert(t("login_to_review")); // Reusing login key

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/cart/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: product.name,
                    type: product.category,
                    quantity: 1,
                    price: product.price,
                    image: product.imageUrl || "/placeholder.png"
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`${t(product.name.toLowerCase()) || product.name} ${t("added_to_cart")}`);
                
                // Fetch the latest user object to get the updated cart
                const profileRes = await fetch(`${API_BASE_URL}/api/user/profile/${userId}`);
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (profileData.user) {
                        localStorage.setItem("user", JSON.stringify(profileData.user));
                        window.dispatchEvent(new Event('cartUpdated'));
                    }
                } else {
                    // Fallback: manually update if profile fetch fails
                    const updatedUser = { ...user, cart: data.cart || [...(user.cart || []), product] };
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    window.dispatchEvent(new Event('cartUpdated'));
                }
            } else {
                alert(t("order_failed"));
            }
        } catch (err) {
            console.error("Cart error:", err);
            alert(t("unknown_error"));
        }
    };

    return (
        <div className="khedut-dashboard" style={{ backgroundColor: "#1a1a2e", minHeight: "100vh" }}>
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
                        {(Array.isArray(orders) ? orders : []).filter(o => o.status !== "Delivered").length > 0 && (
                            <span className="sidebar-badge">{(Array.isArray(orders) ? orders : []).filter(o => o.status !== "Delivered").length}</span>
                        )}
                    </div>
                    <div className={`menu-item ${activeTab === "complaints" ? "active" : ""}`} onClick={() => setActiveTab("complaints")}>
                        {t("complaints")}
                        {(Array.isArray(complaints) ? complaints : []).filter(c => c.status === "Pending" || c.status === "In Progress").length > 0 && (
                            <span className="sidebar-badge">{(Array.isArray(complaints) ? complaints : []).filter(c => c.status === "Pending" || c.status === "In Progress").length}</span>
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
                    <div className={`menu-item ${activeTab === "ai" ? "active" : ""}`} onClick={() => setActiveTab("ai")}>
                        {t("ai_diagnostics") || "AI Diagnostics"} 🤖
                    </div>
                    <div className={`menu-item ${activeTab === "logistics" ? "active" : ""}`} onClick={() => setActiveTab("logistics")}>
                        {t("logistics") || "Logistics"} 🚛
                    </div>
                    <div className={`menu-item ${activeTab === "feedback" ? "active" : ""}`} onClick={() => setActiveTab("feedback")}>
                        {t("feedback_suggestions")} 💡
                    </div>
                </div>

                {/* Content Area - Transparent for dashboard tab to show background */}
                <div className="content-area">
                    {activeTab === "dashboard" && (
                        <div className="welcome-panel">
                            {/* Text needs to be white again if background is transparent */}
                            <h2 style={{ color: "white", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>{t("welcome_msg")}</h2>
                            <p style={{ color: "white", textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>{t("select_service")}</p>

                            {/* LIVE SATELLITE WEATHER WIDGET */}
                            <div style={{ marginTop: '25px', marginBottom: '15px' }}>
                                <SmartWeatherWidget />
                            </div>

                            {/* RECOMMENDATIONS SECTION */}
                            <div className="recommendations-box" style={{ background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '10px', marginTop: '20px', color: 'white', textAlign: 'left' }}>
                                <h3 style={{ color: '#90ee90', borderBottom: '1px solid #90ee90', paddingBottom: '5px' }}>
                                    {t("rec_for")} {t(recommendations?.season?.toLowerCase()) || recommendations?.season || t("this_season") || "this Season"}
                                </h3>
                                {recommendations ? (
                                    <>
                                        <p><strong>{t("crops_label")}</strong> {recommendations.crops.map(c => t(c?.toLowerCase()) || c).join(", ")}</p>
                                        <p><strong>{t("pesticides_label")}</strong> {recommendations.pesticides.map(p => t(p?.toLowerCase()) || p).join(", ")}</p>
                                        <div style={{ marginTop: "10px" }}>
                                            <strong>{t("tips_label")}</strong>
                                            <ul style={{ paddingLeft: "20px", margin: "5px 0" }}>
                                                {recommendations.tips.map((tip, index) => (
                                                    <li key={index}>{t(tip?.toLowerCase()) || tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <p>{t("loading_rec")}</p>
                                )}
                            </div>

                            <div className="quick-links">
                                <button onClick={() => setActiveTab("buy")}>{t("buy_products")}</button>
                                <button onClick={() => setActiveTab("complaints")}>{t("file_complaint")}</button>
                                <button onClick={() => setActiveTab("subsidy")}>{t("apply_subsidy")}</button>
                            </div>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <UserProfile user={user} />
                    )}

                    {activeTab === "buy" && <ProductList user={user} addToCart={addToCart} />}

                    {activeTab === "sell" && <MarketPlace user={user} />}

                    {activeTab === "complaints" && (() => {
                        const filteredComplaints = (Array.isArray(complaints) ? complaints : []).filter(c => {
                            if (!cStartDate && !cEndDate) return true;
                            const cDate = new Date(c.createdAt || c.submittedDate || Date.now());
                            if (cStartDate && cDate < new Date(cStartDate)) return false;
                            if (cEndDate) {
                                const endD = new Date(cEndDate);
                                endD.setHours(23, 59, 59, 999);
                                if (cDate > endD) return false;
                            }
                            return true;
                        });
                        return (
                        <div className="complaints-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                <h3 style={{ margin: 0, color: "#e8f4f8", fontSize: "22px" }}>{t("my_complaints") || "My Complaints"}</h3>
                                <div className="filters" style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(255,255,255,0.06)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)" }}>
                                    <label style={{ fontSize: "14px", fontWeight: "bold", color: "#6b8cae" }}>{t("from") || "From"}: <input type="date" value={cStartDate} onChange={(e) => setCStartDate(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#e8f4f8" }} /></label>
                                    <label style={{ fontSize: "14px", fontWeight: "bold", color: "#6b8cae" }}>{t("to") || "To"}: <input type="date" value={cEndDate} onChange={(e) => setCEndDate(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#e8f4f8" }} /></label>
                                </div>
                            </div>
                            <ComplaintForm user={user} onSuccess={fetchComplaints} />
                            <div className="complaint-list" style={{ marginTop: "20px" }}>
                                {filteredComplaints.length === 0 ? <p>{t("no_complaints_found_for_dates") || "No complaints found for the selected dates."}</p> : (
                                    filteredComplaints.map(c => (
                                        <div key={c._id} className="complaint-card" style={{ background: "rgba(17,34,64,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "15px", marginBottom: "15px", color: "#e8f4f8" }}>
                                            <h4>{t(c.subject.toLowerCase()) || c.subject} - <span style={{ color: c.status === "Pending" ? "#f39c12" : "#2ecc71", fontWeight: "bold" }}>{t(c.status.toLowerCase()) || c.status}</span></h4>
                                            <p style={{ color: "#8aadcc" }}>{t(c.description.toLowerCase()) || c.description}</p>
                                            {c.mediaUrl && (
                                                <div style={{ marginTop: "10px" }}>
                                                    <a href={`${API_BASE_URL}${c.mediaUrl}`} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={`${API_BASE_URL}${c.mediaUrl}`}
                                                            alt={t("complaint_media_alt")}
                                                            className="complaint-thumb"
                                                            style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}
                                                        />
                                                    </a>
                                                </div>
                                            )}
                                            {c.adminResponse && <p style={{ background: "rgba(39,174,96,0.1)", padding: "10px", borderLeft: "4px solid #2ecc71", color: "#2ecc71", marginTop: "10px", borderRadius: "4px" }}><strong>{t("admin_label")}</strong> {t(c.adminResponse.toLowerCase()) || c.adminResponse}</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )})()}

                    {activeTab === "orders" && (() => {
                        const filteredOrders = (Array.isArray(orders) ? orders : []).filter(o => {
                            if (!oStartDate && !oEndDate) return true;
                            const oDate = new Date(o.createdAt || o.orderDate || Date.now());
                            if (oStartDate && oDate < new Date(oStartDate)) return false;
                            if (oEndDate) {
                                const endDateObj = new Date(oEndDate);
                                endDateObj.setHours(23, 59, 59, 999);
                                if (oDate > endDateObj) return false;
                            }
                            return true;
                        });
                        return (
                        <div className="orders-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #28a745', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                <h3 style={{ margin: 0, border: 'none', padding: 0, color: "#e8f4f8", fontSize: "22px" }}>{t("my_orders")}</h3>
                                <div className="filters" style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(255,255,255,0.06)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)" }}>
                                    <label style={{ fontSize: "14px", fontWeight: "bold", color: "#6b8cae" }}>{t("from") || "From"}: <input type="date" value={oStartDate} onChange={(e) => setOStartDate(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#e8f4f8" }} /></label>
                                    <label style={{ fontSize: "14px", fontWeight: "bold", color: "#6b8cae" }}>{t("to") || "To"}: <input type="date" value={oEndDate} onChange={(e) => setOEndDate(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#e8f4f8" }} /></label>
                                </div>
                            </div>
                            <div className="order-list" style={{ marginTop: "20px" }}>
                                {filteredOrders.length === 0 ? <p>{t("no_orders_found") || "No orders found for the selected dates."}</p> : (
                                    filteredOrders.map(order => (
                                        <div key={order._id} className="complaint-card" style={{ background: "rgba(17,34,64,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "15px", marginBottom: '15px', color: "#e8f4f8" }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h4>{t("order_no")} {order._id.substring(order._id.length - 6).toUpperCase()}</h4>
                                                <span className={`status-badge status-${order.status || 'Pending'}`} style={{
                                                    padding: '5px 10px',
                                                    borderRadius: '15px',
                                                    background: order.status === 'Delivered' ? 'rgba(39,174,96,0.15)' : 'rgba(243,156,18,0.15)',
                                                    color: order.status === 'Delivered' ? '#2ecc71' : '#f39c12',
                                                    border: `1px solid ${order.status === 'Delivered' ? 'rgba(39,174,96,0.3)' : 'rgba(243,156,18,0.3)'}`,
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {t(order.status.toLowerCase()) || order.status || t("pending")}
                                                </span>
                                            </div>
                                            <div style={{ margin: '10px 0' }}>
                                                {(order.items || order.products || []).map((p, idx) => (
                                                    <div key={idx} style={{ fontSize: '14px', color: '#8aadcc' }}>
                                                        {p.productId ? p.productId.name : (p.name || t("product"))} x {p.quantity} - ₹{(p.priceAtPurchase || p.price) * p.quantity}
                                                    </div>
                                                ))}
                                            </div>
                                            <p style={{ fontWeight: 'bold', color: "#2ecc71" }}>{t("total") || "Total"}: ₹{order.totalAmount}</p>
                                            
                                            <div style={{ marginTop: '15px' }}>
                                                {['Confirmed', 'Delivered', 'Pending'].includes(order.status) && (
                                                    <button 
                                                        className="verify-small-btn"
                                                        style={{ background: '#218838', padding: '5px 10px', fontSize: '12px' }}
                                                        onClick={() => navigate("/invoice", { 
                                                            state: { 
                                                                order: order, 
                                                                items: (order.items || order.products || []).map(p => ({ 
                                                                    name: p.productId?.name || p.name || t("product"),
                                                                    quantity: p.quantity,
                                                                    price: p.priceAtPurchase || p.price
                                                                })), 
                                                                totalAmount: order.totalAmount, 
                                                                deliveryCharge: order.deliveryCharge || 0, 
                                                                paymentMethod: order.paymentMethod || "Digital", 
                                                                date: order.createdAt || Date.now() 
                                                            } 
                                                        })}
                                                    >
                                                        🧾 View Invoice
                                                    </button>
                                                )}
                                            </div>

                                            <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px' }}>
                                                <p style={{ margin: 0, fontSize: '14px', color: '#c8ddef' }}>
                                                    <strong style={{ color: "#2ecc71" }}>🚚 {t("expected_delivery")}</strong> {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : t("delivery_days")}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )})()}

                    {activeTab === "subsidy" && (
                        <div className="subsidy-section">
                            <h3 style={{ borderBottom: "2px solid #28a745", paddingBottom: "10px", color: "#28a745", fontSize: "24px" }}>
                                {t("government_subsidy_portals") || "Government Subsidy Portals"}
                            </h3>
                            
                            <div className="subsidy-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px", marginTop: "20px" }}>

                                {/* i-Khedut Portal */}
                                <div className="portal-card detailed-card">
                                    <div className="portal-header">
                                        <h4>i-Khedut Portal</h4>
                                        <a href="https://ikhedut.gujarat.gov.in" target="_blank" rel="noopener noreferrer" className="visit-btn">
                                            {t("visit_ikhedut") || "Visit i-Khedut"}
                                        </a>
                                    </div>
                                    <p className="portal-usage"><strong>{t("used_for")}:</strong> {t("portal_ikhedut_desc")}</p>
                                    
                                    <div className="docs-list">
                                        <h5>{t("req_docs")}</h5>
                                        <ul>
                                            <li><strong>{t("basic_id")}</strong> {t("aadhaar_mandatory")}, {t("voter_pan_optional")}</li>
                                            <li><strong>{t("address_proof")}</strong> {t("ration_light_bank")}</li>
                                            <li><strong>{t("land_records")}</strong> {t("utara_7_12")}, {t("form_8_a")}, {t("land_ownership")}</li>
                                            <li><strong>{t("bank_details")}</strong> {t("bank_passbook_ifsc")}, {t("aadhaar_linked_bank")}</li>
                                            <li><strong>{t("farmer_details")}</strong> {t("mobile_aadhaar_linked")}, {t("passport_photo")}</li>
                                            <li><strong>{t("other_scheme_docs")}</strong> {t("caste_cert")}, {t("income_cert")}, {t("equip_quote")}</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* PM Kisan */}
                                <div className="portal-card detailed-card">
                                    <div className="portal-header">
                                        <h4>PM Kisan</h4>
                                        <a href="https://pmkisan.gov.in" target="_blank" rel="noopener noreferrer" className="visit-btn">
                                            {t("visit_pmkisan") || "Visit PM Kisan"}
                                        </a>
                                    </div>
                                    <p className="portal-usage"><strong>{t("used_for")}:</strong> {t("portal_pmkisan_desc")}</p>
                                    
                                    <div className="docs-list">
                                        <h5>{t("req_docs")}</h5>
                                        <ul>
                                            <li><strong>{t("mandatory_docs")}</strong> {t("aadhaar_ekyc")}</li>
                                            <li><strong>{t("farmer_details")}</strong> {t("mobile_aadhaar_linked")}</li>
                                            <li><strong>{t("bank_details")}</strong> {t("bank_acc_ifsc")}</li>
                                            <li><strong>{t("land_records")}</strong> {t("land_proof_state")}</li>
                                            <li><strong>{t("personal_details")}</strong> {t("name_age_gender")}, {t("category_scst")}</li>
                                        </ul>
                                        <p className="important-note">⚠️ {t("pmkisan_important")}</p>
                                    </div>
                                </div>

                                {/* Digital Gujarat */}
                                <div className="portal-card detailed-card">
                                    <div className="portal-header">
                                        <h4>Digital Gujarat</h4>
                                        <a href="https://www.digitalgujarat.gov.in" target="_blank" rel="noopener noreferrer" className="visit-btn">
                                            {t("visit_digital_gujarat") || "Visit Digital Gujarat"}
                                        </a>
                                    </div>
                                    <p className="portal-usage"><strong>{t("used_for")}:</strong> {t("portal_digital_guj_desc")}</p>
                                    
                                    <div className="docs-list">
                                        <h5>{t("req_docs")}</h5>
                                        <ul>
                                            <li><strong>{t("basic_docs")}</strong> {t("aadhaar_mobile_email")}</li>
                                            <li><strong>{t("address_proof")}</strong> {t("ration_light_aadhaar")}</li>
                                            <li><strong>{t("income_proof")}</strong> {t("income_cert_mamlatdar")}</li>
                                            <li><strong>{t("caste_cert")}</strong> {t("caste_cert_scstobc")}</li>
                                            <li><strong>{t("edu_docs")}</strong> {t("marksheet_10_12")}, {t("bonafide_cert")}</li>
                                            <li><strong>{t("bank_details")}</strong> {t("bank_passbook_ifsc")}</li>
                                            <li><strong>{t("other_docs")}</strong> {t("passport_photo")}, {t("self_decl_form")}</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Agri DBT */}
                                <div className="portal-card detailed-card">
                                    <div className="portal-header">
                                        <h4>Agri DBT</h4>
                                        <a href="https://agri-dbt.gov.in" target="_blank" rel="noopener noreferrer" className="visit-btn">
                                            {t("visit_agri_dbt") || "Visit Agri DBT"}
                                        </a>
                                    </div>
                                    <p className="portal-usage"><strong>{t("used_for")}:</strong> {t("portal_agridbt_desc")}</p>
                                    
                                    <div className="docs-list">
                                        <h5>{t("req_docs")}</h5>
                                        <ul>
                                            <li><strong>{t("identity_proof")}</strong> {t("aadhaar_mandatory")}</li>
                                            <li><strong>{t("farmer_verification")}</strong> {t("farmer_id_reg")}</li>
                                            <li><strong>{t("land_records")}</strong> {t("utara_7_12")}, {t("land_ownership")}</li>
                                            <li><strong>{t("bank_details")}</strong> {t("aadhaar_linked_bank")}</li>
                                            <li><strong>{t("other_docs")}</strong> {t("mobile_aadhaar_linked")}, {t("scheme_specific")}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Common Documents Section */}
                            <div className="common-docs-panel" style={{ marginTop: "40px", padding: "25px", background: "#f8fff9", border: "2px solid #28a745", borderRadius: "12px" }}>
                                <h4 style={{ color: "#218838", marginBottom: "15px", borderBottom: "1px solid #28a745", paddingBottom: "10px" }}>
                                    🔥 {t("common_docs_heading")}
                                </h4>
                                <p style={{ fontSize: "15px", color: "#444", fontStyle: "italic", marginBottom: "15px" }}>
                                    "{t("common_docs_desc")}"
                                </p>
                                <div className="common-list" style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                                    {[ "common_aadhaar", "common_mobile", "common_bank", "common_land", "common_address", "common_photos" ].map(key => (
                                        <span key={key} style={{ padding: "8px 15px", background: "white", border: "1px solid #28a745", borderRadius: "20px", fontSize: "14px", fontWeight: "bold", color: "#28a745" }}>
                                            ✅ {t(key)}
                                        </span>
                                    ))}
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
                                    <p>{t("loading_ai") || "Loading Agricultural Intelligence..."}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "feedback" && (
                        <div className="feedback-section">
                            <FeedbackForm user={user} />
                        </div>
                    )}

                    {activeTab === "ai" && (
                        <CropDiagnostics />
                    )}

                    {activeTab === "logistics" && (
                        <LogisticsBooking user={user} />
                    )}
                </div>
            </div>
            <VoiceNavigation onNavigate={setActiveTab} />
        </div>
    );
};

export default FarmerDashboard;
