import { useState, useEffect } from 'react';
import { ShoppingCart, Star, ArrowLeft, Truck, Shield, RotateCcw, AlertCircle, Heart } from 'lucide-react';
import * as api from '../api';
import { getProductMeta } from '../data/productMeta';
import ProductImage from '../components/ProductImage';
import LoadingSpinner from '../components/LoadingSpinner';
import './ProductDetail.css';

export default function ProductDetail({ productId, token, navigate, showToast, updateCartCount, isInWishlist, onToggleWishlist }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data, error } = await api.getProductById(productId);
        if (error) throw new Error(error);
        setProduct(data);
      } catch (err) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!token) {
      showToast('Please login to add to cart', 'error');
      navigate('login');
      return;
    }
    setAdding(true);
    const res = await api.addToCart(product.id);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Added to cart', 'success');
      if (updateCartCount) updateCartCount();
    }
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!token) {
      showToast('Please login to buy', 'error');
      navigate('login');
      return;
    }
    setAdding(true);
    const res = await api.addToCart(product.id);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      if (updateCartCount) updateCartCount();
      navigate('cart');
    }
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="product-detail-container loading-state">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-container error-state">
        <AlertCircle size={48} className="error-icon" />
        <h2>Oops! Something went wrong</h2>
        <p>{error || 'Product not found'}</p>
        <button className="btn btn-primary" onClick={() => navigate('home')}>
          Back to Home
        </button>
      </div>
    );
  }

  const meta = getProductMeta(product);
  const isOutOfStock = product.inventory?.quantity === 0;

  return (
    <div className="product-detail-container">
      <button className="back-btn" onClick={() => navigate('home')}>
        <ArrowLeft size={16} /> Back to Catalog
      </button>

      <div className="product-detail-content">
        <div className="product-detail-image-sec">
          <ProductImage src={meta.image} alt={product.name} />
        </div>

        <div className="product-detail-info">
          {meta.badge && <span className="product-badge detail-badge">{meta.badge}</span>}
          <h1 className="product-title">{product.name}</h1>
          
          <div className="product-meta">
            <span className="product-brand">{product.brand || 'Generic Brand'}</span>
            <div className="product-rating">
              <Star size={16} fill="#facc15" stroke="none" />
              <span className="rating-val">{meta.rating}</span>
              <span className="review-count">({meta.reviewCount} reviews)</span>
            </div>
          </div>

          <div className="product-pricing-box">
            <span className="current-price">₹{Number(product.price).toLocaleString()}</span>
            {meta.originalPrice > product.price && (
              <>
                <span className="original-price">₹{meta.originalPrice.toLocaleString()}</span>
                <span className="discount-tag">{meta.discount}% OFF</span>
              </>
            )}
          </div>

          <div className="stock-status">
            {isOutOfStock ? (
              <span className="status-out">Out of Stock</span>
            ) : (
              <span className="status-in">In Stock (Ready to ship)</span>
            )}
          </div>

          <div className="product-description">
            <h3>Product Description</h3>
            <p>{product.description || 'No description available for this product.'}</p>
          </div>

          <div className="product-actions">
            <button 
              className="btn btn-secondary btn-lg" 
              onClick={handleAddToCart}
              disabled={adding || isOutOfStock}
            >
              <ShoppingCart size={18} />
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button 
              className="btn btn-primary btn-lg" 
              onClick={handleBuyNow}
              disabled={adding || isOutOfStock}
            >
              Buy Now
            </button>
            <button 
              className={`btn btn-lg product-detail-wishlist-btn ${isInWishlist ? 'wishlisted' : ''}`}
              onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
              type="button"
            >
              <Heart size={18} fill={isInWishlist ? '#ef4444' : 'none'} color={isInWishlist ? '#ef4444' : 'currentColor'} />
              {isInWishlist ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>

          <div className="product-trust">
            <div className="trust-item"><Truck size={18}/> Free Shipping</div>
            <div className="trust-item"><Shield size={18}/> 1 Year Warranty</div>
            <div className="trust-item"><RotateCcw size={18}/> 30-Day Returns</div>
          </div>
        </div>
      </div>
    </div>
  );
}
