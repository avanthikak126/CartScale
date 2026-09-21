const { request, app, login } = require("./helpers");

describe("Cart API", () => {
    let token;

    beforeAll(async () => {
        token = await login();
    });

    test("should get the user's cart", async () => {
        const response = await request(app)
            .get("/cart")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("items");
        expect(Array.isArray(response.body.items)).toBe(true);
    });

    test("should reject request without token", async () => {
        const response = await request(app)
            .get("/cart");

        expect(response.statusCode).toBe(401);
    });
});
