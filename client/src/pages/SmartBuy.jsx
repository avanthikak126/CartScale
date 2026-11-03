import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Search, ShoppingBag, Package, RefreshCw, Trash2,
  CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Heart,
  SlidersHorizontal, IndianRupee, Layers, Check
} from 'lucide-react';
import * as api from '../api';
import ProductImage from '../components/ProductImage';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProductMeta } from '../data/productMeta';
import './SmartBuy.css';

const QUICK_BUDGETS = [1000, 2500, 5000, 10000, 25000, 50000];

const SAMPLE_PROMPTS = [
  'Headphones under ₹3,000',
  'Phone under ₹25,000 with a good camera',
  'Sports bundle within ₹4,000',
  'Study setup under ₹15,000'
];

export default function SmartBuy({
  token,
  navigate,
  showToast,
  updateCartCount,
  wishlistProductIds = new Set(),
  onToggleWishlist
}) {
  // Navigation / Mode state: 'single' (Find a Product) or 'bundle' (Build a Bundle)
  const [mode, setMode] = useState('single');

  // Input states
  const [budget, setBudget] = useState(5000);
  const [nlQuery, setNlQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [preferredBrand, setPreferredBrand] = useState('');
  const [sortBy, setSortBy] = useState('smart');

  // Bundle requirements: mapping categoryId -> count
  const [bundleRequirements, setBundleRequirements] = useState({
    1: 1, // Electronics: 1
    2: 1  // Fashion: 1
  });
  const [bundleStrategy, setBundleStrategy] = useState('best_value');

  // Parsed natural language metadata
  const [parsedMeta, setParsedMeta] = useState(null);

  // Results state
  const [recommendations, setRecommendations] = useState([]);
  const [minCategoryProduct, setMinCategoryProduct] = useState(null);
  const [bundleResult, setBundleResult] = useState(null);
  const [activeBundleItems, setActiveBundleItems] = useState([]);
  const [activeSwapSlot, setActiveSwapSlot] = useState(null);

  // Status state
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [addingCartId, setAddingCartId] = useState(null);
  const [addingBundle, setAddingBundle] = useState(false);
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

  // Natural Language Parser
  const handleParseQuery = async (queryText) => {
    const textToParse = queryText !== undefined ? queryText : nlQuery;
    if (!textToParse.trim()) return;

    setParsing(true);
    setErrorMessage('');
    try {
      const res = await api.parseSmartBuyQuery(textToParse);
      if (res.data?.parsed) {
        const parsed = res.data.parsed;
        setParsedMeta(parsed);

        // Apply interpreted budget
        if (parsed.budget) {
          setBudget(parsed.budget);
        }

        // Apply interpreted mode
        if (parsed.mode === 'bundle') {
          setMode('bundle');
          if (parsed.categoryIds && parsed.categoryIds.length > 0) {
            const reqs = {};
            parsed.categoryIds.forEach(id => { reqs[id] = 1; });
            setBundleRequirements(reqs);
          }
        } else {
          setMode('single');
          if (parsed.categoryIds && parsed.categoryIds.length === 1) {
            setSelectedCategoryId(String(parsed.categoryIds[0]));
          }
        }

        // Apply brand
        if (parsed.brand) {
          setPreferredBrand(parsed.brand);
        }

        // Auto trigger search with parsed params
        triggerSmartBuySearch({
          customBudget: parsed.budget || budget,
          customMode: parsed.mode,
          customCategoryId: parsed.categoryIds?.length === 1 ? parsed.categoryIds[0] : null,
          customBrand: parsed.brand || preferredBrand,
          customQuery: textToParse,
          customBundleReqs: parsed.categoryIds?.length > 1
            ? Object.fromEntries(parsed.categoryIds.map(id => [id, 1]))
            : bundleRequirements
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not interpret query');
    } finally {
      setParsing(false);
    }
  };

  // Main search generator
  const triggerSmartBuySearch = useCallback(async (overrides = {}) => {
    const targetBudget = overrides.customBudget !== undefined ? overrides.customBudget : Number(budget);
    const targetMode = overrides.customMode || mode;
    const targetCatId = overrides.customCategoryId !== undefined ? overrides.customCategoryId : selectedCategoryId;
    const targetBrand = overrides.customBrand !== undefined ? overrides.customBrand : preferredBrand;
    const targetQuery = overrides.customQuery !== undefined ? overrides.customQuery : nlQuery;
    const targetBundleReqs = overrides.customBundleReqs || bundleRequirements;

    if (!targetBudget || targetBudget <= 0) {
      showToast('Please enter a valid budget in ₹', 'error');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSearched(true);
    setActiveSwapSlot(null);

    try {
      if (targetMode === 'single') {
        const payload = {
          budget: targetBudget,
          category_id: targetCatId ? Number(targetCatId) : null,
          query: targetQuery || null,
          preferred_brand: targetBrand || null,
          sort_by: sortBy,
          limit: 12
        };

        const res = await api.getSmartBuyRecommendations(payload);
        if (res.error) {
          setErrorMessage(res.error);
          setRecommendations([]);
          setMinCategoryProduct(null);
        } else {
          setRecommendations(res.data?.products || []);
          setMinCategoryProduct(res.data?.minCategoryProduct || null);
          if (res.data?.products?.length === 0) {
            showToast(`No products found within ₹${targetBudget.toLocaleString('en-IN')}`, 'info');
          }
        }
      } else {
        // Bundle mode
        const formattedCats = Object.entries(targetBundleReqs)
          .filter(([, count]) => count > 0)
          .map(([catId, count]) => {
            const found = categories.find(c => Number(c.id) === Number(catId));
            return {
              category_id: Number(catId),
              name: found ? found.name : `Category ${catId}`,
              count: Number(count)
            };
          });

        if (formattedCats.length === 0) {
          showToast('Please select at least 1 category for your bundle', 'error');
          setLoading(false);
          return;
        }

        const payload = {
          budget: targetBudget,
          categories: formattedCats,
          strategy: bundleStrategy
        };

        const res = await api.getSmartBuyBundle(payload);
        if (res.error) {
          setErrorMessage(res.error);
          setBundleResult(null);
          setActiveBundleItems([]);
        } else {
          setBundleResult(res.data);
          if (res.data?.success) {
            setActiveBundleItems(res.data.items || []);
          } else {
            setActiveBundleItems([]);
          }
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fetch SmartBuy recommendations');
    } finally {
      setLoading(false);
    }
  }, [budget, mode, selectedCategoryId, preferredBrand, nlQuery, sortBy, bundleRequirements, bundleStrategy, categories, showToast]);

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

  // Handle Add Entire Bundle To Cart
  const handleAddEntireBundle = async () => {
    if (!token) {
      showToast('Please login to add bundle to your cart', 'error');
      navigate('login');
      return;
    }

    if (!activeBundleItems || activeBundleItems.length === 0) return;

    setAddingBundle(true);
    let successCount = 0;
    try {
      for (const item of activeBundleItems) {
        const res = await api.addToCart(item.id, 1);
        if (!res.error) {
          successCount++;
        }
      }

      if (successCount === activeBundleItems.length) {
        showToast(`All ${successCount} bundle items added to your cart!`, 'success');
      } else if (successCount > 0) {
        showToast(`Added ${successCount} of ${activeBundleItems.length} items to cart.`, 'info');
      } else {
        showToast('Could not add bundle items to cart.', 'error');
      }

      if (updateCartCount) updateCartCount();
    } catch (err) {
      showToast(err.message || 'Failed to add bundle to cart', 'error');
    } finally {
      setAddingBundle(false);
    }
  };

  // Bundle item interactive swap
  const handleSwapItem = (targetIndex, replacement) => {
    setActiveBundleItems(prev => {
      const next = [...prev];
      // Keep alternatives list from previous slot if any
      const oldAlternatives = next[targetIndex].alternatives || [];
      const updatedAlternatives = oldAlternatives
        .filter(alt => alt.id !== replacement.id)
        .concat({
          id: next[targetIndex].id,
          name: next[targetIndex].name,
          price: Number(next[targetIndex].price),
          rating: Number(next[targetIndex].rating) || 0,
          smartScore: next[targetIndex].smartScore,
          priceDelta: Number(next[targetIndex].price) - Number(replacement.price)
        });

      next[targetIndex] = {
        ...replacement,
        alternatives: updatedAlternatives
      };
      return next;
    });

    setActiveSwapSlot(null);
    showToast(`Swapped with ${replacement.name}`, 'info');
  };

  // Bundle item remove
  const handleRemoveBundleItem = (index) => {
    setActiveBundleItems(prev => prev.filter((_, idx) => idx !== index));
    setActiveSwapSlot(null);
    showToast('Removed item from bundle', 'info');
  };

  // Toggle category count for bundle requirements
  const toggleBundleCategory = (catId) => {
    setBundleRequirements(prev => {
      const current = prev[catId] || 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[catId];
        return next;
      } else {
        return { ...prev, [catId]: 1 };
      }
    });
  };

  // Current live bundle metrics
  const liveBundleTotal = activeBundleItems.reduce((sum, item) => sum + Number(item.price), 0);
  const liveBundleRemaining = Math.max(0, budget - liveBundleTotal);
  const liveBudgetPercent = Math.min(100, Math.round((liveBundleTotal / (budget || 1)) * 100));

  return (
    <div className="smartbuy-container">
      {/* Header Banner */}
      <header className="smartbuy-header">
        <div className="smartbuy-header-badge">
          <Sparkles size={16} />
          <span>CartScale SmartBuy • Shopping Optimizer</span>
        </div>
        <h1 className="smartbuy-title">Shop Smarter Within Your Budget</h1>
        <p className="smartbuy-subtitle">
          Specify your budget in rupees and discover the best value products or build an optimized,
          guaranteed within-budget shopping bundle.
        </p>
      </header>

      {/* Main Control Card */}
      <section className="smartbuy-control-panel">
        {/* Natural Language Query Bar */}
        <div className="smartbuy-nl-section">
          <label className="smartbuy-label">
            <Sparkles size={16} className="sparkle-icon" />
            Natural-Language Assistant
          </label>
          <div className="smartbuy-nl-input-wrapper">
            <Search size={18} className="smartbuy-search-icon" />
            <input
              type="text"
              className="smartbuy-nl-input"
              placeholder='e.g. "I need headphones under ₹3,000" or "Build a sports bundle within ₹4,000"'
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleParseQuery();
              }}
            />
            <button
              className="btn btn-primary smartbuy-parse-btn"
              onClick={() => handleParseQuery()}
              disabled={parsing || !nlQuery.trim()}
            >
              {parsing ? 'Parsing...' : 'Interpret & Search'}
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="smartbuy-prompt-chips">
            <span className="chips-label">Try asking:</span>
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="chip-prompt-btn"
                onClick={() => {
                  setNlQuery(prompt);
                  handleParseQuery(prompt);
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Interpreted Feedback Box */}
          {parsedMeta && (
            <div className="smartbuy-parsed-feedback">
              <div className="feedback-header">
                <CheckCircle2 size={16} className="text-success" />
                <span>Understood Request:</span>
                <span className="badge-mode">{parsedMeta.mode === 'bundle' ? 'Bundle Mode' : 'Single Product Mode'}</span>
                {parsedMeta.budget && <span className="badge-budget">Budget: ₹{parsedMeta.budget.toLocaleString('en-IN')}</span>}
              </div>
              <div className="feedback-details">
                {parsedMeta.features?.length > 0 && (
                  <span>Features: <strong>{parsedMeta.features.join(', ')}</strong> • </span>
                )}
                {parsedMeta.brand && (
                  <span>Brand: <strong>{parsedMeta.brand}</strong> • </span>
                )}
                {parsedMeta.clarifications?.map((c, i) => (
                  <span key={i} className="text-muted">{c} </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div className="smartbuy-tabs-row">
          <div className="smartbuy-tabs">
            <button
              className={`smartbuy-tab ${mode === 'single' ? 'active' : ''}`}
              onClick={() => { setMode('single'); setSearched(false); }}
              type="button"
            >
              <ShoppingBag size={18} />
              <span>Find a Product</span>
            </button>
            <button
              className={`smartbuy-tab ${mode === 'bundle' ? 'active' : ''}`}
              onClick={() => { setMode('bundle'); setSearched(false); }}
              type="button"
            >
              <Layers size={18} />
              <span>Build a Bundle</span>
            </button>
          </div>
        </div>

        {/* Budget Input & Chips */}
        <div className="smartbuy-filter-grid">
          <div className="filter-group budget-group">
            <label className="smartbuy-label">
              <IndianRupee size={16} />
              Your Spending Budget
            </label>
            <div className="budget-input-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                min="100"
                step="100"
                className="smartbuy-budget-input"
                value={budget}
                onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="budget-chips">
              {QUICK_BUDGETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`budget-chip ${budget === amt ? 'selected' : ''}`}
                  onClick={() => setBudget(amt)}
                >
                  ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Mode 1 Controls: Single Product Guided Filters */}
          {mode === 'single' ? (
            <>
              <div className="filter-group">
                <label className="smartbuy-label">Category</label>
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

              <div className="filter-group">
                <label className="smartbuy-label">Brand Preference</label>
                <input
                  type="text"
                  placeholder="e.g. Sony, Apple, Puma"
                  className="smartbuy-input"
                  value={preferredBrand}
                  onChange={(e) => setPreferredBrand(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="smartbuy-label">Focus / Ranking</label>
                <select
                  className="smartbuy-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="smart">Smart Score (Best Value & Balance)</option>
                  <option value="rating">Top Customer Ratings First</option>
                  <option value="price_low">Lowest Price First</option>
                </select>
              </div>
            </>
          ) : (
            /* Mode 2 Controls: Bundle Category Multi-Select */
            <>
              <div className="filter-group bundle-categories-group">
                <label className="smartbuy-label">Select Bundle Categories</label>
                <div className="bundle-categories-picker">
                  {categories.map((cat) => {
                    const count = bundleRequirements[cat.id] || 0;
                    const isSelected = count > 0;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`bundle-cat-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleBundleCategory(cat.id)}
                      >
                        {isSelected && <Check size={14} />}
                        <span>{cat.name}</span>
                        {isSelected && <span className="cat-count">x{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="filter-group">
                <label className="smartbuy-label">Bundle Strategy</label>
                <select
                  className="smartbuy-select"
                  value={bundleStrategy}
                  onChange={(e) => setBundleStrategy(e.target.value)}
                >
                  <option value="best_value">Best Value (Balanced Quality & Savings)</option>
                  <option value="budget_saver">Budget Saver (Maximize Total Savings)</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Generate Recommendations Action Button */}
        <div className="smartbuy-action-row">
          <button
            className="btn btn-primary btn-lg smartbuy-generate-btn"
            onClick={() => triggerSmartBuySearch()}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="spin-icon" />
                <span>Optimizing Catalogue...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>{mode === 'single' ? 'Find Best Recommendations' : 'Optimize My Bundle'}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Error state */}
      {errorMessage && (
        <div className="smartbuy-alert error-alert">
          <AlertCircle size={20} />
          <div>
            <h4>Optimizer Notice</h4>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="smartbuy-loading-state">
          <LoadingSpinner />
          <p>Analyzing products, prices and stock within ₹{budget.toLocaleString('en-IN')}...</p>
        </div>
      )}

      {/* Results View - Mode 1: Single Product Recommendations */}
      {!loading && mode === 'single' && searched && (
        <section className="smartbuy-results-section">
          <div className="results-header">
            <h2>
              Recommended Products Under ₹{budget.toLocaleString('en-IN')}
              <span className="results-count">({recommendations.length} found)</span>
            </h2>
            <p className="results-sub">
              Deterministic ranking based on value efficiency, verified ratings, and feature relevance.
            </p>
          </div>

          {recommendations.length === 0 ? (
            <div className="smartbuy-empty-card">
              <Package size={48} className="empty-icon" />
              {minCategoryProduct ? (
                <>
                  <h3>No {minCategoryProduct.categoryName || 'items'} found under ₹{budget.toLocaleString('en-IN')}</h3>
                  <p>
                    The lowest priced product in {minCategoryProduct.categoryName || 'this category'} is{' '}
                    <strong>{minCategoryProduct.name}</strong> at <strong>₹{minCategoryProduct.price.toLocaleString('en-IN')}</strong>.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setBudget(minCategoryProduct.price);
                        triggerSmartBuySearch({ customBudget: minCategoryProduct.price });
                      }}
                    >
                      Set Budget to ₹{minCategoryProduct.price.toLocaleString('en-IN')} & Show Products
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedCategoryId('');
                        triggerSmartBuySearch({ customCategoryId: null });
                      }}
                    >
                      Explore All Categories
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>No products found within this budget</h3>
                  <p>Try increasing your spending limit or selecting a different category.</p>
                  <button className="btn btn-secondary" onClick={() => setBudget(prev => prev + 2500)}>
                    Increase Budget by ₹2,500
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="smartbuy-grid">
              {recommendations.map((prod) => {
                const meta = getProductMeta(prod);
                const isInWish = wishlistProductIds.has(prod.id);
                const isAdding = addingCartId === prod.id;

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

                    {/* Wishlist toggle */}
                    <button
                      type="button"
                      className={`smartbuy-wishlist-btn ${isInWish ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist && onToggleWishlist(prod.id);
                      }}
                      title="Toggle Wishlist"
                    >
                      <Heart size={16} fill={isInWish ? '#ef4444' : 'none'} color={isInWish ? '#ef4444' : '#64748b'} />
                    </button>

                    {/* Image */}
                    <div className="smartbuy-card-image">
                      <ProductImage src={meta.image} alt={prod.name} />
                    </div>

                    <div className="smartbuy-card-body">
                      <h3 className="smartbuy-card-title">{prod.name}</h3>

                      <div className="smartbuy-card-meta">
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
                        <span className="current-price">₹{Number(prod.price).toLocaleString('en-IN')}</span>
                        {budget && (
                          <span className="savings-tag">
                            ₹{(budget - Number(prod.price)).toLocaleString('en-IN')} below budget
                          </span>
                        )}
                      </div>

                      {/* Explainability Pill / Reasons */}
                      <div className="smartbuy-reasons-box">
                        <div className="reasons-label">Why it was selected:</div>
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

      {/* Results View - Mode 2: Bundle Optimization */}
      {!loading && mode === 'bundle' && searched && (
        <section className="smartbuy-bundle-section">
          {bundleResult && !bundleResult.success ? (
            <div className="smartbuy-bundle-infeasible">
              <AlertCircle size={44} className="infeasible-icon" />
              <h3>Budget Adjustment Needed</h3>
              <p className="infeasible-msg">{bundleResult.message}</p>
              {bundleResult.minRequiredBudget && (
                <div className="infeasible-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setBudget(bundleResult.minRequiredBudget);
                      triggerSmartBuySearch({ customBudget: bundleResult.minRequiredBudget });
                    }}
                  >
                    Set Budget to ₹{bundleResult.minRequiredBudget.toLocaleString('en-IN')} & Re-optimize
                  </button>
                </div>
              )}
            </div>
          ) : activeBundleItems.length > 0 ? (
            <div className="smartbuy-bundle-results">
              {/* Bundle Summary Dashboard */}
              <div className="bundle-summary-dashboard">
                <div className="bundle-metric-card">
                  <span className="metric-label">Total Bundle Spend</span>
                  <span className="metric-value price-metric">₹{liveBundleTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="bundle-metric-card">
                  <span className="metric-label">Remaining Savings</span>
                  <span className="metric-value savings-metric">₹{liveBundleRemaining.toLocaleString('en-IN')}</span>
                </div>
                <div className="bundle-metric-card">
                  <span className="metric-label">Bundle Value Score</span>
                  <span className="metric-value score-metric">
                    {Math.round(activeBundleItems.reduce((acc, i) => acc + (i.smartScore || 80), 0) / activeBundleItems.length)}/100
                  </span>
                </div>
                <div className="bundle-dashboard-action">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg add-all-bundle-btn"
                    onClick={handleAddEntireBundle}
                    disabled={addingBundle}
                  >
                    {addingBundle ? 'Adding Bundle...' : `Add All ${activeBundleItems.length} Items to Cart`}
                  </button>
                </div>
              </div>

              {/* Budget Utilization Progress Bar */}
              <div className="bundle-progress-container">
                <div className="progress-labels">
                  <span>Budget Utilization: {liveBudgetPercent}%</span>
                  <span>₹{liveBundleTotal.toLocaleString('en-IN')} of ₹{budget.toLocaleString('en-IN')}</span>
                </div>
                <div className="bundle-progress-bar">
                  <div
                    className="bundle-progress-fill"
                    style={{ width: `${liveBudgetPercent}%` }}
                  />
                </div>
              </div>

              {/* Bundle Items List */}
              <div className="bundle-items-list">
                <h3>Optimized Items in Your Bundle</h3>
                {activeBundleItems.map((item, index) => {
                  const meta = getProductMeta(item);
                  const isSwapping = activeSwapSlot === index;

                  return (
                    <div key={item.id} className="bundle-item-card">
                      <div className="bundle-item-img" onClick={() => navigate('product', item.id)}>
                        <ProductImage src={meta.image} alt={item.name} />
                      </div>

                      <div className="bundle-item-details">
                        <div className="bundle-item-header">
                          <span className="bundle-slot-category">{item.categories?.name || 'Selected Item'}</span>
                          <span className="bundle-slot-score">Score: {item.smartScore}/100</span>
                        </div>
                        <h4 className="bundle-item-title" onClick={() => navigate('product', item.id)}>
                          {item.name}
                        </h4>
                        <div className="bundle-item-price-row">
                          <span className="bundle-item-price">₹{Number(item.price).toLocaleString('en-IN')}</span>
                          {item.rating > 0 && <span className="bundle-item-rating">★ {Number(item.rating).toFixed(1)}</span>}
                        </div>
                        {item.reasons && item.reasons.length > 0 && (
                          <div className="bundle-item-reason">
                            <ShieldCheck size={14} className="reason-icon" />
                            <span>{item.reasons.slice(0, 2).join(' • ')}</span>
                          </div>
                        )}
                      </div>

                      <div className="bundle-item-controls">
                        {item.alternatives && item.alternatives.length > 0 && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm swap-btn"
                            onClick={() => setActiveSwapSlot(isSwapping ? null : index)}
                          >
                            <RefreshCw size={14} />
                            <span>{isSwapping ? 'Close' : 'Swap Item'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-icon remove-btn"
                          onClick={() => handleRemoveBundleItem(index)}
                          title="Remove item from bundle"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Inline Swap Dropdown */}
                      {isSwapping && item.alternatives && (
                        <div className="bundle-swap-dropdown">
                          <div className="swap-dropdown-title">
                            Eligible alternatives within remaining budget:
                          </div>
                          <div className="swap-options-list">
                            {item.alternatives.map((alt) => (
                              <div
                                key={alt.id}
                                className="swap-option-row"
                                onClick={() => handleSwapItem(index, alt)}
                              >
                                <span className="option-name">{alt.name}</span>
                                <span className="option-price">₹{alt.price.toLocaleString('en-IN')}</span>
                                <span className={`option-delta ${alt.priceDelta >= 0 ? 'plus' : 'minus'}`}>
                                  {alt.priceDelta >= 0 ? `+₹${alt.priceDelta}` : `-₹${Math.abs(alt.priceDelta)}`}
                                </span>
                                <button className="btn btn-secondary btn-sm select-alt-btn">Select</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="smartbuy-empty-card">
              <Package size={48} className="empty-icon" />
              <h3>No bundle results yet</h3>
              <p>Configure your categories and spending limit above to generate an optimized bundle.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
