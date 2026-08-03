const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

// Secure all analytics routes: Admin access only
router.use(authMiddleware, authorizeRoles(["admin"]));

router.get("/summary", analyticsController.getSummary);
router.get("/popular", analyticsController.getPopular);
router.get("/categories", analyticsController.getCategories);

module.exports = router;
