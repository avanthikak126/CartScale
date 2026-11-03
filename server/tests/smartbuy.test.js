const request = require("supertest");
const app = require("../server");
const {
  scoreProduct,
  rankProducts,
  parseQuery
} = require("../services/smartBuyService");

describe("SmartBuy Search & Scoring Engine (Unit Tests)", () => {
  const sampleProducts = [
    {
      id: 1,
      name: "Budget Earphones",
      description: "Basic wired earphones with mic",
      price: 499,
      category_id: 1,
      rating: 4.2,
      discount_percentage: 10,
      inventory: { quantity: 15 }
    },
    {
      id: 2,
      name: "Wireless ANC Headphones",
      description: "Premium wireless noise canceling bluetooth headphones with rich bass",
      price: 2999,
      category_id: 1,
      rating: 4.8,
      discount_percentage: 15,
      inventory: { quantity: 20 }
    },
    {
      id: 3,
      name: "Luxury Studio Headphones",
      description: "Audiophile studio headphones",
      price: 7999,
      category_id: 1,
      rating: 4.9,
      discount_percentage: 5,
      inventory: { quantity: 5 }
    },
    {
      id: 4,
      name: "Unrated Casual T-Shirt",
      description: "100% cotton regular fit t-shirt",
      price: 699,
      category_id: 2,
      rating: 0, // missing rating
      discount_percentage: 0,
      inventory: { quantity: 30 }
    },
    {
      id: 5,
      name: "Premium Cotton Shirt",
      description: "Designer slim fit cotton formal shirt",
      price: 1999,
      category_id: 2,
      rating: 4.5,
      discount_percentage: 20,
      brand: "Puma",
      inventory: { quantity: 10 }
    },
    {
      id: 6,
      name: "Headphone Replacement Cable",
      description: "3.5mm audio aux cable adapter",
      price: 299,
      category_id: 1,
      rating: 4.0,
      inventory: { quantity: 50 }
    }
  ];

  test("Products exceeding the budget are strictly excluded when budget is set", () => {
    const budget = 3000;
    const ranked = rankProducts(sampleProducts, { budget });

    // Luxury headphones (7999) must be excluded
    expect(ranked.some(p => p.id === 3)).toBe(false);
    expect(ranked.every(p => p.price <= budget)).toBe(true);
  });

  test("Works without budget or category filter when searching by query", () => {
    const ranked = rankProducts(sampleProducts, { query: "shirt" });

    expect(ranked.length).toBeGreaterThan(0);
    // Should match both t-shirt and cotton shirt
    expect(ranked.every(p => p.category_id === 2)).toBe(true);
  });

  test("Hard category constraints are respected when provided", () => {
    const ranked = rankProducts(sampleProducts, { budget: 5000, categoryId: 2 });
    expect(ranked.every(p => p.category_id === 2)).toBe(true);
    expect(ranked.some(p => p.category_id === 1)).toBe(false);
  });

  test("Missing ratings are handled safely without crashing or artificial boost", () => {
    const unrated = sampleProducts.find(p => p.id === 4);
    const rated = sampleProducts.find(p => p.id === 5);

    const scoreUnrated = scoreProduct(unrated, { budget: 2000, categoryId: 2 });
    const scoreRated = scoreProduct(rated, { budget: 2000, categoryId: 2 });

    expect(scoreUnrated.eligible).toBe(true);
    expect(scoreUnrated.score).toBeGreaterThan(0);
    expect(scoreUnrated.breakdown.quality).toBe(50); // neutral baseline

    // Rated 4.5 product must have higher quality score than unrated
    expect(scoreRated.breakdown.quality).toBeGreaterThan(scoreUnrated.breakdown.quality);
  });

  test("Ranking is deterministic (identical inputs produce identical ranking order and scores)", () => {
    const run1 = rankProducts(sampleProducts, { budget: 3500 });
    const run2 = rankProducts(sampleProducts, { budget: 3500 });

    expect(run1.map(p => p.id)).toEqual(run2.map(p => p.id));
    expect(run1.map(p => p.smartScore)).toEqual(run2.map(p => p.smartScore));
  });

  test("Accessories are not included when searching for primary products", () => {
    // When searching for "headphones", "Headphone Replacement Cable" (accessory) should be excluded
    const ranked = rankProducts(sampleProducts, { query: "headphones" });

    expect(ranked.some(p => p.id === 6)).toBe(false);
    expect(ranked.some(p => p.id === 2)).toBe(true);
  });

  test("parseQuery extracts budget phrases like 'laptop under ₹50,000'", () => {
    const parsed = parseQuery("laptop under ₹50,000");
    expect(parsed.queryBudget).toBe(50000);
    expect(parsed.cleanedQuery).toBe("laptop");
    expect(parsed.requestedNouns).toContain("laptop");
  });

  test("Unrelated products are not returned merely because they share a generic keyword", () => {
    // Searching for "wireless mouse" when no mouse exists should return 0 products,
    // and not match "Wireless ANC Headphones" just because it has "wireless"
    const ranked = rankProducts(sampleProducts, { query: "wireless mouse" });
    expect(ranked.length).toBe(0);
  });
});

describe("SmartBuy API Endpoints (Integration Tests)", () => {
  test("POST /smartbuy/recommend returns ranked products within budget", async () => {
    const res = await request(app)
      .post("/smartbuy/recommend")
      .send({
        budget: 5000,
        category_id: 1
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("products");
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.every(p => p.price <= 5000)).toBe(true);
    if (res.body.products.length > 0) {
      expect(res.body.products[0]).toHaveProperty("smartScore");
      expect(res.body.products[0]).toHaveProperty("explanation");
    }
  });

  test("POST /smartbuy/recommend works with text query without category or budget", async () => {
    const res = await request(app)
      .post("/smartbuy/recommend")
      .send({
        query: "shirt"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("products");
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products.some(p => p.name.toLowerCase().includes("shirt"))).toBe(true);
  });

  test("POST /smartbuy/recommend matches brand queries like Samsung phone", async () => {
    const res = await request(app)
      .post("/smartbuy/recommend")
      .send({
        query: "Samsung phone"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("products");
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
    // All results must be Samsung and not accessories
    expect(res.body.products.every(p => (p.brand || '').toLowerCase().includes("samsung") || p.name.toLowerCase().includes("samsung"))).toBe(true);
  });

  test("POST /smartbuy/recommend returns 0 results for wireless mouse with helpful info", async () => {
    const res = await request(app)
      .post("/smartbuy/recommend")
      .send({
        query: "wireless mouse"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBe(0);
  });

  test("POST /smartbuy/recommend handles laptop under ₹50,000 with minMatchingProduct guidance", async () => {
    const res = await request(app)
      .post("/smartbuy/recommend")
      .send({
        query: "laptop under ₹50,000"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBe(0);
    expect(res.body.minMatchingProduct).not.toBeNull();
    expect(res.body.minMatchingProduct.price).toBeGreaterThan(50000);
    expect(typeof res.body.minMatchingProduct.name).toBe("string");
  });

  test("POST /smartbuy/recommend rejects invalid input (negative budget)", async () => {
    const res = await request(app)
      .post("/smartbuy/recommend")
      .send({
        budget: -500
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
