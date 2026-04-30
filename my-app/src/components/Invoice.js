import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Invoice = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Safely parse order data from location.state
    const { state } = location;
    if (!state || !state.order || !state.items) {
        return (
            <div style={{ padding: "40px", textAlign: "center" }}>
                <h2>No Invoice Data Found</h2>
                <button onClick={() => navigate("/dashboard/farmer")} style={{ padding: "10px 20px", marginTop: "20px", background: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Go to Dashboard</button>
            </div>
        );
    }

    const { order, items, totalAmount, deliveryCharge, paymentMethod, date } = state;
    const formattedDate = new Date(date).toLocaleString();

    return (
        <div style={{ 
            maxWidth: "800px", 
            margin: "40px auto", 
            padding: "40px", 
            background: "white", 
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)", 
            borderRadius: "8px",
            color: "#333",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #eee", paddingBottom: "20px", marginBottom: "20px" }}>
                <div>
                    <h1 style={{ color: "#2e7d32", margin: "0 0 10px 0" }}>🧾 Khedut Bandhu</h1>
                    <p style={{ margin: "0", color: "#666" }}>Professional Agricultural Marketplace</p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <h2 style={{ margin: "0 0 10px 0", color: "#555" }}>INVOICE</h2>
                    <p style={{ margin: "0", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <strong>Order Date:</strong> <span>{formattedDate}</span>
                    </p>
                    <p style={{ margin: "5px 0 0 0", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <strong>Payment:</strong> <span style={{ color: "#2e7d32", fontWeight: "bold" }}>{paymentMethod} - SUCCESS ✅</span>
                    </p>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: "5px", color: "#555" }}>Billed To:</h3>
                    <p style={{ margin: "5px 0" }}><strong>Name:</strong> {order.deliveryDetails?.fullName || "User"}</p>
                    <p style={{ margin: "5px 0" }}><strong>Mobile:</strong> {order.deliveryDetails?.alternatePhone || "N/A"}</p>
                    <p style={{ margin: "5px 0" }}><strong>Address:</strong> {order.deliveryDetails?.address}</p>
                    <p style={{ margin: "5px 0" }}><strong>Pincode:</strong> {order.deliveryDetails?.pincode}</p>
                </div>
                <div style={{ flex: 1, textAlign: "right", alignSelf: "flex-end" }}>
                    <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Thank you for shopping securely with us!</p>
                </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
                <thead>
                    <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                        <th style={{ padding: "12px", textAlign: "left" }}>Item & Category</th>
                        <th style={{ padding: "12px", textAlign: "center" }}>Quantity</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Unit Price</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "12px" }}>
                                <div style={{ fontWeight: "bold" }}>{item.name}</div>
                                <div style={{ fontSize: "12px", color: "#777" }}>{item.type || item.category || "Product"}</div>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>{item.quantity || item.qty || 1}</td>
                            <td style={{ padding: "12px", textAlign: "right" }}>₹{item.price.toFixed(2)}</td>
                            <td style={{ padding: "12px", textAlign: "right" }}>₹{((item.quantity || item.qty || 1) * item.price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: "300px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                        <span>Subtotal:</span>
                        <span>₹{(totalAmount - deliveryCharge).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "2px solid #ddd" }}>
                        <span>Delivery Charge:</span>
                        <span>₹{deliveryCharge > 0 ? deliveryCharge.toFixed(2) : "0.00 (FREE)"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 0", fontSize: "20px", fontWeight: "bold", color: "#2e7d32" }}>
                        <span>Grand Total Paid:</span>
                        <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "40px" }} className="no-print">
                <button 
                    onClick={() => window.print()}
                    style={{ 
                        padding: "12px 24px", 
                        background: "#2e7d32", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "5px", 
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "bold",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                >
                    🖨 Download / Print Invoice
                </button>
                <p style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>Please collect your items upon delivery.</p>
            </div>
            
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
};

export default Invoice;
