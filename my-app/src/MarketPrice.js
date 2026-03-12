import React, { useState, useEffect } from 'react';
import API_BASE_URL from "./apiConfig";
import './MarketPrice.css';

const MarketPrice = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');

  useEffect(() => {
    fetchMarketPrices();
  }, []);

  const fetchMarketPrices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/market`); // Updated Endpoint
      const data = await response.json();
      setPrices(data || []); // Adjusted
      if (data.length > 0) setDate(new Date(data[0].createdAt || Date.now()).toLocaleDateString('en-GB'));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching market prices:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading market prices...</div>;
  }

  return (
    <div className="market-price-page">
      <div className="market-header">
        <h2>આજની બજાર કિંમત / Today's Market Price</h2>
        <p>Last updated: {date}</p>
      </div>

      <div className="price-table-container">
        <table className="price-table">
          <thead>
            <tr>
              <th>Crop</th>
              <th>Price</th>
              <th>Unit</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price, index) => (
              <tr key={index}>
                <td className="crop-name">{price.crop}</td>
                <td className="price-value">₹{price.price.toLocaleString()}</td>
                <td className="unit">{price.unit}</td>
                <td className={`change ${price.change.startsWith('+') ? 'positive' : 'negative'}`}>
                  {price.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketPrice;

