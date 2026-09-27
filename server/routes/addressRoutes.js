const express = require("express");

const {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress
} = require("../controllers/addressController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/addresses", authMiddleware, getAddresses);

router.post("/addresses", authMiddleware, createAddress);

router.patch("/addresses/:id", authMiddleware, updateAddress);

router.delete("/addresses/:id", authMiddleware, deleteAddress);

module.exports = router;
