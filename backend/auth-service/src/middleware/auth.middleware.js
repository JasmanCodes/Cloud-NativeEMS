const { verifyAccessToken } = require("../utils/token");

/**
 * Express middleware to authenticate requests using JWT Access Tokens.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access Token is required"
        });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired Access Token"
        });
    }

    req.user = decoded; // Attach user info (id, role) to request
    next();
};

module.exports = authenticateToken;
