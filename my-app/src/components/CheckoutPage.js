import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../apiConfig";
import Checkout from "./Checkout";

const CheckoutPage = ({ user }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCartData = async () => {
            if (!user) {
                navigate("/");
                return;
            }

            const localUser = JSON.parse(localStorage.getItem("user") || "{}");
            const localCart = localUser.cart || localUser.user?.cart || user.cart || [];

            if (localCart.length > 0) {
                setCartItems(localCart);
                setLoading(false);
                return;
            }

            // Fallback to fetching
            try {
                const userId = user?.id || user?._id || user?.user?.id || user?.user?._id;
                const res = await fetch(`${API_BASE_URL}/api/user/profile/${userId}`);
                const data = await res.json();
                if (data.user && data.user.cart && data.user.cart.length > 0) {
                    setCartItems(data.user.cart);
                } else {
                    alert("Your cart is empty. Please add items before checking out.");
                    navigate("/market");
                }
            } catch (err) {
                console.error("Fetch cart error in checkout:", err);
                alert("Could not load cart items for checkout.");
                navigate("/cart");
            } finally {
                setLoading(false);
            }
        };

        fetchCartData();
    }, [user, navigate]);

    const handleConfirmOrder = async (details) => {
        const userId = user?.id || user?._id || user?.user?.id || user?.user?._id;
        if (!userId) return alert("Please login to order");

        const orderPayload = {
            paymentMethod: details.paymentMethod,
            deliveryCharge: details.deliveryCharge,
            transactionId: details.transactionId,
            deliveryDetails: {
                fullName: details.fullName,
                address: details.address,
                pincode: details.pincode,
                alternatePhone: details.mobileNumber, // Using backend schema's alternatePhone for mobile
                locationCoordinates: { lat: details.lat, lng: details.lng }
            }
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/orders/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload)
            });
            
            if (res.ok) {
                const data = await res.json();
                // Clear cart locally
                const updatedUser = { ...user, cart: [] };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('cartUpdated')); 
                
                // Redirect to invoice page with order details
                navigate("/invoice", { 
                    state: { 
                        order: data.order || orderPayload, 
                        items: cartItems,
                        totalAmount: details.finalTotal,
                        deliveryCharge: details.deliveryCharge,
                        paymentMethod: details.paymentMethod,
                        date: new Date().toISOString()
                    } 
                });
            } else {
                const errorData = await res.json();
                console.error("Server Error:", errorData);
                alert(`Order Failed: ${errorData.message || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Network Error:", err);
            alert("Error placing order: " + err.message);
        }
    };

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;

    const total = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || item.qty || 1)), 0);

    return (
        <div className="checkout-page-wrapper" style={{ padding: '20px', minHeight: '80vh' }}>
            <Checkout
                cartItems={cartItems}
                total={total}
                user={user}
                onConfirmOrder={handleConfirmOrder}
                onCancel={() => navigate("/cart")}
            />
        </div>
    );
};

export default CheckoutPage;
