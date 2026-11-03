const supabase = require("../supabase");
const { recommendSchema, bundleSchema, parseSchema } = require("../validators/smartBuyValidator");
const {
  parseNaturalLanguageQuery,
  rankProducts,
  optimizeBundle
} = require("../services/smartBuyService");

/**
 * Handle Single Product Budget Recommendation
 * Public endpoint - works for both guests and authenticated users.
 */
const getRecommendations = async (req, res, next) => {
  const result = recommendSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: result.error.issues[0]?.message || "Invalid input parameters"
    });
  }

  const { budget, category_id, query, preferred_brand, sort_by, limit } = result.data;

  try {
    // If a natural language query was passed, extract keywords
    let extractedKeywords = [];
    let detectedBrand = preferred_brand;
    let resolvedCategoryId = category_id;

    if (query) {
      const parsed = parseNaturalLanguageQuery(query);
      extractedKeywords = [...parsed.keywords, ...parsed.features];
      if (!detectedBrand && parsed.brand) {
        detectedBrand = parsed.brand;
      }
      if (!resolvedCategoryId && parsed.categoryIds.length === 1) {
        resolvedCategoryId = parsed.categoryIds[0];
      }
    }

    // Query real products from Supabase within budget
    let dbQuery = supabase
      .from("products")
      .select("*, categories(name), inventory(quantity)")
      .lte("price", budget);

    if (resolvedCategoryId) {
      dbQuery = dbQuery.eq("category_id", resolvedCategoryId);
    }

    const { data: products, error } = await dbQuery;

    if (error) {
      console.error("Supabase error in SmartBuy recommend:", error);
      return next(error);
    }

    // Filter out confirmed out-of-stock items (quantity === 0)
    const availableProducts = (products || []).filter(p => {
      if (p.inventory && typeof p.inventory.quantity === 'number') {
        return p.inventory.quantity > 0;
      }
      return true;
    });

    // Rank products deterministically
    const ranked = rankProducts(availableProducts, {
      budget,
      categoryId: resolvedCategoryId,
      targetKeywords: extractedKeywords,
      preferredBrand: detectedBrand,
      sortBy: sort_by,
      limit
    });

    // If 0 items found in a specific category, find lowest priced product in that category for guidance
    let minCategoryProduct = null;
    if (resolvedCategoryId && ranked.length === 0) {
      const { data: cheapest } = await supabase
        .from("products")
        .select("name, price, categories(name)")
        .eq("category_id", resolvedCategoryId)
        .order("price", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cheapest) {
        minCategoryProduct = {
          name: cheapest.name,
          price: Number(cheapest.price),
          categoryName: cheapest.categories?.name
        };
      }
    }

    res.json({
      budget,
      count: ranked.length,
      products: ranked,
      minCategoryProduct,
      appliedFilters: {
        budget,
        category_id: resolvedCategoryId,
        query: query || null,
        preferred_brand: detectedBrand || null,
        sort_by,
        extractedKeywords
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle Budget-Constrained Bundle Optimization
 * Public endpoint - authoritative calculations done server-side.
 */
const getBundle = async (req, res, next) => {
  const result = bundleSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: result.error.issues[0]?.message || "Invalid bundle parameters"
    });
  }

  const { budget, categories, strategy } = result.data;

  try {
    const categoryIds = categories.map(c => c.category_id);

    // Fetch candidate products from Supabase
    const { data: products, error } = await supabase
      .from("products")
      .select("*, categories(name), inventory(quantity)")
      .in("category_id", categoryIds)
      .lte("price", budget);

    if (error) {
      console.error("Supabase error in SmartBuy bundle:", error);
      return next(error);
    }

    // Filter out confirmed out-of-stock items
    const availableProducts = (products || []).filter(p => {
      if (p.inventory && typeof p.inventory.quantity === 'number') {
        return p.inventory.quantity > 0;
      }
      return true;
    });

    // Authoritative bundle optimization
    const bundleResult = optimizeBundle({
      products: availableProducts,
      budget,
      requirements: categories,
      strategy
    });

    if (!bundleResult.success) {
      return res.status(200).json(bundleResult);
    }

    res.json(bundleResult);
  } catch (err) {
    next(err);
  }
};

/**
 * Natural Language Query Parser Endpoint
 */
const parseQuery = async (req, res, next) => {
  const result = parseSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: result.error.issues[0]?.message || "Query is required"
    });
  }

  try {
    const parsed = parseNaturalLanguageQuery(result.data.query);
    res.json({ parsed });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRecommendations,
  getBundle,
  parseQuery
};
