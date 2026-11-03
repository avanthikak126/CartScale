import { useState } from 'react';
import {
  ShoppingCart, Search, User, Package, Menu, X, LogOut, Home, Heart, Sparkles,
} from 'lucide-react';
import './Navbar.css';

export default function Navbar({
  isLoggedIn, cartItemCount, searchQuery, setSearchQuery,
  navigate, onLogout, currentPage, wishlistCount,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page) => {
    navigate(page);
    setMobileOpen(false);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 'home') navigate('home');
  };

  const clearSearch = () => setSearchQuery('');

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <button className="navbar-logo" onClick={() => handleNav('home')}>
          <ShoppingCart size={28} />
          <span className="navbar-logo-text">CartScale</span>
        </button>

        {/* Search — desktop */}
        <div className="navbar-search">
          <Search size={18} className="navbar-search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearch}
            className="navbar-search-input"
          />
          {searchQuery && (
            <button className="navbar-search-clear" onClick={clearSearch}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Desktop links */}
        <div className="navbar-links">
          <button
            className={`navbar-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNav('home')}
          >
            <Home size={18} />
            <span>Home</span>
          </button>

          <button
            className={`navbar-link smartbuy-nav-link ${currentPage === 'smartbuy' ? 'active' : ''}`}
            onClick={() => handleNav('smartbuy')}
          >
            <Sparkles size={18} className="smartbuy-nav-icon" />
            <span>SmartBuy</span>
          </button>

          <button
            className={`navbar-link ${currentPage === 'wishlist' ? 'active' : ''}`}
            onClick={() => handleNav('wishlist')}
          >
            <div className="navbar-cart-icon-wrapper">
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className="navbar-cart-badge">{wishlistCount > 99 ? '99+' : wishlistCount}</span>
              )}
            </div>
            <span>Wishlist</span>
          </button>

          {isLoggedIn && (
            <button
              className={`navbar-link ${currentPage === 'orders' ? 'active' : ''}`}
              onClick={() => handleNav('orders')}
            >
              <Package size={18} />
              <span>Orders</span>
            </button>
          )}

          <button
            className={`navbar-link navbar-cart ${currentPage === 'cart' ? 'active' : ''}`}
            onClick={() => handleNav('cart')}
          >
            <div className="navbar-cart-icon-wrapper">
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="navbar-cart-badge">{cartItemCount > 99 ? '99+' : cartItemCount}</span>
              )}
            </div>
            <span>Cart</span>
          </button>

          {isLoggedIn ? (
            <button className="navbar-link navbar-logout" onClick={onLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          ) : (
            <button
              className={`navbar-link ${currentPage === 'login' ? 'active' : ''}`}
              onClick={() => handleNav('login')}
            >
              <User size={18} />
              <span>Login</span>
            </button>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="navbar-mobile-right">
          <button className="navbar-mobile-cart" onClick={() => handleNav('cart')}>
            <ShoppingCart size={22} />
            {cartItemCount > 0 && (
              <span className="navbar-cart-badge">{cartItemCount > 99 ? '99+' : cartItemCount}</span>
            )}
          </button>
          <button
            className="navbar-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && <div className="navbar-overlay" onClick={() => setMobileOpen(false)} />}
      <div className={`navbar-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="navbar-drawer-search">
          <Search size={18} className="navbar-search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearch}
            className="navbar-search-input"
          />
          {searchQuery && (
            <button className="navbar-search-clear" onClick={clearSearch}>
              <X size={16} />
            </button>
          )}
        </div>

        <button className="navbar-drawer-link" onClick={() => handleNav('home')}>
          <Home size={20} /> Home
        </button>
        <button className="navbar-drawer-link" onClick={() => handleNav('smartbuy')}>
          <Sparkles size={20} className="smartbuy-nav-icon" /> SmartBuy Optimizer
        </button>
        {isLoggedIn && (
          <button className="navbar-drawer-link" onClick={() => handleNav('orders')}>
            <Package size={20} /> My Orders
          </button>
        )}
        <button className="navbar-drawer-link" onClick={() => handleNav('wishlist')}>
          <Heart size={20} /> Wishlist
          {wishlistCount > 0 && <span className="navbar-cart-badge">{wishlistCount}</span>}
        </button>
        <button className="navbar-drawer-link" onClick={() => handleNav('cart')}>
          <ShoppingCart size={20} /> Cart
          {cartItemCount > 0 && <span className="navbar-cart-badge">{cartItemCount}</span>}
        </button>
        {isLoggedIn ? (
          <button className="navbar-drawer-link" onClick={() => { onLogout(); setMobileOpen(false); }}>
            <LogOut size={20} /> Logout
          </button>
        ) : (
          <button className="navbar-drawer-link" onClick={() => handleNav('login')}>
            <User size={20} /> Login
          </button>
        )}
      </div>
    </nav>
  );
}
