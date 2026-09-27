const express = require("express");

const {
    createPaymentOrder,
    verifyPayment
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/payments/create-order",
    authMiddleware,
    createPaymentOrder
);

router.post(
    "/payments/verify",
    authMiddleware,
    verifyPayment
);

module.exports = router;