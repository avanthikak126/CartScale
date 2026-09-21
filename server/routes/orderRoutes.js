const express = require("express");

const {
    createOrder,
    getOrders,
    getOrderById
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/orders", authMiddleware, createOrder);

router.get("/orders", authMiddleware, getOrders);

router.get("/orders/:id", authMiddleware, getOrderById);

module.exports = router;