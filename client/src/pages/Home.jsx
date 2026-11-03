import { useState, useEffect, useMemo, useCallback } from 'react';
import * as api from '../api';
import Hero from '../components/Hero';
import CategorySection from '../components/CategorySection';
import ProductGrid from '../components/ProductGrid';
import { getProductMeta, getCuratedSections, isTestProduct, deduplicateProducts } from '../data/productMeta';
import './Home.css';

function Home({ token, searchQuery, selectedCategory, setSelectedCategory, showToast, updateCartCount, navigate, wishlistProductIds, onToggleWishlist }) {
  const [homeProducts, setHomeProducts] = useState([]);
  const [browseProducts, setBrowseProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const PRODUCTS_PER_PAGE = 20;

  // Load homepage curated data
  const fetchHomeData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.getProducts(50, 1),
        api.getCategories()
      ]);
      
      if (prodRes.error) throw new Error(prodRes.error);
      if (catRes.error) throw new Error(catRes.error);
      
      const prodData = prodRes.data;
      const products = prodData?.products || prodData || [];
      setHomeProducts(products);
      setCategories(catRes.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const isBrowsing = !!(searchQuery || selectedCategory);

  // Map frontend sort values to backend sort params
  const getBackendSort = useCallback((frontendSort) => {
    switch (frontendSort) {
      case 'price-low': return 'price-low';
      case 'price-high': return 'price-high';
      case 'name-az': return 'name-az';
      default: return '';
    }
  }, []);

  // Fetch products from server when browsing/searching/filtering
  const fetchBrowseProducts = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const res = await api.getProducts(PRODUCTS_PER_PAGE, currentPage, {
        categoryId: selectedCategory?.id,
        search: searchQuery || '',
        sort: getBackendSort(sortBy)
      });
      
      if (res.error) throw new Error(res.error);
      
      const data = res.data;
      const products = data?.products || data || [];
      setBrowseProducts(products);
      setTotalPages(data?.totalPages || 1);
      setTotalProducts(data?.total || products.length);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setBrowseLoading(false);
    }
  }, [currentPage, selectedCategory, searchQuery, sortBy, getBackendSort]);

  useEffect(() => {
    fetchBrowseProducts();
  }, [fetchBrowseProducts]);

  // Reset page when search/category/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const handleAddToCart = async (productId) => {
    if (!token) {
      showToast('Please login to add to cart', 'error');
      navigate('login');
      return;
    }
    const res = await api.addToCart(productId);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Added to cart', 'success');
      if (updateCartCount) updateCartCount();
    }
  };

  const handleBuyNow = async (productId) => {
    if (!token) {
      showToast('Please login to buy', 'error');
      navigate('login');
      return;
    }
    const res = await api.addToCart(productId);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      if (updateCartCount) updateCartCount();
      navigate('cart');
    }
  };

  const clearFilters = () => {
    if (setSelectedCategory) setSelectedCategory(null);
    setSortBy('relevance');
    setCurrentPage(1);
    setShowAllProducts(false);
  };

  const cleanHomeProducts = useMemo(() => {
    const validProducts = homeProducts.filter(p => !isTestProduct(p));
    return deduplicateProducts(validProducts);
  }, [homeProducts]);

  const curated = useMemo(() => getCuratedSections(cleanHomeProducts), [cleanHomeProducts]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return (
      <div className="pagination">
        <button 
          className="pagination-btn" 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>
        
        {start > 1 && (
          <>
            <button className="pagination-btn" onClick={() => handlePageChange(1)}>1</button>
            {start > 2 && <span className="pagination-ellipsis">…</span>}
          </>
        )}
        
        {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(pageNum => (
          <button
            key={pageNum}
            className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
            onClick={() => handlePageChange(pageNum)}
          >
            {pageNum}
          </button>
        ))}
        
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
            <button className="pagination-btn" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
          </>
        )}
        
        <button 
          className="pagination-btn" 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <div className="home-page">
      {!isBrowsing ? (
        <>
          <Hero 
            onShopNow={() => {
              const el = document.getElementById('deals-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onExploreDeals={() => {
              const el = document.getElementById('deals-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <CategorySection 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          
          <ProductGrid
            sectionId="deals-section"
            sectionClassName="deals-section"
            title="Deals of the Day"
            subtitle="Hurry, these deals end soon!"
            products={curated.deals}
            loading={loading}
            error={error}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isLoggedIn={!!token}
            showViewAll={true}
            onRetry={fetchHomeData}
            onProductClick={(id) => navigate('product', id)}
            wishlistProductIds={wishlistProductIds}
            onToggleWishlist={onToggleWishlist}
          />

          <ProductGrid
            sectionId="featured-section"
            title="Featured Products"
            subtitle="Handpicked just for you"
            products={curated.featured}
            loading={loading}
            error={error}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isLoggedIn={!!token}
            showViewAll={true}
            onRetry={fetchHomeData}
            onProductClick={(id) => navigate('product', id)}
            wishlistProductIds={wishlistProductIds}
            onToggleWishlist={onToggleWishlist}
          />

          <ProductGrid
            sectionId="trending-section"
            title="Trending Now"
            subtitle="What everyone is buying"
            products={curated.trending}
            loading={loading}
            error={error}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isLoggedIn={!!token}
            showViewAll={true}
            onRetry={fetchHomeData}
            onProductClick={(id) => navigate('product', id)}
            wishlistProductIds={wishlistProductIds}
            onToggleWishlist={onToggleWishlist}
          />

          <div className="browse-header" style={{ padding: '0 24px', marginTop: '48px', maxWidth: '1200px', margin: '48px auto 0' }}>
            <h2 className="browse-title" style={{ fontSize: '24px', fontWeight: 'bold' }}>
              Explore Our Full Collection
              <span className="browse-count"> ({totalProducts} products)</span>
            </h2>
            
            <div className="browse-controls">
              <div className="sort-dropdown">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="relevance">Sort by: Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-az">Name: A-Z</option>
                </select>
              </div>
            </div>
          </div>

          <ProductGrid
            products={browseProducts}
            loading={browseLoading}
            error={error}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isLoggedIn={!!token}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onClearFilters={clearFilters}
            onRetry={fetchBrowseProducts}
            onProductClick={(id) => navigate('product', id)}
            wishlistProductIds={wishlistProductIds}
            onToggleWishlist={onToggleWishlist}
          />

          {renderPagination()}

          <section className="trust-section">
            <div className="trust-item">
              <span className="trust-icon">🚚</span>
              <span className="trust-text">Free Shipping</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🔒</span>
              <span className="trust-text">Secure Payments</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">↩️</span>
              <span className="trust-text">Easy Returns</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🎧</span>
              <span className="trust-text">24/7 Support</span>
            </div>
          </section>
        </>
      ) : (
        <div className="browsing-mode">
          <CategorySection 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          
          <div className="browse-header">
            <h2 className="browse-title">
              {searchQuery ? `Search results for "${searchQuery}"` : (selectedCategory?.name || 'All Products')}
              <span className="browse-count"> ({totalProducts} products)</span>
            </h2>
            
            <div className="browse-controls">
              <div className="sort-dropdown">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="relevance">Sort by: Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-az">Name: A-Z</option>
                </select>
              </div>

              {(searchQuery || selectedCategory) && (
                <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                  ← Back to Home
                </button>
              )}
            </div>
          </div>

          <ProductGrid
            products={browseProducts}
            loading={browseLoading}
            error={error}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isLoggedIn={!!token}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onClearFilters={clearFilters}
            onRetry={fetchBrowseProducts}
            onProductClick={(id) => navigate('product', id)}
            wishlistProductIds={wishlistProductIds}
            onToggleWishlist={onToggleWishlist}
          />

          {renderPagination()}
        </div>
      )}
    </div>
  );
}

export default Home;
