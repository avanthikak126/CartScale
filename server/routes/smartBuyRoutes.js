const express = require("express");
const {
  getRecommendations,
  getBundle,
  parseQuery
} = require("../controllers/smartBuyController");

const router = express.Router();

router.post("/smartbuy/recommend", getRecommendations);
router.post("/smartbuy/bundle", getBundle);
router.post("/smartbuy/parse", parseQuery);

module.exports = router;
