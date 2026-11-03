import { useState } from 'react';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import * as api from '../api';
import ProductImage from '../components/ProductImage';
import { getProductMeta } from '../data/productMeta';
import './Wishlist.css';

export default function Wishlist({
  token,
  showToast,
  updateCartCount,
  navigate,
  wishlistItems = [],
  setWishlistItems,
  fetchWishlist,
  loadingWishlist
}) {
  const [removing, setRemoving] = useState(new Set());
  const [addingToCart, setAddingToCart] = useState(new Set());

  // Handle Unauthenticated State
  if (!token) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-auth">
          <div className="wishlist-auth-icon">
            <Heart size={40} />
          </div>
          <h2>Please log in to view your wishlist</h2>
          <p>Sign in to save and manage your favorite items all in one place.</p>
          <button className="btn btn-primary" onClick={() => navigate('login')}>
            Login
          </button>
        </div>
      </div>
    );
  }

  // Handle Loading State
  if (loadingWishlist) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-loading">
          Loading your wishlist...
        </div>
      </div>
    );
  }

  // Handle Empty State
  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon">
            <Heart size={40} />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>Explore our products and save your favorite items for later.</p>
          <button className="btn btn-primary" onClick={() => navigate('home')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const handleRemove = async (productId) => {
    setRemoving(prev => new Set(prev).add(productId));
    try {
      const res = await api.removeFromWishlist(productId);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Removed from wishlist', 'success');
        if (setWishlistItems) {
          setWishlistItems(prev => prev.filter(item => (item.product_id || item.products?.id) !== productId));
        }
        if (fetchWishlist) {
          fetchWishlist();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to remove from wishlist', 'error');
    } finally {
      setRemoving(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleAddToCart = async (productId) => {
    if (!token) {
      showToast('Please login to add to cart', 'error');
      navigate('login');
      return;
    }

    setAddingToCart(prev => new Set(prev).add(productId));
    try {
      const res = await api.addToCart(productId);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Added to cart', 'success');
        if (updateCartCount) updateCartCount();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add to cart', 'error');
    } finally {
      setAddingToCart(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h1>
          <Heart size={28} />
          My Wishlist
          <span className="wishlist-count">({wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'})</span>
        </h1>
      </div>

      <div className="wishlist-grid">
        {wishlistItems.map((item) => {
          const product = item.products || item;
          const productId = item.product_id || product.id;
          const meta = getProductMeta(product);
          const isRemoving = removing.has(productId);
          const isAdding = addingToCart.has(productId);

          return (
            <div key={item.id || productId} className="wishlist-card">
              <div 
                className="wishlist-card-image"
                onClick={() => navigate('product', productId)}
              >
                <ProductImage src={meta.image} alt={product.name} />
              </div>

              <div className="wishlist-card-body">
                <h3 
                  className="wishlist-card-name"
                  onClick={() => navigate('product', productId)}
                >
                  {product.name}
                </h3>

                {product.categories?.name && (
                  <p className="wishlist-card-category">{product.categories.name}</p>
                )}

                <div className="wishlist-card-pricing">
                  <span className="wishlist-card-price">
                    ₹{Number(product.price || 0).toLocaleString()}
                  </span>
                  {meta.originalPrice && meta.originalPrice > product.price && (
                    <>
                      <span className="wishlist-card-original">
                        ₹{meta.originalPrice.toLocaleString()}
                      </span>
                      <span className="wishlist-card-discount">
                        {meta.discount}% off
                      </span>
                    </>
                  )}
                </div>

                <div className="wishlist-card-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddToCart(productId)}
                    disabled={isAdding}
                  >
                    <ShoppingCart size={15} />
                    {isAdding ? 'Adding...' : 'Add to Cart'}
                  </button>

                  <button
                    className="wishlist-remove-btn"
                    onClick={() => handleRemove(productId)}
                    disabled={isRemoving}
                    title="Remove from wishlist"
                  >
                    <Trash2 size={15} />
                    {isRemoving ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
