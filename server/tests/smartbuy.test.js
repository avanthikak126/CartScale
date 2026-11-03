const request = require("supertest");
const app = require("../server");
const {
  scoreProduct,
  rankProducts,
  optimizeBundle,
  parseNaturalLanguageQuery
} = require("../services/smartBuyService");

describe("SmartBuy Scoring & Ranking Engine (Unit Tests)", () => {
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
    }
  ];

  test("Products exceeding the budget are strictly excluded", () => {
    const budget = 3000;
    const ranked = rankProducts(sampleProducts, { budget });

    // Luxury headphones (7999) must be excluded
    expect(ranked.some(p => p.id === 3)).toBe(false);
    expect(ranked.every(p => p.price <= budget)).toBe(true);
  });

  test("Hard category constraints are respected", () => {
    const ranked = rankProducts(sampleProducts, { budget: 5000, categoryId: 2 });
    // All returned products should belong to category 2
    expect(ranked.every(p => p.category_id === 2)).toBe(true);
    expect(ranked.some(p => p.category_id === 1)).toBe(false);
  });

  test("Missing ratings or specifications are handled safely without crashing or artificial boost", () => {
    const unrated = sampleProducts.find(p => p.id === 4);
    const rated = sampleProducts.find(p => p.id === 5);

    const scoreUnrated = scoreProduct(unrated, { budget: 2000, categoryId: 2 });
    const scoreRated = scoreProduct(rated, { budget: 2000, categoryId: 2 });

    expect(scoreUnrated.eligible).toBe(true);
    expect(scoreUnrated.score).toBeGreaterThan(0);
    expect(scoreUnrated.breakdown.quality).toBe(50); // neutral baseline

    // Rated 4.5 product must have higher quality score than unrated (50 vs 90)
    expect(scoreRated.breakdown.quality).toBeGreaterThan(scoreUnrated.breakdown.quality);
  });

  test("Ranking is deterministic (identical inputs produce identical ranking order and scores)", () => {
    const run1 = rankProducts(sampleProducts, { budget: 3500 });
    const run2 = rankProducts(sampleProducts, { budget: 3500 });

    expect(run1.map(p => p.id)).toEqual(run2.map(p => p.id));
    expect(run1.map(p => p.smartScore)).toEqual(run2.map(p => p.smartScore));
  });

  test("Suitable lower-priced products with great value can outrank more expensive products", () => {
    // When searching for wireless noise canceling headphones within 5000 budget:
    // Product 2 (2999, rating 4.8, feature match) vs hypothetical high-priced mediocre product
    const overpricedMediocre = {
      id: 99,
      name: "Generic Headphones",
      description: "Standard headphones",
      price: 4900, // consumes almost all budget
      category_id: 1,
      rating: 2.5,
      inventory: { quantity: 10 }
    };

    const candidates = [sampleProducts[1], overpricedMediocre];
    const ranked = rankProducts(candidates, {
      budget: 5000,
      targetKeywords: ["noise canceling", "wireless"]
    });

    // Product 2 (₹2999, 4.8★, ANC) must outrank product 99 (₹4900, 2.5★)
    expect(ranked[0].id).toBe(2);
    expect(ranked[0].smartScore).toBeGreaterThan(ranked[1].smartScore);
  });
});

describe("SmartBuy Bundle Optimizer (Unit Tests)", () => {
  const catalogue = [
    // Category 1: Electronics
    { id: 101, name: "Smart Phone A", price: 12000, category_id: 1, rating: 4.3 },
    { id: 102, name: "Smart Phone B", price: 18000, category_id: 1, rating: 4.7 },
    { id: 103, name: "Budget Phone C", price: 8000, category_id: 1, rating: 3.9 },

    // Category 2: Fashion
    { id: 201, name: "Cotton Jacket", price: 2500, category_id: 2, rating: 4.2 },
    { id: 202, name: "Denim Jeans", price: 1500, category_id: 2, rating: 4.4 },
    { id: 203, name: "Casual T-Shirt", price: 500, category_id: 2, rating: 4.0 },

    // Category 6: Sports
    { id: 601, name: "Fitness Tracker", price: 2000, category_id: 6, rating: 4.5 },
    { id: 602, name: "Gym Bag", price: 1200, category_id: 6, rating: 4.1 },
    { id: 603, name: "Yoga Mat", price: 800, category_id: 6, rating: 4.6 }
  ];

  test("Bundles never exceed the budget", () => {
    const budget = 15000;
    const requirements = [
      { category_id: 1, name: "Electronics", count: 1 },
      { category_id: 2, name: "Fashion", count: 1 }
    ];

    const result = optimizeBundle({ products: catalogue, budget, requirements });

    expect(result.success).toBe(true);
    expect(result.totalPrice).toBeLessThanOrEqual(budget);
    expect(result.remainingBudget).toBeGreaterThanOrEqual(0);
    expect(result.totalPrice + result.remainingBudget).toBe(budget);
  });

  test("Required categories are satisfied when a feasible bundle exists", () => {
    const budget = 25000;
    const requirements = [
      { category_id: 1, name: "Electronics", count: 1 },
      { category_id: 2, name: "Fashion", count: 1 },
      { category_id: 6, name: "Sports", count: 1 }
    ];

    const result = optimizeBundle({ products: catalogue, budget, requirements });

    expect(result.success).toBe(true);
    expect(result.items.length).toBe(3);

    const categoriesInResult = result.items.map(i => Number(i.category_id));
    expect(categoriesInResult).toContain(1);
    expect(categoriesInResult).toContain(2);
    expect(categoriesInResult).toContain(6);
  });

  test("Impossible bundles return a useful explanation with minimum required budget", () => {
    // Cheapest Phone is 8000, cheapest Fashion is 500 -> total min = 8500
    // If budget is 5000, bundle is strictly impossible
    const budget = 5000;
    const requirements = [
      { category_id: 1, name: "Electronics", count: 1 },
      { category_id: 2, name: "Fashion", count: 1 }
    ];

    const result = optimizeBundle({ products: catalogue, budget, requirements });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("insufficient_budget");
    expect(result.minRequiredBudget).toBe(8500);
    expect(result.deficit).toBe(3500);
    expect(result.message).toContain("minimum possible cost");
  });

  test("Duplicate items are prevented within the bundle", () => {
    const budget = 20000;
    // Request 2 items from Electronics
    const requirements = [
      { category_id: 1, name: "Electronics", count: 2 }
    ];

    const result = optimizeBundle({ products: catalogue, budget, requirements });

    expect(result.success).toBe(true);
    expect(result.items.length).toBe(2);
    // Must be two distinct items
    expect(result.items[0].id).not.toBe(result.items[1].id);
  });
});

describe("Natural Language Query Parser (Unit Tests)", () => {
  test("Extracts budget and categories from natural queries", () => {
    const q1 = parseNaturalLanguageQuery("I need headphones under ₹3,000");
    expect(q1.budget).toBe(3000);
    expect(q1.mode).toBe("single");
    expect(q1.categoryIds).toContain(1); // Electronics

    const q2 = parseNaturalLanguageQuery("Find a phone under 25k with a good camera");
    expect(q2.budget).toBe(25000);
    expect(q2.features).toContain("camera");
    expect(q2.categoryIds).toContain(1);

    const q3 = parseNaturalLanguageQuery("Build a sports bundle within ₹4,000");
    expect(q3.budget).toBe(4000);
    expect(q3.mode).toBe("bundle");
    expect(q3.categoryIds).toContain(6); // Sports

    const q4 = parseNaturalLanguageQuery("study thingsd under 2000");
    expect(q4.budget).toBe(2000);
    expect(q4.categoryIds).toContain(3); // Books
    expect(q4.confidence).toBe("high");
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

  test("POST /smartbuy/recommend rejects invalid input (negative budget)", async () => {
    const res = await request(app)
      .post("/smartbuy/recommend")
      .send({
        budget: -500
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("POST /smartbuy/bundle returns optimized bundle or helpful feasibility response", async () => {
    const res = await request(app)
      .post("/smartbuy/bundle")
      .send({
        budget: 10000,
        categories: [
          { category_id: 2, count: 1 },
          { category_id: 3, count: 1 }
        ]
      });

    expect(res.statusCode).toBe(200);
    if (res.body.success) {
      expect(res.body.totalPrice).toBeLessThanOrEqual(10000);
      expect(res.body.items.length).toBe(2);
      expect(res.body).toHaveProperty("remainingBudget");
    } else {
      expect(res.body).toHaveProperty("message");
    }
  });

  test("POST /smartbuy/parse returns structured interpretations", async () => {
    const res = await request(app)
      .post("/smartbuy/parse")
      .send({
        query: "Headphones under ₹2,500"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.parsed).toHaveProperty("budget", 2500);
    expect(res.body.parsed.categoryIds).toContain(1);
  });
});
