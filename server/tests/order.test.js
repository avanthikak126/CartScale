const { request, app, login } = require("./helpers");

describe("Order API", () => {
    let token;

    beforeAll(async () => {
        token = await login();
    });

    test("should create an order from the cart", async () => {
        await request(app)
            .post("/cart/items")
            .set("Authorization", `Bearer ${token}`)
            .send({
                product_id: 1,
                quantity: 1
            });

        const response = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("order_id");
        expect(response.body).toHaveProperty("total_amount");
    });

    test("should return user's orders", async () => {
        const response = await request(app)
            .get("/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("should reject checkout without authentication", async () => {
        const response = await request(app)
            .post("/orders");

        expect(response.statusCode).toBe(401);
    });
});