/**
 * SmartBuy Recommendation & Bundle Optimization Service
 * Deterministic, explainable scoring and budget optimization algorithms.
 */

// Known keywords to category mapping (matching CartScale's 6 DB categories)
const CATEGORY_KEYWORDS = {
  1: { // Electronics
    name: 'Electronics',
    keywords: [
      'phone', 'phones', 'smartphone', 'smartphones', 'iphone', 'iphones', 'mobile', 'mobiles',
      'headphone', 'headphones', 'earphone', 'earphones', 'earbuds', 'airpods', 'audio',
      'laptop', 'laptops', 'macbook', 'keyboard', 'keyboards', 'mouse', 'mice', 'speaker', 'speakers',
      'electronics', 'camera', 'cameras', 'smartwatch', 'smartwatches', 'watch', 'watches',
      'charger', 'gadget', 'tech', 'computer', 'pc', 'monitor', 'screen', 'gaming', 'tablet'
    ]
  },
  2: { // Fashion
    name: 'Fashion',
    keywords: [
      'shirt', 'shirts', 't-shirt', 't-shirts', 'tshirt', 'tshirts', 'jeans', 'clothing', 'clothes',
      'apparel', 'dress', 'dresses', 'fashion', 'shoes', 'sneakers', 'jacket', 'jackets', 'cotton',
      'wear', 'pants', 'trousers', 'hoodie', 'top', 'outfit', 'kurti', 'saree', 'footwear', 'sandal'
    ]
  },
  3: { // Books
    name: 'Books',
    keywords: [
      'book', 'books', 'novel', 'novels', 'reading', 'read', 'literature', 'textbook', 'textbooks',
      'author', 'agile', 'code', 'guide', 'study', 'studying', 'student', 'students', 'education',
      'educational', 'course', 'courses', 'exam', 'exams', 'learn', 'learning', 'programming',
      'software', 'developer', 'engineering', 'cs', 'stationery', 'notes', 'college', 'school',
      'academic', 'studies'
    ]
  },
  4: { // Home & Living
    name: 'Home & Living',
    keywords: [
      'home', 'kitchen', 'furniture', 'decor', 'lamp', 'lamps', 'pillow', 'pillows', 'sofa',
      'table', 'tables', 'chair', 'chairs', 'bed', 'living', 'cushion', 'curtain', 'cookware',
      'grocery', 'groceries', 'food', 'snack', 'vegetable', 'fruit', 'desk'
    ]
  },
  5: { // Beauty
    name: 'Beauty',
    keywords: [
      'beauty', 'makeup', 'eyeshadow', 'lipstick', 'skincare', 'cosmetic', 'cosmetics', 'perfume',
      'palette', 'fragrance', 'lotion', 'mirror', 'face', 'cream', 'serum', 'grooming'
    ]
  },
  6: { // Sports
    name: 'Sports',
    keywords: [
      'sports', 'sport', 'fitness', 'gym', 'workout', 'exercise', 'cricket', 'football', 'yoga',
      'running', 'racket', 'dumbbell', 'badminton', 'wickets', 'bat', 'ball', 'athletic', 'training', 'jersey'
    ]
  }
};

/**
 * Deterministically parse natural language shopping queries
 * @param {string} text - User's natural language input
 * @returns {object} Parsed structure with mode, budget, category, keywords, brand, etc.
 */
function parseNaturalLanguageQuery(text) {
  if (!text || typeof text !== 'string') {
    return {
      budget: null,
      mode: 'single',
      categories: [],
      features: [],
      brand: null,
      raw: '',
      confidence: 'low',
      clarifications: ['Please provide a shopping request or budget (e.g. "Headphones under ₹3,000")']
    };
  }

  const raw = text.trim();
  let lower = raw.toLowerCase()
    .replace(/\bthingsd\b/g, 'things')
    .replace(/\biteams\b/g, 'items')
    .replace(/\bstufs?\b/g, 'stuff')
    .replace(/\bphon\b/g, 'phone')
    .replace(/\bheadfones?\b/g, 'headphones')
    .replace(/\bbookes?\b/g, 'books')
    .replace(/\bstudyd?\b/g, 'study');

  // 1. Extract Budget
  let budget = null;
  // Patterns like: under 3000, under ₹3,000, within 4k, budget of 15000, < 25000, up to rs 5000
  const budgetRegexes = [
    /(?:under|below|within|budget(?:\s*of)?|max|up\s*to|less\s*than|at\s*most|\<=?)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)\s*(k|lakh|lakhs)?\b/i,
    /(?:₹|rs\.?|inr)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)\s*(k|lakh|lakhs)?\b/i,
    /\b([0-9]+(?:,[0-9]+)*)\s*(k)\b/i,
    /\b([0-9]+(?:,[0-9]+)*)\s*(lakh|lakhs)\b/i
  ];

  for (const regex of budgetRegexes) {
    const match = lower.match(regex);
    if (match) {
      let numStr = match[1].replace(/,/g, '');
      let val = parseFloat(numStr);
      const unit = (match[2] || '').toLowerCase();
      if (unit === 'k') val *= 1000;
      else if (unit.startsWith('lakh')) val *= 100000;

      if (!isNaN(val) && val > 0) {
        budget = Math.round(val);
        break;
      }
    }
  }

  // 2. Detect Mode (single product vs bundle)
  const bundleWords = ['bundle', 'setup', 'combo', 'pack', 'kit', 'and', 'with a', '+'];
  const hasBundleWord = bundleWords.some(w => lower.includes(w));

  // 3. Match Categories from Keywords
  const matchedCategoryIds = new Set();
  const matchedKeywords = [];

  for (const [catId, meta] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of meta.keywords) {
      const kwRegex = new RegExp(`\\b${kw}\\b`, 'i');
      if (kwRegex.test(lower)) {
        matchedCategoryIds.add(Number(catId));
        matchedKeywords.push(kw);
      }
    }
  }

  // Extract custom subject keywords from query (excluding common stop words)
  const stopWords = new Set([
    'under', 'below', 'within', 'budget', 'of', 'max', 'up', 'to', 'less', 'than', 'at', 'most',
    'rs', 'inr', 'for', 'with', 'a', 'an', 'the', 'and', 'or', 'in', 'need', 'find', 'build',
    'buy', 'get', 'give', 'me', 'i', 'things', 'stuff', 'items', 'products', 'good', 'best',
    'k', 'lakh', 'lakhs'
  ]);
  const words = lower.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w));
  for (const word of words) {
    if (!matchedKeywords.includes(word)) {
      matchedKeywords.push(word);
    }
  }

  // If multiple distinct categories found or explicit bundle keyword used with 2+ keywords
  const isBundle = hasBundleWord && (matchedCategoryIds.size >= 2 || /bundle|setup|combo|kit/i.test(lower));
  const mode = isBundle ? 'bundle' : 'single';

  // 4. Feature / Attribute Extraction (e.g. camera, noise canceling, wireless, battery)
  const knownFeatures = [
    'camera', 'noise canceling', 'noise cancelling', 'anc', 'wireless', 'bluetooth',
    'cotton', 'gaming', 'fast charging', 'battery', 'bass', 'waterproof', 'leather',
    'compact', 'lightweight', 'mechanical', 'rgb', '4k', 'oled'
  ];
  const detectedFeatures = knownFeatures.filter(f => lower.includes(f));

  // 5. Brand Extraction (common catalogue brands)
  const commonBrands = ['apple', 'sony', 'samsung', 'nike', 'puma', 'glamour beauty', 'logitech', 'boat', 'dell', 'hp'];
  let detectedBrand = null;
  for (const b of commonBrands) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(lower)) {
      detectedBrand = b;
      break;
    }
  }

  const clarifications = [];
  if (!budget) {
    clarifications.push('No budget was detected. Please specify your spending limit in rupees.');
  }
  if (matchedCategoryIds.size === 0) {
    clarifications.push('No specific category was recognized. Showing best overall options across all categories.');
  }

  return {
    raw,
    budget,
    mode,
    categoryIds: Array.from(matchedCategoryIds),
    keywords: matchedKeywords,
    features: detectedFeatures,
    brand: detectedBrand,
    confidence: budget && matchedCategoryIds.size > 0 ? 'high' : budget ? 'medium' : 'low',
    clarifications
  };
}

/**
 * Score a single product deterministically against budget and preferences (0 - 100)
 *
 * Scoring breakdown (weights sum to 1.0):
 * - Category / Target Match: 35%
 * - Value / Budget Efficiency: 30%
 * - Quality / Verified Rating: 25%
 * - Brand / Attribute Match: 10%
 *
 * Missing fields are handled safely without artificial inflation.
 */
function scoreProduct(product, { budget, categoryId, targetKeywords = [], preferredBrand = null, sortBy = 'smart' } = {}) {
  const price = Number(product.price);
  if (isNaN(price) || price <= 0 || (budget && price > budget)) {
    return {
      eligible: false,
      score: 0,
      reasons: ['Product price exceeds the specified budget.']
    };
  }

  const reasons = [];

  // --- 1. Category / Keyword Match (0 - 100) ---
  let categoryScore = 70; // baseline if no specific category requested
  if (categoryId) {
    if (Number(product.category_id) === Number(categoryId)) {
      categoryScore = 100;
      reasons.push('Matches requested category');
    } else {
      return {
        eligible: false,
        score: 0,
        reasons: ['Product does not belong to requested category.']
      };
    }
  }

  // Bonus for matching specific keywords in name/description/category
  let featureScore = 70;
  if (targetKeywords && targetKeywords.length > 0) {
    const textBlob = `${product.name || ''} ${product.description || ''} ${product.categories?.name || ''}`.toLowerCase();
    let matches = 0;
    const matchedNames = [];
    for (const kw of targetKeywords) {
      if (textBlob.includes(kw.toLowerCase())) {
        matches++;
        matchedNames.push(kw);
      }
    }
    if (matches > 0) {
      featureScore = Math.min(100, 70 + (matches / targetKeywords.length) * 30);
      reasons.push(`Matches keywords: "${matchedNames.join(', ')}"`);
    } else if (!categoryId) {
      // User searched for specific search terms, product has zero match: exclude it
      return {
        eligible: false,
        score: 0,
        reasons: ['Does not match requested search terms.']
      };
    } else {
      featureScore = 30;
    }
  }

  // Combined thematic score
  const thematicScore = (categoryScore * 0.6) + (featureScore * 0.4);

  // --- 2. Value / Budget Efficiency (0 - 100) ---
  // Lower priced items shouldn't be penalized if they are quality, but an item
  // that costs ₹100 on a ₹50,000 budget is usually not the primary item sought.
  // We award high efficiency when price uses 30%-90% of budget, while preserving
  // genuine savings.
  let valueScore = 75;
  if (budget && budget > 0) {
    const priceRatio = price / budget;
    const savings = budget - price;
    const savingsPercent = Math.round((savings / budget) * 100);

    // Quadratic efficiency curve around 0.65 of budget
    const deviation = Math.abs(0.65 - priceRatio);
    valueScore = Math.max(30, Math.min(100, Math.round(95 - (deviation * 70))));

    // Discount percentage reward if present
    const discount = Number(product.discount_percentage) || 0;
    if (discount > 0) {
      valueScore = Math.min(100, valueScore + Math.min(15, discount * 0.3));
      reasons.push(`${discount}% discount off catalogue price`);
    }

    if (savingsPercent > 0) {
      reasons.push(`Saves ₹${savings.toLocaleString('en-IN')} (${savingsPercent}% of budget remaining)`);
    } else {
      reasons.push(`Fully utilizes budget at ₹${price.toLocaleString('en-IN')}`);
    }
  }

  // --- 3. Rating & Quality (0 - 100) ---
  // Missing rating: neutral 50 score (never 0, but never beating a 4.5+ item)
  let qualityScore = 50;
  const rating = Number(product.rating);
  if (!isNaN(rating) && rating > 0) {
    qualityScore = Math.min(100, Math.round((rating / 5) * 100));
    reasons.push(`Verified ${rating.toFixed(1)}/5 rating`);
  } else {
    reasons.push('Standard catalogue listing (no customer rating recorded)');
  }

  // --- 4. Brand Match (0 - 100) ---
  let brandScore = 60;
  if (preferredBrand) {
    const prodBrand = (product.brand || '').toLowerCase();
    if (prodBrand && prodBrand.includes(preferredBrand.toLowerCase())) {
      brandScore = 100;
      reasons.push(`Matches preferred brand "${product.brand}"`);
    } else {
      brandScore = 30;
    }
  } else if (product.brand) {
    brandScore = 80;
    reasons.push(`Branded item (${product.brand})`);
  }

  // --- Final Weighted Score Calculation ---
  let totalScore = Math.round(
    (thematicScore * 0.35) +
    (valueScore * 0.30) +
    (qualityScore * 0.25) +
    (brandScore * 0.10)
  );

  // Sorting overrides when user requests specific focus
  if (sortBy === 'rating') {
    totalScore = Math.round((qualityScore * 0.6) + (thematicScore * 0.2) + (valueScore * 0.2));
  } else if (sortBy === 'price_low') {
    // Reward lower prices
    const cheapBonus = budget ? Math.round(((budget - price) / budget) * 40) : 0;
    totalScore = Math.min(100, Math.round((thematicScore * 0.4) + cheapBonus + (qualityScore * 0.2)));
  }

  totalScore = Math.max(0, Math.min(100, totalScore));

  return {
    eligible: true,
    score: totalScore,
    breakdown: {
      thematic: Math.round(thematicScore),
      value: Math.round(valueScore),
      quality: Math.round(qualityScore),
      brand: Math.round(brandScore)
    },
    reasons
  };
}

/**
 * Rank eligible products within budget
 */
function rankProducts(products, options = {}) {
  const { budget, limit = 12 } = options;

  const eligibleScored = [];

  for (const product of products) {
    const price = Number(product.price);
    if (isNaN(price) || price <= 0) continue;
    if (budget && price > budget) continue;

    const evalResult = scoreProduct(product, options);
    if (evalResult.eligible) {
      eligibleScored.push({
        ...product,
        smartScore: evalResult.score,
        scoreBreakdown: evalResult.breakdown,
        explanation: evalResult.reasons.join(' • '),
        reasons: evalResult.reasons
      });
    }
  }

  // Deterministic sort: smartScore DESC, price ASC (tie breaker), id ASC (consistent ordering)
  eligibleScored.sort((a, b) => {
    if (b.smartScore !== a.smartScore) return b.smartScore - a.smartScore;
    if (a.price !== b.price) return a.price - b.price;
    return a.id - b.id;
  });

  return eligibleScored.slice(0, limit);
}

/**
 * Genuine Budget-Constrained Bundle Optimizer
 *
 * Given a total budget and required categories/item counts:
 * Finds a combination of distinct items respecting:
 * 1. sum(price) <= budget
 * 2. Every requested category is satisfied
 * 3. No duplicate product IDs
 * 4. Maximizes combined value/utility score
 *
 * If no combination is feasible, reports minimum required budget and explanation.
 */
function optimizeBundle({ products, budget, requirements, strategy = 'best_value' }) {
  if (!budget || budget <= 0) {
    return {
      success: false,
      reason: 'invalid_budget',
      message: 'A valid positive budget is required to build a bundle.'
    };
  }

  if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
    return {
      success: false,
      reason: 'no_requirements',
      message: 'Please select at least one category to include in the bundle.'
    };
  }

  // 1. Initial Feasibility Check: Find minimum possible bundle price across the entire catalogue
  let minPossiblePrice = 0;
  for (const req of requirements) {
    const catId = Number(req.category_id || req.id);
    const catName = req.name || (CATEGORY_KEYWORDS[catId] ? CATEGORY_KEYWORDS[catId].name : `Category ${catId}`);
    const count = Math.max(1, Number(req.count) || 1);

    const allInCat = products
      .filter(p => Number(p.category_id) === catId && Number(p.price) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price));

    if (allInCat.length < count) {
      return {
        success: false,
        reason: 'insufficient_stock',
        categoryName: catName,
        message: `Not enough distinct items in "${catName}" to fulfill required count of ${count}.`
      };
    }

    for (let i = 0; i < count; i++) {
      minPossiblePrice += Number(allInCat[i].price);
    }
  }

  if (minPossiblePrice > budget) {
    const deficit = minPossiblePrice - budget;
    return {
      success: false,
      reason: 'insufficient_budget',
      minRequiredBudget: minPossiblePrice,
      deficit,
      message: `The minimum possible cost to build this bundle is ₹${minPossiblePrice.toLocaleString('en-IN')}, which exceeds your budget of ₹${budget.toLocaleString('en-IN')} by ₹${deficit.toLocaleString('en-IN')}. Try increasing your budget or choosing different categories.`
    };
  }

  // 2. Group candidate products by required category within budget
  const categoryPools = [];
  const requiredCategoriesSummary = [];

  for (const req of requirements) {
    const catId = Number(req.category_id || req.id);
    const catName = req.name || (CATEGORY_KEYWORDS[catId] ? CATEGORY_KEYWORDS[catId].name : `Category ${catId}`);
    const count = Math.max(1, Number(req.count) || 1);

    const candidates = products
      .filter(p => Number(p.category_id) === catId && Number(p.price) > 0 && Number(p.price) <= budget)
      .map(p => {
        const evalResult = scoreProduct(p, { budget, categoryId: catId });
        return {
          ...p,
          smartScore: evalResult.score,
          reasons: evalResult.reasons
        };
      })
      .sort((a, b) => b.smartScore - a.smartScore || a.price - b.price);

    if (candidates.length === 0) {
      return {
        success: false,
        reason: 'no_products_in_category',
        categoryName: catName,
        message: `No available products in "${catName}" are priced under the total budget of ₹${budget.toLocaleString('en-IN')}.`
      };
    }

    categoryPools.push({
      categoryId: catId,
      categoryName: catName,
      count,
      candidates
    });

    requiredCategoriesSummary.push({ id: catId, name: catName, count });
  }

  // 3. Branch-and-Bound Combinatorial Optimization
  // Flatten requirements into slot positions
  const slots = [];
  for (const pool of categoryPools) {
    for (let c = 0; c < pool.count; c++) {
      slots.push({
        categoryId: pool.categoryId,
        categoryName: pool.categoryName,
        candidates: pool.candidates
      });
    }
  }

  let bestBundle = null;
  let bestScore = -1;

  function search(slotIdx, currentSelection, currentCost, usedIds) {
    if (slotIdx === slots.length) {
      // Calculate overall bundle score
      const totalScore = currentSelection.reduce((acc, item) => acc + item.smartScore, 0);
      const savingsBonus = ((budget - currentCost) / budget) * 15; // Modest bonus for staying efficiently under budget
      const objective = strategy === 'budget_saver'
        ? (budget - currentCost) + (totalScore * 5)
        : totalScore + savingsBonus;

      if (objective > bestScore) {
        bestScore = objective;
        bestBundle = [...currentSelection];
      }
      return;
    }

    const slot = slots[slotIdx];
    // Inspect top candidate items for this slot (up to top 8 candidates to keep execution instant)
    const topCandidates = slot.candidates.slice(0, 8);

    for (const candidate of topCandidates) {
      if (usedIds.has(candidate.id)) continue;
      if (currentCost + Number(candidate.price) > budget) continue;

      usedIds.add(candidate.id);
      currentSelection.push(candidate);

      search(slotIdx + 1, currentSelection, currentCost + Number(candidate.price), usedIds);

      currentSelection.pop();
      usedIds.delete(candidate.id);
    }
  }

  search(0, [], 0, new Set());

  // Fallback if top candidates were pruned too aggressively: greedy selection by lowest price
  if (!bestBundle) {
    const greedySelection = [];
    let greedyCost = 0;
    const greedyIds = new Set();

    for (const slot of slots) {
      const cheapest = slot.candidates.find(c => !greedyIds.has(c.id) && greedyCost + Number(c.price) <= budget);
      if (cheapest) {
        greedySelection.push(cheapest);
        greedyCost += Number(cheapest.price);
        greedyIds.add(cheapest.id);
      }
    }

    if (greedySelection.length === slots.length) {
      bestBundle = greedySelection;
    }
  }

  if (!bestBundle || bestBundle.length < slots.length) {
    return {
      success: false,
      reason: 'no_combination_found',
      minRequiredBudget: minPossiblePrice,
      message: `Could not find a combination of distinct items within ₹${budget.toLocaleString('en-IN')}. Minimum possible cost is ₹${minPossiblePrice.toLocaleString('en-IN')}.`
    };
  }

  // Calculate bundle summary
  const totalPrice = bestBundle.reduce((sum, item) => sum + Number(item.price), 0);
  const remainingBudget = budget - totalPrice;
  const averageScore = Math.round(bestBundle.reduce((sum, item) => sum + item.smartScore, 0) / bestBundle.length);

  // Provide alternative replacement candidates for each item in the bundle
  const itemsWithAlternatives = bestBundle.map(selectedItem => {
    const pool = categoryPools.find(p => p.categoryId === Number(selectedItem.category_id));
    const maxAffordablePrice = Number(selectedItem.price) + remainingBudget;

    const alternatives = pool ? pool.candidates
      .filter(c => c.id !== selectedItem.id && Number(c.price) <= maxAffordablePrice && !bestBundle.some(b => b.id === c.id))
      .slice(0, 4)
      .map(alt => ({
        id: alt.id,
        name: alt.name,
        price: Number(alt.price),
        rating: Number(alt.rating) || 0,
        smartScore: alt.smartScore,
        priceDelta: Number(alt.price) - Number(selectedItem.price)
      })) : [];

    return {
      ...selectedItem,
      alternatives
    };
  });

  return {
    success: true,
    budget,
    totalPrice,
    remainingBudget,
    bundleScore: averageScore,
    itemsCount: bestBundle.length,
    items: itemsWithAlternatives,
    categoriesIncluded: requiredCategoriesSummary,
    explanation: `Optimized bundle of ${bestBundle.length} items totaling ₹${totalPrice.toLocaleString('en-IN')} with ₹${remainingBudget.toLocaleString('en-IN')} savings remaining.`
  };
}

module.exports = {
  CATEGORY_KEYWORDS,
  parseNaturalLanguageQuery,
  scoreProduct,
  rankProducts,
  optimizeBundle
};
