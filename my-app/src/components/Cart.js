import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../apiConfig";
import "./Cart.css";

const Cart = ({ user, cartItems: propCartItems, onRemove, onCheckout }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        const localCart = localUser.cart || localUser.user?.cart || [];

        if (propCartItems && propCartItems.length > 0) {
            setCartItems(propCartItems);
            setLoading(false);
        } else if (localCart.length > 0) {
            setCartItems(localCart);
            setLoading(false);
        } else {
            fetchCart();
        }
    }, [propCartItems]);

    const fetchCart = async () => {
        const userId = user?.id || user?._id || user?.user?.id || user?.user?._id;
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/profile/${userId}`);
            const data = await res.json();
            if (data.user && data.user.cart) {
                setCartItems(data.user.cart);
                const updatedUser = { ...user, cart: data.user.cart };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('cartUpdated'));
            } else {
                if (user?.cart) setCartItems(user.cart);
            }
            setLoading(false);
        } catch (err) {
            console.error("Cart fetch error:", err);
            if (user?.cart) setCartItems(user.cart);
            setLoading(false);
        }
    };

    const removeFromCart = async (index) => {
        const userId = user?.id || user?._id || user?.user?.id || user?.user?._id;
        if (!userId) return;

        const updatedCart = [...cartItems];
        updatedCart.splice(index, 1);
        
        // Optimistic update
        setCartItems(updatedCart);
        const updatedUser = { ...user, cart: updatedCart };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('cartUpdated'));

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/cart/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cart: updatedCart })
            });
            if (!res.ok) throw new Error("Sync failed");
        } catch (err) {
            console.error("Remove error:", err);
            // Refresh to get server truth if sync failed
            fetchCart();
        }
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = totalAmount > 1000 ? 0 : 50;

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;

    return (
        <div className="cart-page-container">
            <div className="cart-header">
                <h1>{user?.username ? `${user.username}'s Cart` : "Shopping Cart"}</h1>
                <p>{cartItems.length} premium products selected</p>
            </div>

            <div className="cart-main-content">
                <div className="cart-items-section">
                    {cartItems.length > 0 ? (
                        cartItems.map((item, index) => (
                            <div key={index} className="cart-item-card">
                                <div className="item-info">
                                    <h3 className="item-name">{item.name}</h3>
                                    <p className="item-category">{item.category || "Crops/Seeds"}</p>
                                </div>
                                <div className="item-controls">
                                    <span className="qty-label">Qty: {item.quantity}</span>
                                    <p className="item-price">₹{item.price * item.quantity}</p>
                                    <button className="remove-item-btn" onClick={() => removeFromCart(index)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-cart-msg">
                            <span className="empty-icon">🛒</span>
                            <p>Your cart is currently empty.</p>
                            <button className="shop-now-btn" onClick={() => navigate("/market")}>
                                Explore Marketplace
                            </button>
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-summary-section">
                        <div className="summary-card">
                            <h3>Checkout Summary</h3>
                            <div className="summary-details">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>₹{totalAmount}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Delivery Charge</span>
                                    <span className={deliveryCharge === 0 ? "free" : ""}>
                                        {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                                    </span>
                                </div>
                                <div className="divider"></div>
                                <div className="summary-row total">
                                    <span>Grand Total</span>
                                    <span>₹{totalAmount + deliveryCharge}</span>
                                </div>
                            </div>
                            <button className="confirm-checkout-btn" onClick={() => navigate("/checkout")}>
                                Secure Checkout
                            </button>
                            <p className="delivery-note">Estimated delivery: 3-5 business days</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
