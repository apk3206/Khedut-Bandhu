import React from "react";
import "./Cart.css";

const Cart = ({ cartItems, onRemove, onCheckout }) => {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
        <div className="cart-container">
            <h3>Your Cart</h3>
            {cartItems.length === 0 ? (
                <p>Cart is empty</p>
            ) : (
                <>
                    <div className="cart-items">
                        {cartItems.map((item, index) => (
                            <div key={index} className="cart-item">
                                <span>{item.name} (x{item.qty})</span>
                                <span>₹{item.price * item.qty}</span>
                                <button onClick={() => onRemove(index)} className="remove-btn">Remove</button>
                            </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                        <h4>Total: ₹{total}</h4>
                        <button onClick={onCheckout} className="checkout-btn">Proceed to Checkout</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart;
