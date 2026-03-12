import React, { useEffect, useState } from 'react';
import API_BASE_URL from './apiConfig';
import UserProfile from './UserProfile';
import Schemes from './Schemes';
import Pesticide from './Pesticide';
import Seeds from './Seeds';
import MarketPrice from './MarketPrice';
import Help from './Help';
import Complaint from './Complaint';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [currentView, setCurrentView] = useState('home');
  const [location, setLocation] = useState(null);

  // 🌍 Location logic
  useEffect(() => {
    if (!user) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(loc);

          // optional backend update
          fetch(`${API_BASE_URL}/api/user/location/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loc),
          }).catch(() => { });
        },
        () => { }
      );
    }
  }, [user]);

  const renderView = () => {
    switch (currentView) {
      case 'profile':
        return <UserProfile user={user} location={location} />;
      case 'schemes':
        return <Schemes />;
      case 'pesticide':
        return <Pesticide />;
      case 'seeds':
        return <Seeds />;
      case 'market':
        return <MarketPrice />;
      case 'help':
        return <Help />;
      case 'complaint':
        return <Complaint user={user} />;
      default:
        return (
          <div className="dashboard-home">
            <h1>Welcome {user?.username}</h1>

            <div className="hero-buttons">
              <button onClick={() => setCurrentView('profile')}>Profile</button>
              <button onClick={() => setCurrentView('schemes')}>Schemes</button>
              <button onClick={() => setCurrentView('pesticide')}>Pesticide</button>
              <button onClick={() => setCurrentView('seeds')}>Seeds</button>
              <button onClick={() => setCurrentView('market')}>Market Price</button>
              <button onClick={() => setCurrentView('complaint')}>Complaint</button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-home">
      <h1>Welcome, {user.username}</h1>
      <p>Dashboard loaded successfully</p>
    </div>
  );
};

export default Dashboard;
