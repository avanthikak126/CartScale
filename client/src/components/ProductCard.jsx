import { useState } from 'react';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import ProductImage from './ProductImage';
import { getProductMeta } from '../data/productMeta';
import './ProductCard.css';

export default function ProductCard({ product, onAddToCart, onClick, isInWishlist, onToggleWishlist }) {
  const [adding, setAdding] = useState(false);
  const meta = getProductMeta(product);

  const handleAdd = async (e) => {
    e.stopPropagation();
    setAdding(true);
    await onAddToCart(product.id);
    setAdding(false);
  };

  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating);
    const half = rating - full >= 0.3;
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={13}
          className={i < full || (i === full && half) ? '' : 'star-empty'}
          fill={i < full ? '#facc15' : i === full && half ? '#facc15' : 'none'}
          strokeWidth={i < full || (i === full && half) ? 0 : 1.5}
        />
      );
    }
    return stars;
  };

  return (
    <div className="product-card" onClick={() => onClick && onClick(product.id)}>
      {meta.badge && <span className="product-badge">{meta.badge}</span>}
      
      <button
        className={`product-card-wishlist ${isInWishlist ? 'wishlisted' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist && onToggleWishlist(product.id);
        }}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart size={18} fill={isInWishlist ? '#ef4444' : 'none'} />
      </button>
      
      <div className="product-card-image">
        <ProductImage src={meta.image} alt={product.name} />
      </div>
      
      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        {product.categories?.name && (
          <p className="product-card-category">{product.categories.name}</p>
        )}
        
        <div className="product-card-rating">
          <div className="stars">{renderStars(meta.rating)}</div>
          <span className="product-card-rating-value">{meta.rating}</span>
          <span className="product-card-reviews">({meta.reviewCount.toLocaleString()})</span>
        </div>
        
        <div className="product-card-pricing">
          <span className="product-card-price">₹{Number(product.price).toLocaleString()}</span>
          {meta.originalPrice && meta.originalPrice > product.price && (
            <>
              <span className="product-card-original">₹{meta.originalPrice.toLocaleString()}</span>
              <span className="product-card-discount">{meta.discount}% off</span>
            </>
          )}
        </div>
        
        <div className="product-card-actions">
          <button className="btn btn-primary btn-sm product-card-add" onClick={handleAdd} disabled={adding}>
            <ShoppingCart size={14} />
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
