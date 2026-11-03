import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import SmartBuy from './pages/SmartBuy';
import * as api from './api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentProductId, setCurrentProductId] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistProductIds, setWishlistProductIds] = useState(new Set());
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const isLoggedIn = !!token;

  const navigate = useCallback((page, id = null) => {
    setCurrentPage(page);
    if (id) setCurrentProductId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateCartCount = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setCartItemCount(0);
      return;
    }
    try {
      const { data } = await api.getCart();
      if (data?.items) {
        setCartItemCount(data.items.reduce((sum, item) => sum + item.quantity, 0));
      }
    } catch {
      /* silent */
    }
  }, []);

  const fetchWishlist = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setWishlistItems([]);
      setWishlistProductIds(new Set());
      return;
    }
    setLoadingWishlist(true);
    try {
      const { data } = await api.getWishlist();
      if (data?.items) {
        setWishlistItems(data.items);
        setWishlistProductIds(new Set(data.items.map(item => item.product_id)));
      }
    } catch {
      /* silent */
    } finally {
      setLoadingWishlist(false);
    }
  }, []);

  const toggleWishlist = useCallback(async (productId) => {
    if (!localStorage.getItem('token')) {
      showToast('Please login to save items to your wishlist', 'error');
      navigate('login');
      return;
    }
    const isInWishlist = wishlistProductIds.has(productId);
    if (isInWishlist) {
      const res = await api.removeFromWishlist(productId);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
        setWishlistProductIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        showToast('Removed from wishlist', 'info');
      }
    } else {
      const res = await api.addToWishlist(productId);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Added to wishlist!', 'success');
        fetchWishlist();
      }
    }
  }, [wishlistProductIds, showToast, navigate, fetchWishlist]);

  const handleLogin = useCallback((accessToken) => {
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    navigate('home');
    showToast('Welcome back! You are now signed in.', 'success');
  }, [navigate, showToast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setCartItemCount(0);
    setWishlistItems([]);
    setWishlistProductIds(new Set());
    setSelectedCategory(null);
    setSearchQuery('');
    navigate('home');
    showToast('You have been logged out.', 'info');
  }, [navigate, showToast]);

  useEffect(() => {
    updateCartCount();
    fetchWishlist();
  }, [token, updateCartCount, fetchWishlist]);

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onLogin={handleLogin} navigate={navigate} />;
      case 'signup':
        return <Signup onLogin={handleLogin} navigate={navigate} />;
      case 'cart':
        return (
          <Cart
            token={token}
            showToast={showToast}
            updateCartCount={updateCartCount}
            navigate={navigate}
          />
        );
      case 'checkout':
        return (
          <Checkout
            token={token}
            showToast={showToast}
            updateCartCount={updateCartCount}
            navigate={navigate}
          />
        );
      case 'orders':
        return (
          <Orders
            token={token}
            showToast={showToast}
            navigate={navigate}
          />
        );
      case 'product':
        return (
          <ProductDetail
            productId={currentProductId}
            token={token}
            navigate={navigate}
            showToast={showToast}
            updateCartCount={updateCartCount}
            isInWishlist={wishlistProductIds.has(currentProductId)}
            onToggleWishlist={toggleWishlist}
          />
        );
      case 'wishlist':
        return (
          <Wishlist
            token={token}
            showToast={showToast}
            updateCartCount={updateCartCount}
            navigate={navigate}
            wishlistItems={wishlistItems}
            setWishlistItems={setWishlistItems}
            fetchWishlist={fetchWishlist}
            loadingWishlist={loadingWishlist}
          />
        );
      case 'smartbuy':
        return (
          <SmartBuy
            token={token}
            navigate={navigate}
            showToast={showToast}
            updateCartCount={updateCartCount}
            wishlistProductIds={wishlistProductIds}
            onToggleWishlist={toggleWishlist}
          />
        );
      default:
        return (
          <Home
            token={token}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            showToast={showToast}
            updateCartCount={updateCartCount}
            navigate={navigate}
            wishlistProductIds={wishlistProductIds}
            onToggleWishlist={toggleWishlist}
          />
        );
    }
  };

  return (
    <>
      <Navbar
        isLoggedIn={isLoggedIn}
        cartItemCount={cartItemCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        navigate={navigate}
        onLogout={handleLogout}
        currentPage={currentPage}
        wishlistCount={wishlistItems.length}
      />

      <main className="main-content">
        {renderPage()}
      </main>

      {currentPage !== 'login' && currentPage !== 'signup' && <Footer navigate={navigate} />}

      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </div>
    </>
  );
}