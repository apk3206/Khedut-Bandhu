import React, { useState, useEffect, useCallback } from "react";
import API_BASE_URL from "../apiConfig";
import AddProduct from "./AddProduct";
import AnalyticsDashboard from "./AnalyticsDashboard";
import Settings from "./Settings";
import { useTranslation } from "react-i18next";
import "./AdminDashboard.css";
import MarketTicker from "./MarketTicker";

const AdminDashboard = ({ user }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("complaints");
    const [complaints, setComplaints] = useState([]);
    const [users, setUsers] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [statsData, setStatsData] = useState(null);
    const [allOrders, setAllOrders] = useState([]);

    // Filters
    const [cStartDate, setCStartDate] = useState("");
    const [cEndDate, setCEndDate] = useState("");
    const [oStartDate, setOStartDate] = useState("");
    const [oEndDate, setOEndDate] = useState("");

    useEffect(() => {
        if (activeTab === "complaints" || activeTab === "stats") fetchComplaints();
        if (activeTab === "users") fetchUsers();
        if (activeTab === "stats") fetchStats();
        if (activeTab === "feedback") fetchFeedbacks();
        if (activeTab === "orders") fetchAllOrders();

        // 🔄 LIVE UPDATE: Poll for stats every 30 seconds if stats tab is active
        let interval;
        if (activeTab === "stats") {
            interval = setInterval(fetchStats, 30000);
        }
        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, []);

    const deleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_BASE_URL}/api/user/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            alert("Error deleting user");
        }
    };

    const fetchComplaints = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            // Pass User Role and Department for Server-Side Filtering
            // const queryParams = new URLSearchParams({
            //     role: user.role,
            //     department: user.department || ""
            // });

            const res = await fetch(`${API_BASE_URL}/api/complaint/admin/all?role=${user.role}&department=${user.department || ""}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setComplaints(Array.isArray(data) ? data : []); // Data is already filtered by backend
        } catch (error) {
            console.error("Error fetching complaints:", error);
            setComplaints([]);
        }
    }, [user.role, user.department]);

    const fetchFeedbacks = async () => {
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams({
                role: user.role,
                department: user.department || ""
            });

            const res = await fetch(`${API_BASE_URL}/api/feedback/admin/all?${queryParams.toString()}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setFeedbacks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
        }
    };

    const updateFeedbackStatus = async (id, status) => {
        const token = localStorage.getItem("token");
        try {
            await fetch(`${API_BASE_URL}/api/feedback/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status }),
            });
            fetchFeedbacks();
        } catch (error) {
            alert("Error updating feedback status");
        }
    };

    const updateStatus = async (id, status, adminResponse) => {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/api/complaint/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status, adminResponse }),
        });
        fetchComplaints();
    };

    const fetchStats = async () => {
        const token = localStorage.getItem("token");
        try {
            let res;
            if (user.role === "admin") {
                res = await fetch(`${API_BASE_URL}/api/admin/stats/supreme`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
            } else {
                res = await fetch(`${API_BASE_URL}/api/admin/stats/dept/${user.department}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
            }
            if (res.ok) {
                const data = await res.json();
                setStatsData(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchAllOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/orders/all`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAllOrders(Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []));
            }
        } catch (error) {
            console.error("Error fetching all orders:", error);
            setAllOrders([]);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/order/${orderId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchAllOrders(); // Refresh
            }
        } catch (error) {
            alert("Error updating order status");
        }
    };

    return (
        <div className="admin-dashboard-container">
            {/* Show Market Ticker for everyone EXCEPT Complaint Dept (irrelevant) */}
            {user.department !== "Complaint" && <MarketTicker />}

            <div className="main-layout">
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="sidebar-header">
                        <h3>{t("role_admin")} Panel</h3>
                        {user.role === "dept_admin" && <small>{user.department} Dept</small>}
                    </div>
                    <div className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                        {t("dashboard")}
                    </div>
                    <div className={`menu-item ${activeTab === "complaints" ? "active" : ""}`} onClick={() => setActiveTab("complaints")}>
                        {t("complaints")}
                        {(Array.isArray(complaints) ? complaints : []).filter(c => c.status === "Pending").length > 0 && (
                            <span className="sidebar-badge">{(Array.isArray(complaints) ? complaints : []).filter(c => c.status === "Pending").length}</span>
                        )}
                    </div>
                    <div className={`menu-item ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>
                        {t("stats")}
                    </div>
                    {user.role === "admin" && (
                        <div className={`menu-item ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
                            {t("user_management")}
                        </div>
                    )}
                    <div className={`menu-item ${activeTab === "feedback" ? "active" : ""}`} onClick={() => setActiveTab("feedback")}>
                        {t("feedback_suggestions")} 💡
                        {Array.isArray(feedbacks) && feedbacks.filter(f => f.status === "Pending").length > 0 && (
                            <span className="sidebar-badge">{feedbacks.filter(f => f.status === "Pending").length}</span>
                        )}
                    </div>
                    {(user.role === "admin" || user.department === "Orders") && (
                        <div className={`menu-item ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
                            Orders 📦
                            {(Array.isArray(allOrders) ? allOrders : []).filter(o => o.status === "Pending").length > 0 && (
                                <span className="sidebar-badge">{(Array.isArray(allOrders) ? allOrders : []).filter(o => o.status === "Pending").length}</span>
                            )}
                        </div>
                    )}

                    {/* Hide "Products" for Departments that don't escalate/manage physical stock (e.g., MarketPrice, Complaint) */}
                    {/* Assuming "MarketPrice" deals with Rates, not physical "Products" to sell. */}
                    {(user.role === "admin" || !["MarketPrice", "Complaint"].includes(user.department)) && (
                        <div className={`menu-item ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>
                            {t("products")}
                        </div>
                    )}

                    <div className={`menu-item ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
                        {t("settings")}
                    </div>
                </div>

                {/* Content Area */}
                <div className="content-area">
                    {activeTab === "dashboard" && (
                        <div className="welcome-panel">
                            <h2 style={{ color: "white", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>{t("welcome")}, {user.username}</h2>
                            <p style={{ color: "white", textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>Admin Control Center</p>
                        </div>
                    )}

                    {activeTab === "complaints" && (() => {
                        const filteredComplaints = (Array.isArray(complaints) ? complaints : []).filter(c => {
                            if (!cStartDate && !cEndDate) return true;
                            const cDate = new Date(c.createdAt || c.date);
                            if (cStartDate && cDate < new Date(cStartDate)) return false;
                            if (cEndDate) {
                                const endDate = new Date(cEndDate);
                                endDate.setHours(23, 59, 59, 999);
                                if (cDate > endDate) return false;
                            }
                            return true;
                        });
                        return (
                        <div className="admin-section">
                            <h3>{t("complaints")} Management</h3>
                            <div className="filters" style={{ marginBottom: "15px", display: "flex", gap: "10px", alignItems: "center" }}>
                                <label style={{ color: "#6b8cae", fontWeight: 600, fontSize: "12px" }}>FROM: <input type="date" value={cStartDate} onChange={(e) => setCStartDate(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e8f4f8" }} /></label>
                                <label style={{ color: "#6b8cae", fontWeight: 600, fontSize: "12px" }}>TO: <input type="date" value={cEndDate} onChange={(e) => setCEndDate(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e8f4f8" }} /></label>
                                <span style={{ marginLeft: "10px", fontWeight: 700, color: "#2ecc71" }}>Showing {filteredComplaints.length} complaints</span>
                            </div>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Dept</th>
                                            <th>Subject</th>
                                            <th>Media</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredComplaints.length === 0 ? (
                                            <tr><td colSpan="6">No complaints found.</td></tr>
                                        ) : (
                                            filteredComplaints.map(c => (
                                                <tr key={c._id}>
                                                    <td>{c.userId?.username || "Unknown"}</td>
                                                    <td>{c.department || "General"}</td>
                                                    <td>
                                                        <strong>{c.subject}</strong>
                                                        <p className="desc-preview">{c.description}</p>
                                                    </td>
                                                    <td>
                                                        {c.mediaUrl ? (
                                                            <a href={`${API_BASE_URL}${c.mediaUrl}`} target="_blank" rel="noopener noreferrer">
                                                                <img
                                                                    src={`${API_BASE_URL}${c.mediaUrl}`}
                                                                    alt="Complaint Media"
                                                                    className="complaint-thumb"
                                                                />
                                                            </a>
                                                        ) : "-"}
                                                    </td>
                                                    <td><span className={`status ${c.status.toLowerCase()}`}>{c.status}</span></td>
                                                    <td>
                                                        <select
                                                            onChange={(e) => updateStatus(c._id, e.target.value, "Status Updated via Admin Panel")}
                                                            defaultValue=""
                                                            className="status-select"
                                                        >
                                                            <option value="" disabled>Update Status</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Resolved">Resolved</option>
                                                            <option value="Rejected">Rejected</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )})()}

                    {activeTab === "feedback" && (
                        <div className="admin-section">
                            <h3>{t("feedback_suggestions")}</h3>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Type</th>
                                            <th>Dept</th>
                                            <th>Subject</th>
                                            <th>Media</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feedbacks.length === 0 ? (
                                            <tr><td colSpan="5">No feedback found.</td></tr>
                                        ) : (
                                            feedbacks.map(f => (
                                                <tr key={f._id}>
                                                    <td>{f.userId?.username || "Unknown"}</td>
                                                    <td>{f.type}</td>
                                                    <td>{f.department || "-"}</td>
                                                    <td>
                                                        <strong>{f.subject}</strong>
                                                        <p className="desc-preview">{f.description}</p>
                                                    </td>
                                                    <td>
                                                        {f.mediaUrl ? (
                                                            <a href={`${API_BASE_URL}${f.mediaUrl}`} target="_blank" rel="noopener noreferrer">
                                                                <img
                                                                    src={`${API_BASE_URL}${f.mediaUrl}`}
                                                                    alt="Feedback Media"
                                                                    className="complaint-thumb"
                                                                />
                                                            </a>
                                                        ) : "-"}
                                                    </td>
                                                    <td>
                                                        <span className={`status ${f.status === "Pending" ? "pending" : f.status === "Rejected" ? "rejected" : "resolved"}`} style={{ display: 'inline-block', marginBottom: '5px' }}>
                                                            {f.status}
                                                        </span>
                                                        <br />
                                                        <select
                                                            onChange={(e) => updateFeedbackStatus(f._id, e.target.value)}
                                                            className="status-select"
                                                            value={f.status || "Pending"}
                                                            style={{ padding: '5px', borderRadius: '4px', marginTop: '5px' }}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Resolved">Resolved</option>
                                                            <option value="Rejected">Rejected</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "stats" && (
                        <div className="admin-section">
                            {/* Advanced Live Statistics Section - Handles grid and charts */}
                            {statsData ? (
                                <AnalyticsDashboard stats={statsData} userRole={user.role} />
                            ) : (
                                <div className="loading-stats" style={{ textAlign: "center", padding: "50px" }}>
                                    <div className="spinner"></div>
                                    <p>{t("wait_live_data")}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "users" && user.role === "admin" && (
                        <div className="admin-section">
                            <h3>{t("user_management")}</h3>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Department</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length === 0 ? (
                                            <tr><td colSpan="5">No users found.</td></tr>
                                        ) : (
                                            users.map(u => (
                                                <tr key={u._id}>
                                                    <td>{u.username}</td>
                                                    <td>{u.email}</td>
                                                    <td>
                                                        <span className={`status ${u.role === "admin" ? "rejected" : u.role === "dept_admin" ? "inprogress" : "resolved"}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td>{u.department || "-"}</td>
                                                    <td>
                                                        {u.role !== "admin" && (
                                                            <button
                                                                onClick={() => deleteUser(u._id)}
                                                                style={{ padding: "5px 10px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "orders" && (() => {
                        const filteredOrders = (Array.isArray(allOrders) ? allOrders : []).filter(o => {
                            if (!oStartDate && !oEndDate) return true;
                            const oDate = new Date(o.createdAt || o.orderDate);
                            if (oStartDate && oDate < new Date(oStartDate)) return false;
                            if (oEndDate) {
                                const endDate = new Date(oEndDate);
                                endDate.setHours(23, 59, 59, 999);
                                if (oDate > endDate) return false;
                            }
                            return true;
                        });
                        const purchasesCount = filteredOrders.length;
                        const cancellationsCount = filteredOrders.filter(o => o.status === 'Cancelled').length;

                        return (
                        <div className="admin-section">
                            <h3>Orders Management</h3>
                            <div className="filters" style={{ marginBottom: "15px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                                <label style={{ color: "#6b8cae", fontWeight: 600, fontSize: "12px" }}>FROM: <input type="date" value={oStartDate} onChange={(e) => setOStartDate(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e8f4f8" }} /></label>
                                <label style={{ color: "#6b8cae", fontWeight: 600, fontSize: "12px" }}>TO: <input type="date" value={oEndDate} onChange={(e) => setOEndDate(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e8f4f8" }} /></label>
                                <span style={{ marginLeft: "10px", fontWeight: 700, color: "#2ecc71" }}>Total Purchases: {purchasesCount} | Cancellations: {cancellationsCount}</span>
                            </div>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>User</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Payment Info</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.length === 0 ? (
                                            <tr><td colSpan="7">No orders found.</td></tr>
                                        ) : (
                                            filteredOrders.map(order => (
                                                <tr key={order._id}>
                                                    <td>#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                                                    <td>{order.userId?.username || "Unknown"}</td>
                                                    <td>{order.products.length} Items</td>
                                                    <td>₹{order.totalAmount}</td>
                                                    <td>
                                                        <div style={{ fontSize: '11px' }}>
                                                            <strong>{order.paymentMethod}</strong><br/>
                                                            {order.transactionId && <span style={{ color: '#28a745' }}>ID: {order.transactionId}</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`status ${order.status?.toLowerCase() || 'pending'}`}>{order.status || 'Pending'}</span>
                                                        {order.status === 'Cancelled' && order.cancellationDetails && (
                                                            <div className="admin-refund-hint" style={{ fontSize: '11px', marginTop: '5px', color: '#666' }}>
                                                                UPI: <strong>{order.cancellationDetails.userRefundUpi}</strong><br/>
                                                                Refund: <strong>₹{order.cancellationDetails.refundAmount}</strong>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <select
                                                            onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                                                            className="status-select"
                                                            value={order.status || "Pending"}
                                                            style={{ padding: '5px', borderRadius: '4px' }}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Processing">Processing</option>
                                                            <option value="Shipped">Shipped</option>
                                                            <option value="Delivered">Delivered</option>
                                                            <option value="Cancelled">Cancelled</option>
                                                        </select>
                                                        
                                                        {order.status === 'Cancelled' && order.cancellationDetails && (
                                                            <div style={{ marginTop: '10px' }}>
                                                                <a 
                                                                    href={`upi://pay?pa=${order.cancellationDetails.userRefundUpi}&pn=${order.userId?.username || 'User'}&am=${order.cancellationDetails.refundAmount}&cu=INR`}
                                                                    className="verify-small-btn"
                                                                    style={{ background: '#28a745', textDecoration: 'none', display: 'inline-block', fontSize: '11px', padding: '5px 10px' }}
                                                                >
                                                                    💰 Refund via UPI
                                                                </a>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )})()}

                    {activeTab === "products" && (
                        <ProductManagement user={user} />
                    )}

                    {activeTab === "settings" && (
                        <Settings user={user} />
                    )}
                </div>
            </div>
        </div>
    );
};

const ProductManagement = ({ user }) => {
    const [products, setProducts] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [priceFilter, setPriceFilter] = useState("");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        let url = "/api/products";
        if (user.role === "dept_admin" && user.department) {
            url += `?category=${user.department}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setProducts(data);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this product?")) return;
        await fetch(`/api/products/${id}`, { method: "DELETE" });
        fetchProducts();
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowAddForm(true);
    };

    const handleFormClose = () => {
        setShowAddForm(false);
        setEditingProduct(null);
    };

    const filteredProducts = products.filter(p => {
        if (!priceFilter) return true;
        if (priceFilter === "low") return p.price < 500;
        if (priceFilter === "medium") return p.price >= 500 && p.price <= 1500;
        if (priceFilter === "high") return p.price > 1500;
        return true;
    });

    return (
        <div className="admin-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <h3>Product Management {user.role === "dept_admin" && `(${user.department})`}</h3>
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                    <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}>
                        <option value="">All Prices</option>
                        <option value="low">Low (Under ₹500)</option>
                        <option value="medium">Medium (₹500 - ₹1500)</option>
                        <option value="high">High (Over ₹1500)</option>
                    </select>
                    <button
                        onClick={() => {
                            if (showAddForm) handleFormClose();
                            else setShowAddForm(true);
                        }}
                        className="add-btn"
                        style={{ padding: "10px", background: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                    >
                        {showAddForm ? "Close Form" : "+ Add Product"}
                    </button>
                </div>
            </div>

            {showAddForm && (
                <AddProduct
                    onSuccess={() => { handleFormClose(); fetchProducts(); }}
                    onCancel={handleFormClose}
                    user={user}
                    product={editingProduct}
                />
            )}

            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr><td colSpan="6">No products found.</td></tr>
                        ) : (
                            filteredProducts.map(p => (
                                <tr key={p._id}>
                                    <td><img src={p.imageUrl || "https://via.placeholder.com/50"} alt="" style={{ width: "50px", height: "50px", objectFit: "cover" }} /></td>
                                    <td>{p.name}</td>
                                    <td>{p.category}</td>
                                    <td>₹{p.price}</td>
                                    <td>{p.stock}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                onClick={() => handleEdit(p)}
                                                style={{ padding: "5px 10px", background: "#ffc107", color: "black", border: "none", borderRadius: "4px", cursor: "pointer" }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p._id)}
                                                style={{ padding: "5px 10px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
