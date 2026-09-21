const express = require("express");

const {
    getCart,
    addCartItem,
    updateCartItem,
    deleteCartItem
} = require("../controllers/cartController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/cart", authMiddleware, getCart);

router.post("/cart/items", authMiddleware, addCartItem);

router.patch("/cart/items/:id", authMiddleware, updateCartItem);

router.delete("/cart/items/:id", authMiddleware, deleteCartItem);

module.exports = router;