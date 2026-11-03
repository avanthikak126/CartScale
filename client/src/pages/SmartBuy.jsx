import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, ShoppingBag, Package, RefreshCw,
  AlertCircle, ShieldCheck, Heart, Search, X,
  SlidersHorizontal, IndianRupee, Tag, RotateCcw
} from 'lucide-react';
import * as api from '../api';
import ProductImage from '../components/ProductImage';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProductMeta } from '../data/productMeta';
import './SmartBuy.css';

const QUICK_BUDGETS = [1000, 2500, 5000, 10000, 25000, 50000];

const SEARCH_EXAMPLES = [
  'Samsung Galaxy phone',
  'Cotton shirt',
  'Wireless headphones',
  'Running shoes',
  'Gaming laptop',
  'Office chair'
];

export default function SmartBuy({
  token,
  navigate,
  showToast,
  updateCartCount,
  wishlistProductIds = new Set(),
  onToggleWishlist
}) {
  // Input states
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [preferredBrand, setPreferredBrand] = useState('');
  const [sortBy, setSortBy] = useState('smart');

  // Results state
  const [recommendations, setRecommendations] = useState([]);
  const [minMatchingProduct, setMinMatchingProduct] = useState(null);

  // Status state
  const [loading, setLoading] = useState(false);
  const [addingCartId, setAddingCartId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [searched, setSearched] = useState(false);

  // Load available categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        if (res.data) {
          setCategories(res.data);
        }
      } catch {
        /* silent */
      }
    }
    loadCategories();
  }, []);

  // Main search generator
  const triggerSmartBuySearch = useCallback(async (overrides = {}) => {
    const targetQuery = overrides.customQuery !== undefined ? overrides.customQuery : query;
    const targetBudget = overrides.customBudget !== undefined ? overrides.customBudget : (budget ? Number(budget) : null);
    const targetCatId = overrides.customCategoryId !== undefined ? overrides.customCategoryId : selectedCategoryId;
    const targetBrand = overrides.customBrand !== undefined ? overrides.customBrand : preferredBrand;
    const targetSort = overrides.customSort || sortBy;

    setLoading(true);
    setErrorMessage('');
    setSearched(true);

    try {
      const payload = {
        query: targetQuery ? targetQuery.trim() : null,
        budget: targetBudget && targetBudget > 0 ? targetBudget : null,
        category_id: targetCatId ? Number(targetCatId) : null,
        preferred_brand: targetBrand ? targetBrand.trim() : null,
        sort_by: targetSort,
        limit: 20
      };

      const res = await api.getSmartBuyRecommendations(payload);
      if (res.error) {
        setErrorMessage(res.error);
        setRecommendations([]);
        setMinMatchingProduct(null);
      } else {
        const products = res.data?.products || [];
        setRecommendations(products);
        setMinMatchingProduct(res.data?.minMatchingProduct || null);

        if (products.length === 0) {
          const searchDesc = targetQuery ? `"${targetQuery}"` : 'your filters';
          showToast(`No products found matching ${searchDesc}`, 'info');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, [query, budget, selectedCategoryId, preferredBrand, sortBy, showToast]);

  // Handle single Add To Cart
  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    if (!token) {
      showToast('Please login to add items to your cart', 'error');
      navigate('login');
      return;
    }

    setAddingCartId(product.id);
    try {
      const res = await api.addToCart(product.id, 1);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Added ${product.name} to cart!`, 'success');
        if (updateCartCount) updateCartCount();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add to cart', 'error');
    } finally {
      setAddingCartId(null);
    }
  };

  // Quick suggestion click
  const handleSelectExample = (exampleText) => {
    setQuery(exampleText);
    triggerSmartBuySearch({ customQuery: exampleText });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setQuery('');
    setBudget('');
    setSelectedCategoryId('');
    setPreferredBrand('');
    setSortBy('smart');
    setRecommendations([]);
    setMinMatchingProduct(null);
    setSearched(false);
    setErrorMessage('');
  };

  // Handle key press in inputs
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSmartBuySearch();
    }
  };

  const hasActiveFilters = Boolean(
    query.trim() || budget || selectedCategoryId || preferredBrand.trim() || sortBy !== 'smart'
  );

  return (
    <div className="smartbuy-container">
      {/* Header Banner */}
      <header className="smartbuy-header">
        <div className="smartbuy-header-badge">
          <Sparkles size={16} />
          <span>CartScale SmartBuy • Product Finder</span>
        </div>
        <h1 className="smartbuy-title">Find Products That Fit Your Needs</h1>
        <p className="smartbuy-subtitle">
          Type directly what you are looking for, with optional budget, brand, or category filters.
          CartScale intelligently ranks products by relevance, customer satisfaction, and value.
        </p>
      </header>

      {/* Main Control Panel */}
      <section className="smartbuy-control-panel">
        {/* Primary Search Input: "What are you looking for?" */}
        <div className="search-primary-group">
          <label className="smartbuy-label primary-search-label" htmlFor="smartbuy-search-input">
            <Search size={18} />
            <span>What are you looking for?</span>
          </label>
          <div className="search-input-wrapper">
            <Search size={20} className="search-input-icon" />
            <input
              id="smartbuy-search-input"
              type="text"
              className="smartbuy-main-search-input"
              placeholder="e.g. Samsung Galaxy phone, cotton shirt, wireless headphones, running shoes, gaming laptop, office chair"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery('')}
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Suggested Quick Searches */}
          <div className="search-suggestions">
            <span className="suggestions-label">Try searching:</span>
            <div className="suggestions-chips">
              {SEARCH_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  className={`suggestion-chip ${query === ex ? 'active' : ''}`}
                  onClick={() => handleSelectExample(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Filters Grid */}
        <div className="smartbuy-filters-divider">
          <span>Optional Filters</span>
        </div>

        <div className="smartbuy-filter-grid">
          {/* 1. Maximum Budget Filter (Optional) */}
          <div className="filter-group budget-group">
            <label className="smartbuy-label">
              <IndianRupee size={15} />
              <span>Maximum Budget (Optional)</span>
            </label>
            <div className="budget-input-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                min="100"
                step="100"
                placeholder="Any budget"
                className="smartbuy-budget-input"
                value={budget}
                onChange={(e) => setBudget(e.target.value ? Math.max(0, Number(e.target.value)) : '')}
                onKeyDown={handleKeyDown}
              />
              {budget !== '' && (
                <button
                  type="button"
                  className="budget-clear-btn"
                  onClick={() => setBudget('')}
                  title="Remove budget filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="budget-chips">
              {QUICK_BUDGETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`budget-chip ${Number(budget) === amt ? 'selected' : ''}`}
                  onClick={() => setBudget(amt)}
                >
                  ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
              {budget !== '' && (
                <button
                  type="button"
                  className="budget-chip chip-clear"
                  onClick={() => setBudget('')}
                >
                  Any
                </button>
              )}
            </div>
          </div>

          {/* 2. Category Filter (Optional) */}
          <div className="filter-group">
            <label className="smartbuy-label">
              <Tag size={15} />
              <span>Category (Optional)</span>
            </label>
            <select
              className="smartbuy-select"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Preferred Brand Filter (Optional) */}
          <div className="filter-group">
            <label className="smartbuy-label">
              <span>Preferred Brand (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Samsung, Apple, Sony, Puma"
              className="smartbuy-input"
              value={preferredBrand}
              onChange={(e) => setPreferredBrand(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* 4. Focus / Sorting Filter */}
          <div className="filter-group">
            <label className="smartbuy-label">
              <SlidersHorizontal size={15} />
              <span>Focus / Ranking</span>
            </label>
            <select
              className="smartbuy-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="smart">Smart Score (Best Value & Balance)</option>
              <option value="rating">Top Customer Ratings First</option>
              <option value="price_low">Lowest Price First</option>
              <option value="price_high">Highest Price First</option>
            </select>
          </div>
        </div>

        {/* Action Row */}
        <div className="smartbuy-action-row">
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary smartbuy-reset-btn"
              onClick={handleResetFilters}
              disabled={loading}
            >
              <RotateCcw size={16} />
              <span>Clear All</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary btn-lg smartbuy-generate-btn"
            onClick={() => triggerSmartBuySearch()}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="spin-icon" />
                <span>Searching Products...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Find Products</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Error state alert */}
      {errorMessage && (
        <div className="smartbuy-alert error-alert">
          <AlertCircle size={20} />
          <div>
            <h4>Search Notice</h4>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="smartbuy-loading-state">
          <LoadingSpinner />
          <p>
            Searching product catalogue
            {query ? ` for "${query}"` : ''}
            {budget ? ` under ₹${Number(budget).toLocaleString('en-IN')}` : ''}...
          </p>
        </div>
      )}

      {/* Search Results */}
      {!loading && searched && (
        <section className="smartbuy-results-section">
          <div className="results-header">
            <h2>
              {query ? `Results for "${query}"` : 'Recommended Products'}
              {budget ? ` under ₹${Number(budget).toLocaleString('en-IN')}` : ''}
              <span className="results-count">({recommendations.length} found)</span>
            </h2>
            <p className="results-sub">
              Ranked by search relevance, verified customer ratings, and budget value efficiency.
            </p>
          </div>

          {recommendations.length === 0 ? (
            <div className="smartbuy-empty-card">
              <Package size={52} className="empty-icon" />
              {minMatchingProduct ? (
                <>
                  <h3>No products found under ₹{Number(budget).toLocaleString('en-IN')}</h3>
                  <p>
                    We found matching products, but they exceed your spending limit.
                    The lowest priced matching product is{' '}
                    <strong>{minMatchingProduct.name}</strong> at{' '}
                    <strong>₹{minMatchingProduct.price.toLocaleString('en-IN')}</strong>.
                  </p>
                  <div className="empty-card-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setBudget(minMatchingProduct.price);
                        triggerSmartBuySearch({ customBudget: minMatchingProduct.price });
                      }}
                    >
                      Set Budget to ₹{minMatchingProduct.price.toLocaleString('en-IN')} & Show Products
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setBudget('');
                        triggerSmartBuySearch({ customBudget: null });
                      }}
                    >
                      Remove Budget Limit
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>No matching products found</h3>
                  <p>
                    {query
                      ? `We couldn't find any products matching "${query}". Try checking your spelling or using different keywords.`
                      : 'No products match the selected filters. Try broadening your category or budget limit.'}
                  </p>
                  <div className="empty-card-suggestions">
                    <span>Popular searches to try:</span>
                    <div className="empty-suggestions-list">
                      {SEARCH_EXAMPLES.slice(0, 4).map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          className="suggestion-chip"
                          onClick={() => handleSelectExample(ex)}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="empty-card-actions">
                    <button className="btn btn-secondary" onClick={handleResetFilters}>
                      Clear All Filters
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="smartbuy-grid">
              {recommendations.map((prod) => {
                const meta = getProductMeta(prod);
                const isInWish = wishlistProductIds.has(prod.id);
                const isAdding = addingCartId === prod.id;
                const effectiveBudgetNum = budget ? Number(budget) : null;

                return (
                  <div
                    key={prod.id}
                    className="smartbuy-product-card"
                    onClick={() => navigate('product', prod.id)}
                  >
                    {/* Score Ribbon */}
                    <div className="score-ribbon">
                      <span className="score-value">{prod.smartScore}</span>
                      <span className="score-label">SmartScore</span>
                    </div>

                    {/* Wishlist toggle button */}
                    <button
                      type="button"
                      className={`smartbuy-wishlist-btn ${isInWish ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist && onToggleWishlist(prod.id);
                      }}
                      title="Toggle Wishlist"
                    >
                      <Heart
                        size={16}
                        fill={isInWish ? '#ef4444' : 'none'}
                        color={isInWish ? '#ef4444' : '#64748b'}
                      />
                    </button>

                    {/* Product Image */}
                    <div className="smartbuy-card-image">
                      <ProductImage src={meta.image} alt={prod.name} />
                    </div>

                    {/* Card Body */}
                    <div className="smartbuy-card-body">
                      <h3 className="smartbuy-card-title">{prod.name}</h3>

                      <div className="smartbuy-card-meta">
                        {prod.brand && (
                          <span className="card-brand-tag">{prod.brand}</span>
                        )}
                        {prod.categories?.name && (
                          <span className="card-category-tag">{prod.categories.name}</span>
                        )}
                        {prod.rating > 0 ? (
                          <span className="card-rating">★ {Number(prod.rating).toFixed(1)}</span>
                        ) : (
                          <span className="card-rating unrated">Unrated</span>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="smartbuy-card-price-row">
                        <span className="current-price">
                          ₹{Number(prod.price).toLocaleString('en-IN')}
                        </span>
                        {effectiveBudgetNum && effectiveBudgetNum > Number(prod.price) && (
                          <span className="savings-tag">
                            ₹{(effectiveBudgetNum - Number(prod.price)).toLocaleString('en-IN')} below budget
                          </span>
                        )}
                      </div>

                      {/* Explainability Pill / Reasons */}
                      <div className="smartbuy-reasons-box">
                        <div className="reasons-label">Why it matches:</div>
                        <p className="reasons-text">{prod.explanation}</p>
                      </div>

                      {/* Action */}
                      <div className="smartbuy-card-actions">
                        <button
                          type="button"
                          className="btn btn-primary smartbuy-add-btn"
                          onClick={(e) => handleAddToCart(prod, e)}
                          disabled={isAdding}
                        >
                          {isAdding ? 'Adding...' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
