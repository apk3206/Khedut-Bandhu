import React, { useState } from "react";
import "./Checkout.css";

const Checkout = ({ cartItems, total, onConfirmOrder, onCancel }) => {
    const [details, setDetails] = useState({
        address: "",
        pincode: "",
        alternatePhone: "",
        lat: null,
        lng: null
    });
    // Default and only option is COD
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [acceptedTerms, setAcceptedTerms] = useState(false);

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

    const handleConfirm = async () => {
        if (!details.address || !details.pincode) {
            alert("Please fill all required delivery details.");
            return;
        }
        if (!acceptedTerms) {
            alert("Please accept the Terms & Return Policy.");
            return;
        }

        if (paymentMethod === "UPI") {
            const confirmed = window.confirm("Have you completed the payment via the QR code?");
            if (!confirmed) return;
        }

        const orderDetails = { ...details, paymentMethod, deliveryCharge, finalTotal };
        onConfirmOrder(orderDetails);
    };

    return (
        <div className="checkout-container">
            <h2>Checkout</h2>

            <div className="checkout-section">
                <h3>Delivery Address</h3>
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
                    <input
                        type="text"
                        placeholder="Alternate Phone"
                        value={details.alternatePhone}
                        onChange={e => setDetails({ ...details, alternatePhone: e.target.value })}
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
                    <div className="upi-qr-section">
                        <h4>Scan to Pay: ₹{finalTotal.toFixed(2)}</h4>
                        <img src={qrUrl} alt="UPI QR Code" className="payment-qr" />
                        <p className="qr-hint">Scan using GPay, PhonePe, or Any UPI App</p>
                        <p className="upi-id-display">UPI ID: <span>{upiId}</span></p>
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
                <button className="confirm-btn" onClick={handleConfirm}>Place Order</button>
            </div>
        </div>
    );
};

export default Checkout;
