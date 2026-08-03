const jwt = require("jsonwebtoken");

/**
 * Express middleware to authenticate requests in registration-service.
 * Decodes the user JWT and attaches it to the request.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access Token is required"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded; // Attach { id, role } to the request
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired Access Token"
        });
    }
};

module.exports = authenticateToken;
