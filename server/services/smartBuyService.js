/**
 * SmartBuy Recommendation & Search Optimizer Service
 * Deterministic, explainable scoring and product search algorithms.
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
      'wear', 'pants', 'trousers', 'hoodie', 'top', 'outfit', 'kurti', 'saree', 'footwear', 'sandal', 'heels'
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

// Words that indicate an accessory or complementary attachment rather than a primary product
const ACCESSORY_KEYWORDS = [
  'charger', 'cable', 'adapter', 'case', 'cover', 'strap',
  'stand', 'mount', 'holder', 'pouch', 'sleeve', 'protector'
];

// Product type equivalence & synonym groupings
const PRODUCT_TYPE_SYNONYMS = {
  phone: ['phone', 'phones', 'smartphone', 'smartphones', 'mobile', 'mobiles', 'iphone', 'iphones', 'galaxy', 'cellphone'],
  headphone: ['headphone', 'headphones', 'earphone', 'earphones', 'earbuds', 'airpods', 'headset', 'audio'],
  laptop: ['laptop', 'laptops', 'notebook', 'notebooks', 'macbook', 'zenbook', 'chromebook', 'ultrabook'],
  shirt: ['shirt', 'shirts', 'tshirt', 't-shirt', 'tshirts', 't-shirts', 'tee', 'top', 'apparel'],
  shoes: ['shoe', 'shoes', 'footwear', 'sneaker', 'sneakers', 'heel', 'heels', 'boots', 'sandals', 'sandal'],
  chair: ['chair', 'chairs', 'seating', 'armchair', 'seat'],
  mouse: ['mouse', 'mice'],
  keyboard: ['keyboard', 'keyboards'],
  tablet: ['tablet', 'tablets', 'ipad'],
  watch: ['watch', 'watches', 'smartwatch', 'smartwatches'],
  speaker: ['speaker', 'speakers'],
  camera: ['camera', 'cameras'],
  dress: ['dress', 'dresses', 'gown'],
  jacket: ['jacket', 'jackets', 'coat', 'hoodie'],
  jeans: ['jeans', 'pants', 'trousers', 'denim'],
  book: ['book', 'books', 'novel', 'novels', 'textbook'],
  perfume: ['perfume', 'fragrance', 'cologne', 'eau de'],
  lipstick: ['lipstick', 'lip', 'makeup'],
  bed: ['bed', 'sofa', 'couch'],
  table: ['table', 'desk']
};

const KNOWN_BRANDS = [
  'samsung', 'apple', 'sony', 'asus', 'dell', 'beats', 'calvin klein',
  'puma', 'nike', 'adidas', 'chanel', 'dior', 'gucci', 'gigabyte',
  'knoll', 'annibale colombo', 'huawei', 'panasonic', 'lenovo', 'hp'
];

/**
 * Parse and clean user search query, extracting potential budget phrases, brand intents,
 * target product nouns, and accessory checks.
 */
function parseQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return {
      cleanedQuery: '',
      queryBudget: null,
      tokens: [],
      requestedBrand: null,
      requestedNouns: [],
      isAccessoryQuery: false
    };
  }

  let str = rawQuery.trim();
  let queryBudget = null;

  // Extract expressions like "under ₹50,000", "below 25000", "less than 1000"
  const budgetMatch = str.match(/(?:under|below|less\s+than)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
  if (budgetMatch) {
    queryBudget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    str = str.replace(budgetMatch[0], '').trim();
  }

  const lower = str.toLowerCase();
  const isAccessoryQuery = ACCESSORY_KEYWORDS.some(k => new RegExp('\\b' + k + '\\b', 'i').test(lower));

  // Detect brand in query
  let requestedBrand = null;
  for (const b of KNOWN_BRANDS) {
    if (new RegExp('\\b' + b + '\\b', 'i').test(lower)) {
      requestedBrand = b;
      break;
    }
  }

  // Tokenize query words
  const tokens = lower.split(/[\s,]+/).filter(Boolean);

  // Identify core target nouns
  const requestedNouns = [];
  for (const [nounKey, syns] of Object.entries(PRODUCT_TYPE_SYNONYMS)) {
    if (tokens.some(t => syns.includes(t))) {
      requestedNouns.push(nounKey);
    }
  }

  return {
    cleanedQuery: str,
    queryBudget,
    tokens,
    requestedBrand,
    requestedNouns,
    isAccessoryQuery
  };
}

/**
 * Score a single product deterministically against query, budget, and optional preferences (0 - 100)
 */
function scoreProduct(product, {
  budget = null,
  categoryId = null,
  preferredBrand = null,
  query = null,
  parsedQuery = null,
  sortBy = 'smart'
} = {}) {
  const price = Number(product.price);
  if (isNaN(price) || price <= 0) {
    return { eligible: false, score: 0, reasons: ['Invalid product price recorded.'] };
  }

  // 1. Budget Constraint
  const effectiveBudget = budget !== null && budget !== undefined ? Number(budget) : (parsedQuery?.queryBudget || null);
  if (effectiveBudget && price > effectiveBudget) {
    return {
      eligible: false,
      score: 0,
      reasons: [`Exceeds budget limit of ₹${effectiveBudget.toLocaleString('en-IN')}`]
    };
  }

  // 2. Category Filter Constraint
  if (categoryId && Number(product.category_id) !== Number(categoryId)) {
    return {
      eligible: false,
      score: 0,
      reasons: ['Product does not belong to selected category.']
    };
  }

  // 3. Preferred Brand Filter Constraint
  if (preferredBrand) {
    const pBrand = (product.brand || '').toLowerCase();
    if (!pBrand.includes(preferredBrand.toLowerCase())) {
      return {
        eligible: false,
        score: 0,
        reasons: [`Product is not from preferred brand "${preferredBrand}".`]
      };
    }
  }

  const pName = (product.name || '').toLowerCase();
  const pBrand = (product.brand || '').toLowerCase();
  const pDesc = (product.description || '').toLowerCase();
  const pCatName = (product.categories?.name || '').toLowerCase();
  const textBlob = `${pName} ${pBrand} ${pDesc} ${pCatName}`.toLowerCase();

  const reasons = [];
  const parsed = parsedQuery || parseQuery(query);

  // 4. Query Matching & Intent Guardrails
  let queryRelevanceScore = 75; // Baseline when browsing without specific query

  if (parsed.cleanedQuery) {
    // A. Accessory Guardrail: If product is an accessory but user didn't ask for accessories, exclude it
    // (e.g. searching "phone" or "wireless mouse" should never return an "iPhone charger" or "wireless charger")
    const isProductAccessory = ACCESSORY_KEYWORDS.some(k => new RegExp('\\b' + k + '\\b', 'i').test(pName));
    if (isProductAccessory && !parsed.isAccessoryQuery) {
      return {
        eligible: false,
        score: 0,
        reasons: ['Product is an accessory and does not match the requested item.']
      };
    }

    // B. Requested Brand in Query
    if (parsed.requestedBrand) {
      const brandMatches = pBrand.includes(parsed.requestedBrand) || pName.includes(parsed.requestedBrand);
      if (!brandMatches) {
        return {
          eligible: false,
          score: 0,
          reasons: [`Does not match requested brand "${parsed.requestedBrand}".`]
        };
      }
      reasons.push(`Brand match: ${product.brand || parsed.requestedBrand}`);
    }

    // C. Target Product Noun Matching
    // If user specified a distinct target product type (e.g. "phone", "shirt", "shoes", "laptop", "mouse", "chair"):
    // Product MUST match the requested noun or its synonyms.
    if (parsed.requestedNouns.length > 0) {
      let matchedNoun = null;
      for (const noun of parsed.requestedNouns) {
        const syns = PRODUCT_TYPE_SYNONYMS[noun] || [noun];
        if (syns.some(s => new RegExp('\\b' + s + '\\b', 'i').test(textBlob))) {
          matchedNoun = noun;
          break;
        }
      }

      if (!matchedNoun) {
        return {
          eligible: false,
          score: 0,
          reasons: ['Does not match the requested product type.']
        };
      }
      reasons.push(`Matches requested product type: ${matchedNoun}`);
    } else {
      // General keyword matching for non-specific nouns
      let matchedTermsCount = 0;
      for (const term of parsed.tokens) {
        if (textBlob.includes(term)) {
          matchedTermsCount++;
        }
      }

      if (matchedTermsCount === 0) {
        return {
          eligible: false,
          score: 0,
          reasons: ['Does not match search terms.']
        };
      }
    }

    // Calculate fine-grained relevance score (0 - 100)
    let relevance = 60;
    const lowerCleaned = parsed.cleanedQuery.toLowerCase();

    // Exact phrase in name
    if (pName.includes(lowerCleaned)) {
      relevance = 100;
      reasons.unshift(`Direct title match for "${parsed.cleanedQuery}"`);
    } else {
      // Word coverage
      const nameMatches = parsed.tokens.filter(t => pName.includes(t)).length;
      const coverage = parsed.tokens.length > 0 ? nameMatches / parsed.tokens.length : 0;
      relevance = Math.min(95, 65 + Math.round(coverage * 30));
      if (coverage > 0.5) {
        reasons.unshift(`Strong title match for "${parsed.cleanedQuery}"`);
      }
    }

    queryRelevanceScore = relevance;
  }

  // 5. Value / Budget Efficiency (0 - 100)
  let valueScore = 75;
  if (effectiveBudget && effectiveBudget > 0) {
    const priceRatio = price / effectiveBudget;
    const savings = effectiveBudget - price;
    const savingsPercent = Math.round((savings / effectiveBudget) * 100);

    // Quadratic efficiency curve around 0.65 of budget
    const deviation = Math.abs(0.65 - priceRatio);
    valueScore = Math.max(30, Math.min(100, Math.round(95 - (deviation * 70))));

    // Discount percentage reward
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
  } else {
    // If no budget limit was set, reward discounts and great pricing
    const discount = Number(product.discount_percentage) || 0;
    if (discount > 0) {
      valueScore = Math.min(100, 75 + Math.min(25, discount * 0.5));
      reasons.push(`${discount}% discount off catalogue price`);
    }
  }

  // 6. Rating & Quality (0 - 100)
  let qualityScore = 50; // Neutral baseline for unrated
  const rating = Number(product.rating);
  if (!isNaN(rating) && rating > 0) {
    qualityScore = Math.min(100, Math.round((rating / 5) * 100));
    reasons.push(`Verified ${rating.toFixed(1)}/5 rating`);
  } else {
    reasons.push('Standard catalogue listing (no customer rating recorded)');
  }

  // 7. Brand Score (0 - 100)
  let brandScore = 60;
  if (preferredBrand) {
    brandScore = 100;
    reasons.push(`Matches preferred brand "${product.brand}"`);
  } else if (product.brand) {
    brandScore = 80;
    reasons.push(`Branded item (${product.brand})`);
  }

  // 8. Final Weighted Score Calculation
  let totalScore = Math.round(
    (queryRelevanceScore * 0.40) +
    (valueScore * 0.25) +
    (qualityScore * 0.25) +
    (brandScore * 0.10)
  );

  // Sorting overrides when requested
  if (sortBy === 'rating') {
    totalScore = Math.round((qualityScore * 0.55) + (queryRelevanceScore * 0.30) + (valueScore * 0.15));
  } else if (sortBy === 'price_low') {
    const cheapBonus = effectiveBudget ? Math.round(((effectiveBudget - price) / effectiveBudget) * 40) : Math.max(0, 100 - Math.round(price / 100));
    totalScore = Math.min(100, Math.round((queryRelevanceScore * 0.35) + (cheapBonus * 0.45) + (qualityScore * 0.20)));
  } else if (sortBy === 'price_high') {
    totalScore = Math.min(100, Math.round((queryRelevanceScore * 0.35) + (qualityScore * 0.25) + Math.min(40, Math.round(price / 1000))));
  }

  totalScore = Math.max(0, Math.min(100, totalScore));

  return {
    eligible: true,
    score: totalScore,
    breakdown: {
      thematic: Math.round(queryRelevanceScore),
      value: Math.round(valueScore),
      quality: Math.round(qualityScore),
      brand: Math.round(brandScore)
    },
    reasons
  };
}

/**
 * Rank eligible products deterministically
 */
function rankProducts(products, options = {}) {
  const { limit = 20, sortBy = 'smart' } = options;
  const parsedQuery = parseQuery(options.query);
  const optionsWithParsed = { ...options, parsedQuery };

  const eligibleScored = [];

  for (const product of products) {
    const evalResult = scoreProduct(product, optionsWithParsed);
    if (evalResult.eligible) {
      eligibleScored.push({
        ...product,
        smartScore: evalResult.score,
        scoreBreakdown: evalResult.breakdown,
        explanation: evalResult.reasons.slice(0, 3).join(' • '),
        reasons: evalResult.reasons
      });
    }
  }

  // Sorting:
  eligibleScored.sort((a, b) => {
    if (sortBy === 'price_low') {
      if (a.price !== b.price) return a.price - b.price;
      return b.smartScore - a.smartScore;
    }
    if (sortBy === 'price_high') {
      if (b.price !== a.price) return b.price - a.price;
      return b.smartScore - a.smartScore;
    }
    if (sortBy === 'rating') {
      const rA = Number(a.rating) || 0;
      const rB = Number(b.rating) || 0;
      if (rB !== rA) return rB - rA;
      return b.smartScore - a.smartScore;
    }
    // Default: 'smart'
    if (b.smartScore !== a.smartScore) return b.smartScore - a.smartScore;
    if (a.price !== b.price) return a.price - b.price;
    return a.id - b.id;
  });

  return eligibleScored.slice(0, limit);
}

/**
 * Find the lowest priced product matching query/category constraints ignoring budget,
 * to provide intelligent guidance when budget is exceeded.
 */
function findLowestPriceMatch(products, options = {}) {
  const optionsWithoutBudget = { ...options, budget: null };
  const parsed = parseQuery(options.query);
  optionsWithoutBudget.parsedQuery = { ...parsed, queryBudget: null };

  const matches = [];
  for (const product of products) {
    const evalResult = scoreProduct(product, optionsWithoutBudget);
    if (evalResult.eligible) {
      matches.push(product);
    }
  }

  if (matches.length === 0) return null;

  matches.sort((a, b) => Number(a.price) - Number(b.price));
  const cheapest = matches[0];
  return {
    id: cheapest.id,
    name: cheapest.name,
    price: Number(cheapest.price),
    categoryName: cheapest.categories?.name || null
  };
}

module.exports = {
  CATEGORY_KEYWORDS,
  ACCESSORY_KEYWORDS,
  PRODUCT_TYPE_SYNONYMS,
  parseQuery,
  scoreProduct,
  rankProducts,
  findLowestPriceMatch
};
