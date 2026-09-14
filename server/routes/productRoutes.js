const express = require("express");

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.post("/products", authMiddleware, requireAdmin, createProduct);
router.patch("/products/:id", authMiddleware, requireAdmin, updateProduct);
router.delete("/products/:id", authMiddleware, requireAdmin, deleteProduct);

module.exports = router;