import ProductCard from './ProductCard';
import './ProductGrid.css';

function ProductGrid({
  products = [],
  loading = false,
  error = '',
  onAddToCart,
  onRetry,
  title,
  subtitle,
  showViewAll,
  maxColumns = 4,
  emptyMessage,
  sectionId,
  sectionClassName = '',
  searchQuery,
  onClearFilters,
  onProductClick,
  wishlistProductIds,
  onToggleWishlist
}) {
  
  if (loading) {
    return (
      <section id={sectionId} className={`product-section ${sectionClassName}`}>
        <div className="product-section-inner">
          <div className="loading-state">Loading products...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id={sectionId} className={`product-section ${sectionClassName}`}>
        <div className="product-section-inner">
          <div className="error-state">
            <p>{error}</p>
            {onRetry && <button onClick={onRetry}>Retry</button>}
          </div>
        </div>
      </section>
    );
  }

  const hasNoResults = products.length === 0;

  return (
    <section id={sectionId} className={`product-section ${sectionClassName}`}>
      <div className="product-section-inner">
        
        {(title || subtitle || showViewAll) && (
          <div className="section-header">
            <div className="section-title-wrapper">
              {title && <h2 className="section-title">{title}</h2>}
              {subtitle && <p className="section-subtitle">{subtitle}</p>}
            </div>
            {showViewAll && (
              <a href="#" className="view-all-link">View All</a>
            )}
          </div>
        )}

        {hasNoResults ? (
          <div className="empty-state">
            <p>
              {emptyMessage || 
               (searchQuery ? `No results for "${searchQuery}"` : 'No products found.')}
            </p>
            {onClearFilters && (
              <button className="continue-shopping-btn" onClick={onClearFilters}>
                Continue Shopping
              </button>
            )}
          </div>
        ) : (
          <div 
            className="product-grid" 
            style={{ '--max-cols': maxColumns }}
          >
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onClick={onProductClick}
                isInWishlist={wishlistProductIds?.has(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}
        
      </div>
    </section>
  );
}

export default ProductGrid;
