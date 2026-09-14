const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct
} = require("../controllers/productController");

const router = express.Router();

router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.post("/products", authMiddleware, requireAdmin, createProduct);
router.patch("/products/:id", authMiddleware, requireAdmin, updateProduct);
module.exports = router;