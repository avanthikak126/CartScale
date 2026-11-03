const supabase = require("../supabase");
const { recommendSchema } = require("../validators/smartBuyValidator");
const {
  rankProducts,
  parseQuery,
  findLowestPriceMatch
} = require("../services/smartBuyService");

/**
 * Handle Single Product / Smart Search Recommendation
 * Public endpoint - works for both guests and authenticated users.
 */
const getRecommendations = async (req, res, next) => {
  const result = recommendSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: result.error.issues[0]?.message || "Invalid input parameters"
    });
  }

  const { query, budget, category_id, preferred_brand, sort_by, limit } = result.data;

  try {
    const parsed = parseQuery(query);
    // Effective budget: explicit budget filter takes precedence, otherwise extracted budget from query
    const effectiveBudget = (budget !== null && budget !== undefined) ? Number(budget) : (parsed.queryBudget || null);

    // Query products from Supabase
    let dbQuery = supabase
      .from("products")
      .select("*, categories(name), inventory(quantity)");

    if (category_id) {
      dbQuery = dbQuery.eq("category_id", category_id);
    }

    if (effectiveBudget) {
      dbQuery = dbQuery.lte("price", effectiveBudget);
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

    // Rank products deterministically using semantic intent & scoring
    const ranked = rankProducts(availableProducts, {
      budget: effectiveBudget,
      categoryId: category_id,
      preferredBrand: preferred_brand,
      query,
      parsedQuery: parsed,
      sortBy: sort_by,
      limit
    });

    // If 0 items found within the budget, check if matching items exist above budget for helpful guidance
    let minMatchingProduct = null;
    if (effectiveBudget && ranked.length === 0) {
      // Query candidate items without budget limit to find lowest priced match
      let unconstrainedQuery = supabase
        .from("products")
        .select("*, categories(name), inventory(quantity)");

      if (category_id) {
        unconstrainedQuery = unconstrainedQuery.eq("category_id", category_id);
      }

      const { data: allCandidates } = await unconstrainedQuery;
      if (allCandidates && allCandidates.length > 0) {
        const availableAll = allCandidates.filter(p => {
          if (p.inventory && typeof p.inventory.quantity === 'number') {
            return p.inventory.quantity > 0;
          }
          return true;
        });

        minMatchingProduct = findLowestPriceMatch(availableAll, {
          categoryId: category_id,
          preferredBrand: preferred_brand,
          query
        });
      }
    }

    res.json({
      query: query || null,
      budget: effectiveBudget || null,
      count: ranked.length,
      products: ranked,
      minMatchingProduct,
      appliedFilters: {
        query: query || null,
        budget: effectiveBudget || null,
        category_id: category_id || null,
        preferred_brand: preferred_brand || null,
        sort_by
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRecommendations
};
