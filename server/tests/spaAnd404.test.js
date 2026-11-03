const request = require("supertest");
const app = require("../server");

describe("SPA Fallback and API 404 Routing", () => {
  describe("API 404 Handling (Must return JSON, not HTML)", () => {
    test("GET /products/invalid/subroute returns 404 JSON", async () => {
      const res = await request(app).get("/products/invalid/subroute");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("GET /cart/nonexistent returns 404 JSON", async () => {
      const res = await request(app).get("/cart/nonexistent");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("GET /categories/unknown/subroute returns 404 JSON", async () => {
      const res = await request(app).get("/categories/unknown/subroute");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("GET /orders/unknown/subroute returns 404 JSON", async () => {
      const res = await request(app).get("/orders/unknown/subroute");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("GET /addresses/unknown/subroute returns 404 JSON", async () => {
      const res = await request(app).get("/addresses/unknown/subroute");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("GET /payments/unknown/subroute returns 404 JSON", async () => {
      const res = await request(app).get("/payments/unknown/subroute");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("GET /wishlist/unknown/subroute returns 404 JSON", async () => {
      const res = await request(app).get("/wishlist/unknown/subroute");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("GET /smartbuy/recommend (GET on POST-only route) returns 404 JSON", async () => {
      const res = await request(app).get("/smartbuy/recommend");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("POST /smartbuy/invalid returns 404 JSON", async () => {
      const res = await request(app).post("/smartbuy/invalid").send({});
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("GET /api/nonexistent returns 404 JSON", async () => {
      const res = await request(app).get("/api/nonexistent");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("GET /login with Accept: application/json returns 404 JSON", async () => {
      const res = await request(app)
        .get("/login")
        .set("Accept", "application/json");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toEqual({ error: "Route not found" });
    });

    test("Non-GET methods to arbitrary endpoints return 404 JSON", async () => {
      const resPost = await request(app).post("/random-endpoint").send({});
      expect(resPost.statusCode).toBe(404);
      expect(resPost.headers["content-type"]).toContain("application/json");

      const resDelete = await request(app).delete("/random-endpoint");
      expect(resDelete.statusCode).toBe(404);
      expect(resDelete.headers["content-type"]).toContain("application/json");
    });
  });

  describe("Static Assets Handling", () => {
    test("Existing static assets are served with proper content type", async () => {
      const res = await request(app).get("/favicon.svg");
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("image/svg+xml");
    });

    test("Missing static assets return 404 (NOT index.html)", async () => {
      const res = await request(app).get("/assets/missing-bundle.js");
      expect(res.statusCode).toBe(404);
      expect(res.headers["content-type"]).not.toContain("text/html");
    });
  });

  describe("React SPA Navigation Handling", () => {
    test("Browser navigation to root (GET /) serves HTML", async () => {
      const res = await request(app).get("/").set("Accept", "text/html");
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
    });

    test("Browser navigation to /smartbuy serves HTML", async () => {
      const res = await request(app).get("/smartbuy").set("Accept", "text/html");
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
    });

    test("Browser navigation to /login serves HTML", async () => {
      const res = await request(app).get("/login").set("Accept", "text/html");
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
    });

    test("Browser navigation to /signup serves HTML", async () => {
      const res = await request(app).get("/signup").set("Accept", "text/html");
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
    });

    test("Browser navigation to /checkout serves HTML", async () => {
      const res = await request(app).get("/checkout").set("Accept", "text/html");
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
    });
  });

  describe("Legitimate API Routes Remain Functional", () => {
    test("GET /products works and returns 200 JSON", async () => {
      const res = await request(app).get("/products");
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(Array.isArray(res.body.products || res.body)).toBe(true);
    });

    test("POST /smartbuy/recommend works and returns 200 JSON", async () => {
      const res = await request(app)
        .post("/smartbuy/recommend")
        .send({ query: "shirt" });
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body).toHaveProperty("products");
    });

    test("GET /health works and returns JSON", async () => {
      const res = await request(app).get("/health");
      expect([200, 503]).toContain(res.statusCode);
      expect(res.headers["content-type"]).toContain("application/json");
    });
  });
});
