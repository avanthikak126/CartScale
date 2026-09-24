import http from "k6/http";
import { check } from "k6";

export const options = {
    vus: 10,
    duration: "30s"
};

export default function () {
    const response = http.get(
    "http://localhost:3000/products?category_id=1&limit=50"
);
    check(response, {
        "status is 200": (r) => r.status === 200,
        "response is an array": (r) => Array.isArray(r.json())
    });
}
