const express = require("express");
const {
  getRecommendations
} = require("../controllers/smartBuyController");

const router = express.Router();

router.post("/smartbuy/recommend", getRecommendations);

module.exports = router;
