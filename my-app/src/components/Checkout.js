import React, { useState } from "react";
import API_BASE_URL, { RAZORPAY_KEY_ID } from "../apiConfig";
import "./Checkout.css";

const Checkout = ({ cartItems, total, user, onConfirmOrder, onCancel }) => {
    const [details, setDetails] = useState({
        fullName: "",
        mobileNumber: "",
        address: "",
        pincode: "",
        lat: null,
        lng: null
    });
    // Default and only option is COD
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [transactionId, setTransactionId] = useState("");
    const [processing, setProcessing] = useState(false);
    const [selectedBank, setSelectedBank] = useState(user?.bankDetails?.bankName || "State Bank of India");
    const [useSavedBank, setUseSavedBank] = useState(!!user?.bankDetails?.accountNumber);
    const [cardDetails, setCardDetails] = useState({
        number: "",
        expiry: "",
        cvv: "",
        name: ""
    });

    // Helper: Luhn Algorithm for Card Validation
    const validateCardNumber = (num) => {
        const arr = (num + '').split('').reverse().map(x => parseInt(x));
        const lastDigit = arr.shift();
        let sum = arr.reduce((acc, val, i) => i % 2 === 0 ? acc + (val * 2 > 9 ? val * 2 - 9 : val * 2) : acc + val, 0);
        return (sum + lastDigit) % 10 === 0;
    };

    // Helper: Format Card Number (XXXX XXXX XXXX XXXX)
    const handleCardNumberChange = (e) => {
        let val = e.target.value.replace(/\D/g, "");
        if (val.length > 16) val = val.slice(0, 16);
        const formatted = val.match(/.{1,4}/g)?.join(" ") || "";
        setCardDetails({ ...cardDetails, number: formatted });
    };

    // Helper: Format Expiry (MM/YY)
    const handleExpiryChange = (e) => {
        let val = e.target.value.replace(/\D/g, "");
        if (val.length > 4) val = val.slice(0, 4);
        if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
        setCardDetails({ ...cardDetails, expiry: val });
    };

    // Update delivery charge logic: COD = 20%, UPI = 0%
    const deliveryCharge = paymentMethod === "COD" ? (total * 0.20) : 0;
    const finalTotal = total + deliveryCharge;

    const upiId = "anshpat032@okicici";
    const payUrl = `upi://pay?pa=${upiId}&pn=KhedutBandhu&am=${finalTotal.toFixed(2)}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payUrl)}`;

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setDetails({
                        ...details,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    alert("Location Captured Successfully!");
                },
                (error) => {
                    alert("Error capturing location");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleRazorpayPayment = async () => {
        setProcessing(true);
        try {
            const token = localStorage.getItem("token");
            // Use relative path for proxy support
            const orderRes = await fetch(`/api/payment/create-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: finalTotal,
                    currency: "INR"
                })
            });

            if (!orderRes.ok) {
                const errorText = await orderRes.text();
                throw new Error(`Server Error (${orderRes.status}): ${errorText.substring(0, 100)}`);
            }

            const orderData = await orderRes.json();
            
            const options = {
                key: RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Khedut Bandhu",
                description: "Purchase of Agricultural Products",
                order_id: orderData.id,
                handler: async (response) => {
                    const verifyRes = await fetch(`/api/payment/verify-payment`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(response)
                    });

                    if (!verifyRes.ok) {
                       const vError = await verifyRes.text();
                       throw new Error(`Verification Error (${verifyRes.status}): ${vError.substring(0, 100)}`);
                    }

                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        const orderDetails = { 
                            ...details, 
                            paymentMethod, 
                            deliveryCharge, 
                            finalTotal, 
                            transactionId: response.razorpay_payment_id,
                            bankName: paymentMethod === "Netbanking" ? (useSavedBank ? user.bankDetails.bankName : selectedBank) : null
                        };
                        onConfirmOrder(orderDetails);
                    } else {
                        alert("Payment verification failed. Please contact support.");
                    }
                    setProcessing(false);
                },
                prefill: {
                    name: details.fullName || user.username,
                    contact: details.mobileNumber || user.phone,
                    email: user.email
                },
                notes: {
                   address: details.address
                },
                theme: { color: "#27ae60" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                alert("Payment Failed: " + response.error.description);
                setProcessing(false);
            });
            rzp.open();
        } catch (err) {
            console.error("Razorpay Error:", err);
            alert("Failed to initialize payment: " + err.message);
            setProcessing(false);
        }
    };

    const handleConfirm = async () => {
        if (!details.fullName || !details.mobileNumber || !details.address || !details.pincode) {
            alert("Please fill all required delivery details (Name, Mobile, Address, Pincode).");
            return;
        }
        if (!acceptedTerms) {
            alert("Please accept the Terms & Return Policy.");
            return;
        }

        if (paymentMethod === "UPI") {
            if (!transactionId || transactionId.length !== 12) {
                alert("Please enter the 12-digit UPI Transaction ID from your payment app (Google Pay).");
                return;
            }
        }

        // Trigger Razorpay for professional payment methods
        if (paymentMethod === "Card" || paymentMethod === "Netbanking") {
            handleRazorpayPayment();
            return;
        }

        setProcessing(true);
        // Simulate secure verification delay for COD/UPI
        setTimeout(() => {
            const orderDetails = { 
                ...details, 
                paymentMethod, 
                deliveryCharge, 
                finalTotal, 
                transactionId: paymentMethod === "UPI" ? transactionId : (paymentMethod === "COD" ? "COD" : `SECURE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`),
                bankName: paymentMethod === "Netbanking" ? selectedBank : null
            };
            setProcessing(false);
            onConfirmOrder(orderDetails);
        }, 2000);
    };

    return (
        <div className="checkout-container">
            <h2>Checkout</h2>

            <div className="checkout-section">
                <h3>Delivery Details</h3>
                <div className="input-row">
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={details.fullName}
                        onChange={e => setDetails({ ...details, fullName: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Mobile Number"
                        value={details.mobileNumber}
                        onChange={e => setDetails({ ...details, mobileNumber: e.target.value })}
                    />
                </div>
                <textarea
                    placeholder="Full Address"
                    value={details.address}
                    onChange={e => setDetails({ ...details, address: e.target.value })}
                />
                <div className="input-row">
                    <input
                        type="text"
                        placeholder="Pincode"
                        value={details.pincode}
                        onChange={e => setDetails({ ...details, pincode: e.target.value })}
                    />
                </div>
                <button type="button" className="location-btn" onClick={getLocation}>
                    📍 Get Live Delivery Location
                </button>
                {details.lat && <p className="location-status">Location Captured ✅</p>}
            </div>

            <div className="checkout-section">
                <h3>Select Payment Method</h3>
                <div className="payment-options">
                    <label className={`payment-option ${paymentMethod === "COD" ? "active" : ""}`}>
                        <input
                            type="radio"
                            name="payment"
                            value="COD"
                            checked={paymentMethod === "COD"}
                            onChange={() => setPaymentMethod("COD")}
                        />
                        <div className="option-content">
                            <strong>Cash on Delivery (COD)</strong>
                            <span className="cod-note">(+20% Delivery Charge)</span>
                        </div>
                    </label>

                    <label className={`payment-option ${paymentMethod === "Card" ? "active" : ""}`}>
                        <input
                            type="radio"
                            name="payment"
                            value="Card"
                            checked={paymentMethod === "Card"}
                            onChange={() => setPaymentMethod("Card")}
                        />
                        <div className="option-content">
                            <strong>Credit / Debit Card</strong>
                            <span className="upi-note">(FREE Delivery - 0 Charges)</span>
                        </div>
                    </label>

                    <label className={`payment-option ${paymentMethod === "Netbanking" ? "active" : ""}`}>
                        <input
                            type="radio"
                            name="payment"
                            value="Netbanking"
                            checked={paymentMethod === "Netbanking"}
                            onChange={() => setPaymentMethod("Netbanking")}
                        />
                        <div className="option-content">
                            <strong>Netbanking</strong>
                            <span className="upi-note">(FREE Delivery - 0 Charges)</span>
                        </div>
                    </label>

                    <label className={`payment-option ${paymentMethod === "UPI" ? "active" : ""}`}>
                        <input
                            type="radio"
                            name="payment"
                            value="UPI"
                            checked={paymentMethod === "UPI"}
                            onChange={() => setPaymentMethod("UPI")}
                        />
                        <div className="option-content">
                            <strong>UPI / QR Payment</strong>
                            <span className="upi-note">(FREE Delivery - 0 Charges)</span>
                        </div>
                    </label>
                </div>

                {paymentMethod === "UPI" && (
                    <div className="upi-qr-section" style={{ textAlign: "center", border: "1px solid #ddd", padding: "15px", borderRadius: "8px", marginTop: "15px" }}>
                        <h4>Scan to Pay: ₹{finalTotal.toFixed(2)}</h4>
                        <img src={qrUrl} alt="UPI QR Code" className="payment-qr" style={{ width: "200px", height: "200px", margin: "10px auto" }} />
                        <p className="qr-hint">Scan using GPay, PhonePe, or Any UPI App</p>
                        <p className="upi-id-display">UPI ID: <strong>{upiId}</strong></p>
                        
                        <div className="transaction-id-input" style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#d9534f" }}>
                                Enter 12-digit UPI Transaction ID (Required):
                            </label>
                            <input 
                                type="text" 
                                placeholder="0000 0000 0000" 
                                maxLength="12"
                                value={transactionId}
                                onChange={e => setTransactionId(e.target.value.replace(/\D/g, ""))}
                                style={{ width: "100%", padding: "12px", border: "2px solid #28a745", borderRadius: "8px", textAlign: "center", fontSize: "18px", letterSpacing: "2px" }}
                            />
                            <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>Check your GPay/UPI app history for the 12-digit Ref No.</p>
                        </div>
                    </div>
                )}
                {paymentMethod === "Card" && (
                    <div className="card-payment-section" style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", marginTop: "15px", background: "#fcfcfc" }}>
                        <h4 style={{ color: '#28a745', marginBottom: '15px' }}>💳 Secure Card Payment</h4>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', color: '#666' }}>Card Number</label>
                            <input 
                                type="text" 
                                placeholder="0000 0000 0000 0000" 
                                style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }} 
                                value={cardDetails.number}
                                onChange={handleCardNumberChange}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '12px', color: '#666' }}>Expiry (MM/YY)</label>
                                <input 
                                    type="text" 
                                    placeholder="MM/YY" 
                                    style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }} 
                                    value={cardDetails.expiry}
                                    onChange={handleExpiryChange}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '12px', color: '#666' }}>CVV</label>
                                <input 
                                    type="password" 
                                    placeholder="***" 
                                    maxLength="3"
                                    style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }} 
                                    value={cardDetails.cvv}
                                    onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, "") })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '12px', color: '#666' }}>Name on Card</label>
                            <input 
                                type="text" 
                                placeholder="Full Name" 
                                style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }} 
                                value={cardDetails.name}
                                onChange={e => setCardDetails({ ...cardDetails, name: e.target.value })}
                            />
                        </div>
                        <p style={{ marginTop: "10px", fontSize: "11px", color: "#888" }}>🔒 Your card data is encrypted and never stored on our servers.</p>
                    </div>
                )}
                {paymentMethod === "Netbanking" && (
                    <div className="netbanking-section" style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", marginTop: "15px", background: "#fcfcfc" }}>
                        <h4 style={{ color: '#28a745', marginBottom: '15px' }}>🏦 Secure Netbanking</h4>
                        
                        {user?.bankDetails?.accountNumber ? (
                            <div className="saved-bank-option" style={{ marginBottom: '15px', padding: '10px', background: '#e8f5e9', borderRadius: '5px', border: '1px solid #c8e6c9' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={useSavedBank} 
                                        onChange={() => setUseSavedBank(!useSavedBank)} 
                                    />
                                    <strong>Use Saved Bank: {user.bankDetails.bankName}</strong>
                                </label>
                                <p style={{ fontSize: '12px', color: '#666', marginLeft: '25px', marginTop: '5px' }}>
                                    Acc: ****{user.bankDetails.accountNumber.slice(-4)} | IFSC: {user.bankDetails.ifscCode}
                                </p>
                            </div>
                        ) : null}

                        {!useSavedBank && (
                            <>
                                <label style={{ fontSize: '12px', color: '#666' }}>Select Your Bank</label>
                                <select 
                                    style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
                                    value={selectedBank}
                                    onChange={e => setSelectedBank(e.target.value)}
                                >
                                    <option>State Bank of India</option>
                                    <option>HDFC Bank</option>
                                    <option>ICICI Bank</option>
                                    <option>Axis Bank</option>
                                    <option>Kotak Mahindra Bank</option>
                                    <option>Punjab National Bank</option>
                                </select>
                            </>
                        )}
                        <p style={{ marginTop: "15px", fontSize: "13px", color: "#555" }}>
                            You will be safely redirected to <strong>{useSavedBank ? user.bankDetails.bankName : selectedBank}</strong> to complete the transaction.
                        </p>
                    </div>
                )}
            </div>

            <div className="checkout-section">
                <h3>Order Summary</h3>
                <div className="summary-row"><span>Subtotal:</span> <span>₹{total.toFixed(2)}</span></div>
                <div className="summary-row charge"><span>Delivery Charge (20%):</span> <span>+₹{deliveryCharge.toFixed(2)}</span></div>
                <div className="summary-total"><span>Total Payable:</span> <span>₹{finalTotal.toFixed(2)}</span></div>
            </div>

            <div className="checkout-section terms-section">
                <label>
                    <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={e => setAcceptedTerms(e.target.checked)}
                    />
                    I agree to the <span className="terms-link">Terms & Conditions</span> and <span className="terms-link">Return Policy</span>.
                </label>
                <div className="policy-text">
                    <small>Return within 7 days. Refund initiated within 24 hours of return. Seeds/Pesticides must be unopened.</small>
                </div>
            </div>

            <div className="checkout-actions">
                <button className="back-btn" onClick={onCancel}>Back</button>
                <button className="confirm-btn" onClick={handleConfirm}>{paymentMethod === "COD" ? "Place Order" : "Proceed to Pay"}</button>
            </div>

            {/* Secure Processing Overlay */}
            {processing && (
                <div className="payment-processing-overlay" style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(10, 22, 40, 0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="payment-loader" style={{
                        width: '50px',
                        height: '50px',
                        border: '5px solid #f3f3f3',
                        borderTop: '5px solid #28a745',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '20px'
                    }}></div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    <h3 style={{ color: '#333', marginBottom: '10px' }}>
                        {paymentMethod === "Netbanking" 
                            ? `Redirecting to ${useSavedBank ? user.bankDetails.bankName : selectedBank}...` 
                            : "Securely Processing Payment..."}
                    </h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        {paymentMethod === "Netbanking" 
                            ? `Please verify the transaction on your bank's secure portal.` 
                            : "Please do not refresh the page or click back."}
                    </p>
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#28a745', fontWeight: 'bold' }}>
                        🛡️ PCI-DSS Compliant Encryption
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;
