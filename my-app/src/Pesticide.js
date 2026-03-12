import React, { useState, useEffect } from 'react';
import API_BASE_URL from "./apiConfig";
import Navbar from "./Navbar";
import './Pesticide.css';

const Pesticide = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const data = await res.json();
        // Filter only pesticide category if needed, or backend returns all
        setProducts(data.filter(p => p.category === 'Pesticide'));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    if (!user?.id) {
      alert('Please login to add items to cart');
      return;
    }
    // Add logic to call add-to-cart API
    alert(`Added ${product.name} to cart!`);
  };

  if (loading) return <div className="loading">Loading Pesticides...</div>;

  return (
    <div className="pesticide-page">
      <div className="page-header">
        <h2>પેસ્ટિસાઇડ / Pesticides</h2>
        <p>Browse and purchase agricultural pesticides</p>
      </div>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <div className="product-image">
              <img src={`${API_BASE_URL}${product.imageUrl}`} alt={product.name} onError={(e) => { e.target.onerror = null; e.target.src = "/khedutbandhu.png" }} />
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-price">₹{product.price}</div>
              <button
                className="btn-add-cart"
                onClick={() => handleAddToCart(product)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pesticide;

