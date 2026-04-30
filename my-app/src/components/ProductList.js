import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../apiConfig";
import { useTranslation } from "react-i18next";
import Cart from "./Cart";
import "./ProductList.css";

const ProductList = ({ user, addToCart }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [view, setView] = useState("list"); // list, cart
    const [filter, setFilter] = useState("All");
    const [priceFilter, setPriceFilter] = useState("all"); // All, Low, Medium, High
    const [stockFilter, setStockFilter] = useState("all"); // all, in, out

    // Detailed View & Review States
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [userRating, setUserRating] = useState(5);
    const [userComment, setUserComment] = useState("");
    const [journey, setJourney] = useState([]);
    const [loadingJourney, setLoadingJourney] = useState(false);

    // Load products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/products`); // Use proxy
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch products", err);
        }
    };

    // The addToCart function is now passed as a prop, so the internal definition is removed.
    // If the user intended to keep an internal addToCart and also pass one, this would be a conflict.
    // Assuming the prop version is the intended one to use.

    const removeFromCart = async (index) => {
        // Redirect to cart view where removal is handled properly
        setView("cart");
    };

    const handleBuyNow = async (product) => {
        await addToCart(product);
        setView("cart");
    };



    const fetchJourney = async (productId) => {
        setLoadingJourney(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/blockchain/journey/${productId}`);
            const data = await res.json();
            setJourney(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch journey", err);
        }
        setLoadingJourney(false);
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

    const filteredProducts = products.filter(p => {
        const catMatch = filter === "All" || p.category === filter;
        if (!catMatch) return false;

        const priceMatch = (() => {
            if (priceFilter === "all") return true;
            if (priceFilter === "low") return p.price < 500;
            if (priceFilter === "medium") return p.price >= 500 && p.price <= 1500;
            if (priceFilter === "high") return p.price > 1500;
            return true;
        })();
        if (!priceMatch) return false;

        const stockMatch = (() => {
            if (stockFilter === "all") return true;
            if (stockFilter === "in") return p.stock > 0;
            if (stockFilter === "out") return p.stock === 0;
            return true;
        })();
        return stockMatch;
    });

    if (view === "cart") {
        return (
            <div className="product-list-container">
                <button onClick={() => setView("list")} className="back-btn">← {t("back_to_shopping")}</button>
                <Cart user={user} cartItems={user?.cart || []} onRemove={removeFromCart} onCheckout={() => navigate("/checkout")} />
            </div>
        );
    }

    const cartCount = (user?.cart || []).reduce((acc, item) => acc + (item.quantity || item.qty || 0), 0);

    return (
        <div className="product-list-container">
            <div className="header-row">
                <h2 className="section-title">{t("buy_products_header")}</h2>
                <button className="view-cart-btn" onClick={() => setView("cart")}>
                    🛒 {t("cart")} ({cartCount})
                </button>
            </div>

            <div className="filter-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div className="category-filter" style={{ display: 'flex', gap: '10px' }}>
                    {["All", "Seed", "Pesticide", "Tool"].map(cat => (
                        <button key={cat} className={filter === cat ? "active" : ""} onClick={() => setFilter(cat)}>{t(cat.toLowerCase())}</button>
                    ))}
                </div>
                <div className="filter-group">
                    <select onChange={(e) => setPriceFilter(e.target.value)}>
                        <option value="all">{t("all_prices") || "All Prices"}</option>
                        <option value="low">{t("low_price") || "Low (< ₹500)"}</option>
                        <option value="medium">{t("medium_price") || "Medium (₹500 - ₹1500)"}</option>
                        <option value="high">{t("high_price") || "High (> ₹1500)"}</option>
                    </select>
                    <select onChange={(e) => setStockFilter(e.target.value)}>
                        <option value="all">{t("all") || "All"}</option>
                        <option value="in">{t("in_stock") || "In Stock"}</option>
                        <option value="out">{t("out_of_stock") || "Out of Stock"}</option>
                    </select>
                </div>
            </div>

            <div className="products-grid">
                {filteredProducts.map(product => (
                    <div key={product._id} className="product-card">
                        <img
                            src={product.imageUrl ? product.imageUrl : "/placeholder.png"}
                            alt={product.name ? t(product.name.toLowerCase()) : ""}
                            className="product-image"
                            onError={(e) => e.target.src = "https://via.placeholder.com/150?text=No+Image"}
                        />
                        <div className="product-info">
                                <h3>{product.name ? t(product.name.toLowerCase()) : product.name}</h3>
                                <p className="category-badge">{product.category ? t(product.category.toLowerCase()) : product.category}</p>
                            <div className="price-row">
                                <span className="price">₹{product.price}</span>
                                    <span className={`stock-status ${product.stock > 0 ? 'in' : 'out'}`}>
                                        {product.stock > 0 ? t("in_stock") : t("out_of_stock")}
                                    </span>
                            </div>
                            {product.averageRating > 0 && (
                                <div className="rating-badge">⭐ {product.averageRating} ({product.ratingCount})</div>
                            )}
                            <div className="card-actions">
                                <button className="details-btn" onClick={() => setSelectedProduct(product)}>{t("detail_btn") || "View Details"}</button>
                                    <button 
                                        className="buy-btn" 
                                        onClick={() => addToCart(product)} 
                                        disabled={product.stock === 0}
                                    >
                                        {t("buy_now_btn") || "Buy Now"}
                                    </button>
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
                                <h2>{selectedProduct.name ? t(selectedProduct.name.toLowerCase()) : ""}</h2>
                                <p className="desc">{t(selectedProduct.description ? selectedProduct.description.toLowerCase() : "") || selectedProduct.description}</p>
                                <div className="detailed-info">
                                    {selectedProduct.type && (
                                        <p><strong>{t("type") || "Type"}:</strong> {t(selectedProduct.type.toLowerCase())}</p>
                                    )}
                                    {selectedProduct.usedFor && selectedProduct.usedFor.length > 0 && (
                                        <p><strong>{t("used_for") || "Used For"}:</strong> {selectedProduct.usedFor.map(u => u ? (t(u.toLowerCase()) || u) : "").join(", ")}</p>
                                    )}
                                    {selectedProduct.howToUse && selectedProduct.howToUse.length > 0 && (
                                        <div className="usage-info">
                                            <strong>{selectedProduct.category === "Seed" ? (t("how_to_grow") || "How to Grow/Use") : (t("how_to_use") || "How to Use")}:</strong>
                                            <ul>
                                                {selectedProduct.howToUse.map((step, i) => (
                                                    <li key={i}>{t(step.toLowerCase()) || step}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {selectedProduct.safetyInstructions && selectedProduct.safetyInstructions.length > 0 && (
                                        <div className="safety-info">
                                            <strong>{t("safety_instructions") || "Safety Instructions"}:</strong>
                                            <ul>
                                                {selectedProduct.safetyInstructions.map((inst, i) => (
                                                    <li key={i}>{t(inst.toLowerCase()) || inst}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Blockchain Journey Section */}
                                    <div className="blockchain-section">
                                        <div className="blockchain-header">
                                            <h3>🔗 {t("verified_journey") || "Verified Blockchain Journey"}</h3>
                                            <button className="verify-btn" onClick={() => fetchJourney(selectedProduct.id || "WHEAT-001")}>
                                                {t("verify_now") || "Verify Now"}
                                            </button>
                                        </div>
                                        {loadingJourney ? <p className="loading-text">Verifying Ledger...</p> : (
                                            journey.length > 0 && (
                                                <div className="journey-timeline">
                                                    {journey.map((block, i) => (
                                                        <div key={i} className="journey-block">
                                                            <div className="block-marker"></div>
                                                            <div className="block-content">
                                                                <span className="block-stage">{block.data.stage}</span>
                                                                <span className="block-date">{new Date(block.timestamp).toLocaleDateString()}</span>
                                                                <p className="block-details">
                                                                    {block.data.location && <span>📍 {block.data.location}</span>}
                                                                    {block.data.status && <span className="status-tag">{block.data.status}</span>}
                                                                </p>
                                                                <code className="block-hash">Hash: {block.hash.substring(0, 16)}...</code>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
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
