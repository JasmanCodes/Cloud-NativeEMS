const express = require("express");
const router = express.Router();

const eventController = require("../controllers/event.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

// Public routes
router.get("/", eventController.getAll);
router.get("/:id", eventController.getById);

// Protected routes (Any logged-in user with appropriate role can create)
router.post("/", authMiddleware, authorizeRoles(["admin", "organizer"]), eventController.create);

// Protected routes (Controller handles ownership checks)
router.put("/:id", authMiddleware, eventController.update);
router.delete("/:id", authMiddleware, eventController.remove);

module.exports = router;
