const request = require("supertest");
const app = require("../server");

const login = async () => {
    const response = await request(app)
        .post("/login")
        .send({
            email: process.env.TEST_EMAIL,
            password: process.env.TEST_PASSWORD
        });

    return response.body.access_token;
};

module.exports = {
    request,
    app,
    login
};