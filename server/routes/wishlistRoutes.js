const express = require("express");
const { getWishlist, addWishlistItem, removeWishlistItem, checkWishlistItem } = require("../controllers/wishlistController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/wishlist", authMiddleware, getWishlist);
router.post("/wishlist/items", authMiddleware, addWishlistItem);
router.delete("/wishlist/items/:product_id", authMiddleware, removeWishlistItem);
router.get("/wishlist/check/:product_id", authMiddleware, checkWishlistItem);

module.exports = router;
