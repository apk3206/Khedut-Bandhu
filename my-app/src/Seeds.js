import React, { useState, useEffect } from "react";
import API_BASE_URL from "./apiConfig";
import Navbar from "./Navbar";
import './Pesticide.css';

const Seeds = ({ user }) => {
  const [products] = useState([
    { id: 1, name: 'Wheat Seeds (HD-3086)', price: 45, type: 'seed', description: 'High yielding wheat variety' },
    { id: 2, name: 'Groundnut Seeds (GG-20)', price: 120, type: 'seed', description: 'Premium groundnut seeds' },
    { id: 3, name: 'Cotton Seeds (Bollgard)', price: 850, type: 'seed', description: 'BT cotton hybrid seeds' },
    { id: 4, name: 'Rice Seeds (Basmati)', price: 65, type: 'seed', description: 'Aromatic basmati rice seeds' },
    { id: 5, name: 'Bajra Seeds (Hybrid)', price: 55, type: 'seed', description: 'High yield bajra seeds' },
    { id: 6, name: 'Jowar Seeds (Maldandi)', price: 50, type: 'seed', description: 'Drought resistant jowar' },
  ]);

  const handleAddToCart = async (product) => {
    if (!user?.id) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/cart/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          type: product.type,
          quantity: 1,
          price: product.price
        })
      });

      if (response.ok) {
        alert('Item added to cart!');
      } else {
        alert('Error adding item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart');
    }
  };

  return (
    <div className="seeds-page">
      <div className="page-header">
        <h2>બીજ / Seeds</h2>
        <p>Browse and purchase quality crop seeds</p>
      </div>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              <span>🌱</span>
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-price">₹{product.price}/kg</div>
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

export default Seeds;

