const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registration.controller");
const authMiddleware = require("../middleware/auth.middleware");

// All registration routes require authentication
router.post("/book", authMiddleware, registrationController.bookEvent);
router.post("/cancel", authMiddleware, registrationController.cancelEvent);
router.get("/my-bookings", authMiddleware, registrationController.getMyRegistrations);
router.get("/notifications", authMiddleware, registrationController.getMyNotifications);

module.exports = router;
