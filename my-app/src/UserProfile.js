import React, { useState, useEffect } from 'react';
import API_BASE_URL from "./apiConfig";
import './UserProfile.css';

const UserProfile = ({ user, location }) => {
  const [profileData, setProfileData] = useState(null);
  const [subsidies, setSubsidies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [ordersTab, setOrdersTab] = useState('pending');


  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const [profileRes, subsidiesRes, ordersRes, complaintsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/profile/${user.id}`),
        fetch(`${API_BASE_URL}/api/user/subsidies/${user.id}`),
        fetch(`${API_BASE_URL}/api/orders/${user.id}`),
        fetch(`${API_BASE_URL}/api/user/complaints/${user.id}`)
      ]);

      const profile = await profileRes.json();
      const subsidiesData = await subsidiesRes.json();
      const ordersData = await ordersRes.json();
      const complaintsData = await complaintsRes.json();

      setProfileData(profile.user);
      setSubsidies(subsidiesData.subsidies || []);
      setOrders(Array.isArray(ordersData) ? ordersData : (ordersData.orders || []));
      setCart(ordersData.cart || []);
      setComplaints(complaintsData.complaints || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h2>User Profile</h2>
      </div>

      <div className="profile-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'subsidy' ? 'active' : ''}
          onClick={() => setActiveTab('subsidy')}
        >
          Subsidy
        </button>
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={activeTab === 'complaints' ? 'active' : ''}
          onClick={() => setActiveTab('complaints')}
        >
          Complaints
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-info">
            <div className="info-card">
              <h3>Personal Information</h3>
              <div className="info-row">
                <span className="label">Name:</span>
                <span className="value">{profileData?.username || user?.username || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{profileData?.email || user?.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">Contact Number:</span>
                <span className="value">{profileData?.phone || user?.phone || 'N/A'}</span>
              </div>
            </div>

            {location && (
              <div className="info-card">
                <h3>Location</h3>
                <div className="info-row">
                  <span className="label">Latitude:</span>
                  <span className="value">{location.latitude.toFixed(6)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Longitude:</span>
                  <span className="value">{location.longitude.toFixed(6)}</span>
                </div>
                {profileData?.location?.address && (
                  <div className="info-row">
                    <span className="label">Address:</span>
                    <span className="value">{profileData.location.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'subsidy' && (
          <div className="subsidy-section">
            <h3>Subsidy Information</h3>
            {subsidies.length === 0 ? (
              <p className="no-data">No subsidy applications found.</p>
            ) : (
              <div className="subsidy-list">
                {subsidies.map((subsidy, index) => (
                  <div key={index} className="subsidy-card">
                    <h4>{subsidy.schemeName}</h4>
                    <div className="subsidy-details">
                      <div className="detail-row">
                        <span className="label">Confirmation Date:</span>
                        <span className="value">{formatDate(subsidy.confirmationDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Approval Date:</span>
                        <span className="value">{formatDate(subsidy.approvalDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Validation Date:</span>
                        <span className="value">{formatDate(subsidy.validationDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Renewal Date:</span>
                        <span className="value">{formatDate(subsidy.renewalDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Status:</span>
                        <span className={`status-badge status-${subsidy.status}`}>
                          {subsidy.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="orders-tabs">
              <button
                className={ordersTab === 'pending' ? 'active' : ''}
                onClick={() => setOrdersTab('pending')}
              >
                Pending Orders
              </button>
              <button
                className={ordersTab === 'cart' ? 'active' : ''}
                onClick={() => setOrdersTab('cart')}
              >
                Cart ({cart.length})
              </button>
            </div>

            {ordersTab === 'pending' ? (
              <div>
                <h3>Pending Orders</h3>
                {orders.filter(o => o.status === 'pending').length === 0 ? (
                  <p className="no-data">No pending orders.</p>
                ) : (
                  <div className="orders-list">
                    {orders.filter(o => o.status === 'pending').map((order, index) => (
                      <div key={index} className="order-card">
                        <div className="order-header">
                          <span className="order-id">Order ID: {order.orderId}</span>
                          <span className={`status-badge status-${order.status}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="order-items">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="order-item">
                              <span>{item.name} ({item.type})</span>
                              <span>Qty: {item.quantity}</span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="order-total">
                          <strong>Total: ₹{order.totalAmount}</strong>
                        </div>
                        <div className="order-delivery" style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                          🚚 Expected Delivery: {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '3-5 Days'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3>Cart Items</h3>
                {cart.length === 0 ? (
                  <p className="no-data">Your cart is empty.</p>
                ) : (
                  <div className="cart-list">
                    {cart.map((item, index) => (
                      <div key={index} className="cart-item">
                        <span>{item.name} ({item.type})</span>
                        <span>Qty: {item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="complaints-section">
            <h3>Complaint Status</h3>
            {complaints.length === 0 ? (
              <p className="no-data">No complaints submitted.</p>
            ) : (
              <div className="complaints-list">
                {complaints.map((complaint, index) => (
                  <div key={index} className="complaint-card">
                    <div className="complaint-header">
                      <span className="complaint-id">Complaint ID: {complaint.complaintId}</span>
                      <span className={`status-badge status-${complaint.status}`}>
                        {complaint.status}
                      </span>
                    </div>
                    <div className="complaint-details">
                      <h4>{complaint.subject}</h4>
                      <p>{complaint.description}</p>
                      <div className="complaint-dates">
                        <span>Submitted: {formatDate(complaint.submittedDate)}</span>
                        {complaint.resolutionDate && (
                          <span>Resolved: {formatDate(complaint.resolutionDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;

