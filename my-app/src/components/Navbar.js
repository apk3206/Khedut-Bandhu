import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Navbar.css";

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
    const [cartCount, setCartCount] = React.useState(0);

    React.useEffect(() => {
        const updateCartCount = () => {
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                const cart = userData.cart || [];
                setCartCount(cart.reduce((acc, item) => acc + (item.quantity || item.qty || 0), 0));
            } else {
                setCartCount(0);
            }
        };

        updateCartCount();
        window.addEventListener("storage", updateCartCount);
        // Custom event for internal updates
        window.addEventListener("cartUpdated", updateCartCount);

        return () => {
            window.removeEventListener("storage", updateCartCount);
            window.removeEventListener("cartUpdated", updateCartCount);
        };
    }, []);

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
        setShowLogoutConfirm(false);
    };

    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-container">
                    <div className="navbar-brand" onClick={() => navigate("/")}>
                        <span className="brand-icon">🌱</span>
                        <h1>Khedut Bandhu</h1>
                    </div>

                    <div className="navbar-actions">
                        <div className="lang-wrapper">
                            <span className="lang-icon">🌐</span>
                            <select onChange={changeLanguage} className="lang-select" value={i18n.language}>
                                <option value="en">English</option>
                                <option value="hi">हिंदी (Hindi)</option>
                                <option value="gu">ગુજરાતી (Gujarati)</option>
                            </select>
                        </div>

                        <div className="navbar-user-section">
                            {user ? (
                                <div className="user-profile-nav">
                                    <div className="cart-nav-link" onClick={() => navigate("/cart")}>
                                        <span className="cart-icon">🛒</span>
                                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                    </div>
                                    <div className="user-info" onClick={() => navigate("/profile")}>
                                        <div className="user-avatar">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="user-details">
                                            <span className="user-name">{user.username}</span>
                                            <span className="user-role">{user.role}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn">
                                        {t('logout') || 'Logout'}
                                    </button>
                                </div>
                            ) : (
                                location.pathname === "/signup" ? (
                                    <button onClick={() => navigate("/")} className="login-nav-btn">
                                        {t('login') || 'Login'}
                                    </button>
                                ) : (
                                    <button onClick={() => navigate("/signup")} className="login-nav-btn">
                                        {t('signup') || 'Sign Up'}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {showLogoutConfirm && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <h3>Confirm Logout</h3>
                        <p>Are you sure you want to sign out of your account?</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                            <button className="confirm-btn" onClick={handleLogout}>Yes, Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
