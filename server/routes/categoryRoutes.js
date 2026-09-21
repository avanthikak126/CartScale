const express = require("express");

const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/categories", getCategories);
router.get("/categories/:id", getCategoryById);

router.post(
    "/categories",
    authMiddleware,
    requireAdmin,
    createCategory
);

router.patch(
    "/categories/:id",
    authMiddleware,
    requireAdmin,
    updateCategory
);

router.delete(
    "/categories/:id",
    authMiddleware,
    requireAdmin,
    deleteCategory
);

module.exports = router;