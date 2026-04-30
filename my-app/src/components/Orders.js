import React, { useState, useEffect } from "react";
import API_BASE_URL from "../apiConfig";
import { useNavigate } from "react-router-dom";
import "./Orders.css";

const Orders = ({ user }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [oStartDate, setOStartDate] = useState("");
    const [oEndDate, setOEndDate] = useState("");
    const userId = user?.id || user?._id || user?.user?.id || user?.user?._id;

    useEffect(() => {
        if (userId) fetchOrders();
    }, [userId]);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/orders/${userId}`);
            const data = await res.json();
            if (data.orders) {
                setOrders(data.orders.reverse()); // Latest first
            }
            setLoading(false);
        } catch (err) {
            console.error("Fetch orders error:", err);
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId, paymentMethod) => {
        const isDigital = paymentMethod !== 'COD';
        let refundUpi = "";

        if (isDigital) {
            const confirmMsg = "Cancelling this digital order will incur a 5% handling fee. The remaining 95% will be refunded to your account within 10-15 minutes. Proceed?";
            if (!window.confirm(confirmMsg)) return;
            
            refundUpi = window.prompt("Please enter your UPI ID for the refund (e.g., yourname@okaxis):");
            if (!refundUpi) return alert("UPI ID is required for a refund.");
        } else {
            if (!window.confirm("Are you sure you want to cancel this order?")) return;
        }

        console.log(`[DEBUG] Attempting Cancel: orderId=${orderId}, userId=${userId}`);

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/orders/cancel/${userId}/${orderId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refundUpi })
            });
            const data = await res.json();
            if (res.ok) {
                alert(isDigital 
                    ? `Order Cancelled. Refund of ₹${data.refundInfo.refund} (after ₹${data.refundInfo.fee} fee) is processing. ETA: 10-15 mins.`
                    : "Order Cancelled successfully.");
                fetchOrders();
            } else {
                alert(`Backend Error at ${API_BASE_URL}/api/user/orders/cancel/... \n\nMessage: ${data.message}\n${data.error ? "Details: " + data.error : ""}`);
            }
        } catch (err) {
            console.error("Cancel order error:", err);
            alert(`Network Error calling ${API_BASE_URL}\n\nError: ${err.message}`);
        }
    };

    if (loading) return <div className="loading">Loading orders...</div>;

    const filteredOrders = orders.filter(o => {
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
        <div className="orders-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
                <h2>My Orders</h2>
                <div className="filters" style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(255,255,255,0.06)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", color: "#c8ddef" }}>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>From: <input type="date" value={oStartDate} onChange={(e) => setOStartDate(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }} /></label>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>To: <input type="date" value={oEndDate} onChange={(e) => setOEndDate(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }} /></label>
                </div>
            </div>
            {filteredOrders.length === 0 ? (
                <p className="no-orders text-center mt-4">No orders found for the selected dates.</p>
            ) : (
                <div className="orders-list">
                    {filteredOrders.map((order) => (
                        <div key={order.orderId} className={`order-card ${order.status.toLowerCase()}`}>
                            <div className="order-header">
                                <div className="order-main-info">
                                    <span className="order-id">#{order.orderId}</span>
                                    <span className="order-date">{new Date(order.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className={`order-status-badge ${order.status.toLowerCase()}`}>
                                    {order.status}
                                </div>
                            </div>

                            <div className="order-items">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="order-item">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-qty">x{item.quantity}</span>
                                        <span className="item-price">₹{item.price}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="order-footer">
                                <div className="order-total">
                                    <span>Total Amount:</span>
                                    <strong>₹{order.totalAmount}</strong>
                                </div>
                                <div className="order-payment">
                                    <span>Payment:</span>
                                    <span className="payment-method">{order.paymentMethod}</span>
                                </div>
                                
                                {(order.status === 'Pending' || order.status?.toUpperCase() === 'PENDING') && (
                                    <button 
                                        className="cancel-order-btn"
                                        onClick={() => handleCancelOrder(order.orderId, order.paymentMethod)}
                                    >
                                        Cancel Order
                                    </button>
                                )}

                                {['Confirmed', 'Delivered', 'Pending'].includes(order.status) && (
                                    <button 
                                        className="view-invoice-btn"
                                        onClick={() => navigate("/invoice", { 
                                            state: { 
                                                order: order, 
                                                items: order.items, 
                                                totalAmount: order.totalAmount, 
                                                deliveryCharge: order.deliveryCharge || 0, 
                                                paymentMethod: order.paymentMethod, 
                                                date: order.createdAt || Date.now() 
                                            } 
                                        })}
                                    >
                                        🧾 View Invoice
                                    </button>
                                )}

                                {order.status === 'Cancelled' && order.cancellationDetails && (
                                    <div className="refund-info">
                                        <p>Fee: ₹{order.cancellationDetails.fee.toFixed(2)} | Refund: ₹{order.cancellationDetails.refundAmount.toFixed(2)}</p>
                                        <p>Requested to: <strong>{order.cancellationDetails.userRefundUpi}</strong></p>
                                        <p className="refund-status">Refund: <span>{order.cancellationDetails.refundStatus}</span> (ETA: {order.cancellationDetails.refundETA})</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
