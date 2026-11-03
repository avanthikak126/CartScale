const request = require("supertest");
const app = require("../server");

describe("GET /products", () => {
    test("should return products", async () => {
        const response = await request(app)
            .get("/products");

        expect(response.statusCode).toBe(200);
        const list = response.body.products || response.body;
        expect(Array.isArray(list)).toBe(true);
    });

    test("should reject invalid pagination", async () => {
        const response = await request(app)
            .get("/products?page=abc");

        expect(response.statusCode).toBe(400);
    });

    test("should respect pagination limit", async () => {
        const response = await request(app)
            .get("/products?page=1&limit=10");

        expect(response.statusCode).toBe(200);
        const list = response.body.products || response.body;
        expect(list.length).toBeLessThanOrEqual(10);
    });

    test("should reject limit greater than 50", async () => {
        const response = await request(app)
            .get("/products?limit=51");

        expect(response.statusCode).toBe(400);
    });
});

describe("GET /products/:id", () => {
    test("should return a product", async () => {
        const response = await request(app)
            .get("/products/1");

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBe(1);
    });

    test("should return 404 for nonexistent product", async () => {
        const response = await request(app)
            .get("/products/999999");

        expect(response.statusCode).toBe(404);
    });
});