import React, { useEffect, useState } from "react";
import API_BASE_URL from "../apiConfig";
import { useTranslation } from "react-i18next";
import Cart from "./Cart";
import Checkout from "./Checkout";
import "./ProductList.css";

const ProductList = ({ user }) => {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [view, setView] = useState("list"); // list, cart, checkout
    const [filter, setFilter] = useState("All");

    // Detailed View & Review States
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [userRating, setUserRating] = useState(5);
    const [userComment, setUserComment] = useState("");

    // Load Cart from LocalStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) setCart(JSON.parse(savedCart));
        fetchProducts();
    }, []);

    // Save Cart to LocalStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cartUpdated"));
    }, [cart]);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/products`); // Use proxy
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error("Failed to fetch products", err);
        }
    };

    const addToCart = (product) => {
        // Check if already in cart
        const existing = cart.find(item => item._id === product._id);
        if (existing) {
            setCart(cart.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
        alert(`${t(product.name.toLowerCase())} ${t("added_to_cart")}`);
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleBuyNow = (product) => {
        addToCart(product);
        setView("cart");
    };

    const handleConfirmOrder = async (details) => {
        const orderData = {
            userId: user.id || user._id,
            products: cart.map(p => ({ productId: p._id, quantity: p.qty, priceAtPurchase: p.price })),
            totalAmount: details.finalTotal, // Use calculated total from checkout
            paymentMethod: details.paymentMethod,
            deliveryCharge: details.deliveryCharge,
            deliveryDetails: {
                address: details.address,
                pincode: details.pincode,
                alternatePhone: details.alternatePhone,
                locationCoordinates: { lat: details.lat, lng: details.lng }
            }
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });
            if (res.ok) {
                alert(t("order_placed_success"));
                setCart([]);
                setView("list");
            } else {
                const errorData = await res.json();
                console.error("Server Error:", errorData);
                alert(`${t("order_failed")}: ${errorData.error || t("unknown_error")}`);
            }
        } catch (err) {
            console.error("Network Error:", err);
            alert(t("error_placing_order") + ": " + err.message);
        }
    };

    const submitReview = async (productId) => {
        if (!user) {
            alert(t("login_to_review"));
            return;
        }
        try {
            const res = await fetch(`/api/products/${productId}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id || user._id,
                    username: user.username,
                    rating: userRating,
                    comment: userComment
                }),
            });
            if (res.ok) {
                alert(t("review_submitted"));
                setUserComment("");
                fetchProducts(); // Refresh
            } else {
                alert(t("failed_submit_review"));
            }
        } catch (err) {
            alert(t("error_submit_review"));
        }
    };

    const filteredProducts = products.filter(p => filter === "All" || p.category === filter);

    if (view === "cart") {
        return (
            <div className="product-list-container">
                <button onClick={() => setView("list")} className="back-btn">← {t("back_to_shopping")}</button>
                <Cart cartItems={cart} onRemove={removeFromCart} onCheckout={() => setView("checkout")} />
            </div>
        );
    }

    if (view === "checkout") {
        return (
            <div className="product-list-container">
                <Checkout
                    cartItems={cart}
                    total={cart.reduce((sum, item) => sum + item.price * item.qty, 0)}
                    onConfirmOrder={handleConfirmOrder}
                    onCancel={() => setView("cart")}
                />
            </div>
        );
    }

    return (
        <div className="product-list-container">
            <div className="header-row">
                <h2 className="section-title">{t("buy_products_header")}</h2>
                <button className="view-cart-btn" onClick={() => setView("cart")}>
                    🛒 {t("cart")} ({cart.reduce((acc, item) => acc + item.qty, 0)})
                </button>
            </div>

            <div className="category-filter">
                {["All", "Seed", "Pesticide", "Tool"].map(cat => (
                    <button key={cat} className={filter === cat ? "active" : ""} onClick={() => setFilter(cat)}>{t(cat.toLowerCase())}</button>
                ))}
            </div>

            <div className="products-grid">
                {filteredProducts.map(product => (
                    <div key={product._id} className="product-card">
                        <img
                            src={product.imageUrl ? product.imageUrl : "/placeholder.png"}
                            alt={t(product.name.toLowerCase())}
                            className="product-image"
                            onError={(e) => e.target.src = "https://via.placeholder.com/150?text=No+Image"}
                        />
                        <div className="product-info">
                            <h4>{t(product.name.toLowerCase())}</h4>
                            <p className="category-tag">{t(product.category.toLowerCase())}</p>
                            <div className="price-row">
                                <span className="price">₹{product.price}</span>
                                <span className="stock">{product.stock > 0 ? t("in_stock") : t("out_of_stock")}</span>
                            </div>
                            {product.averageRating > 0 && (
                                <div className="rating-badge">⭐ {product.averageRating} ({product.ratingCount})</div>
                            )}
                            <div className="card-actions">
                                <button className="details-btn" onClick={() => setSelectedProduct(product)}>{t("view_details")}</button>
                                <button className="buy-btn" onClick={() => handleBuyNow(product)}>{t("buy_now")}</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Product Details Modal */}
            {selectedProduct && (
                <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setSelectedProduct(null)}>×</button>

                        <div className="modal-body">
                            <div className="modal-left">
                                <img
                                    src={selectedProduct.imageUrl ? selectedProduct.imageUrl : "/placeholder.png"}
                                    alt={t(selectedProduct.name.toLowerCase())}
                                    onError={(e) => e.target.src = "https://via.placeholder.com/150?text=No+Image"}
                                />
                                <div className="modal-price-box">
                                    <h3>₹{selectedProduct.price}</h3>
                                    <button className="add-cart-btn" onClick={() => addToCart(selectedProduct)}>{t("add_to_cart")}</button>
                                </div>
                            </div>

                            <div className="modal-right">
                                <h2>{t(selectedProduct.name.toLowerCase())}</h2>
                                <p className="desc">{t(selectedProduct.description ? selectedProduct.description.toLowerCase() : "") || selectedProduct.description}</p>

                                {selectedProduct.category === "Pesticide" && (
                                    <div className="detailed-info">
                                        {selectedProduct.type && <div className="info-tag"><strong>{t("type")}:</strong> {t(selectedProduct.type.toLowerCase())}</div>}

                                        {selectedProduct.usedFor && selectedProduct.usedFor.length > 0 && (
                                            <div className="info-section">
                                                <h4>{t("used_for")}:</h4>
                                                <div className="tags">
                                                    {selectedProduct.usedFor.map((s, idx) => <span key={idx}>{t(s.toLowerCase())}</span>)}
                                                </div>
                                            </div>
                                        )}

                                        {selectedProduct.usageSteps && selectedProduct.usageSteps.length > 0 && (
                                            <div className="info-section">
                                                <h4>{t("how_to_use")}:</h4>
                                                <ol>
                                                    {selectedProduct.usageSteps.map((step, i) => <li key={i}>{t(step.toLowerCase()) || step}</li>)}
                                                </ol>
                                            </div>
                                        )}

                                        {selectedProduct.safetyInstructions && selectedProduct.safetyInstructions.length > 0 && (
                                            <div className="info-section safety-box">
                                                <h4>⚠️ {t("safety_instructions")}:</h4>
                                                <ul>
                                                    {selectedProduct.safetyInstructions.map((s, i) => <li key={i}>{t(s.toLowerCase()) || s}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Reviews Section */}
                                <div className="reviews-section">
                                    <h3>{t("reviews_ratings")} ({selectedProduct.ratingCount || 0})</h3>
                                    <div className="reviews-list">
                                        {(!selectedProduct.reviews || selectedProduct.reviews.length === 0) ? <p>{t("no_reviews")}</p> : (
                                            selectedProduct.reviews.map((r, i) => (
                                                <div key={i} className="review-item">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <strong>{r.username}</strong>
                                                        <span>{"⭐".repeat(r.rating)}</span>
                                                    </div>
                                                    <p style={{ margin: '5px 0' }}>{r.comment}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Add Review */}
                                    <div className="add-review-box">
                                        <h4>{t("write_review")}</h4>
                                        <div className="star-input">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span key={star} onClick={() => setUserRating(star)} style={{ color: star <= userRating ? "gold" : "gray", cursor: "pointer", fontSize: "24px" }}>★</span>
                                            ))}
                                        </div>
                                        <textarea placeholder={t("write_experience")} value={userComment} onChange={e => setUserComment(e.target.value)} />
                                        <button onClick={() => submitReview(selectedProduct._id)}>{t("submit_review")}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
