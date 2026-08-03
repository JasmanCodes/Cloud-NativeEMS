const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;