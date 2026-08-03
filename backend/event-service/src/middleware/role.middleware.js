/**
 * Express middleware to restrict route access by user roles in event-service.
 * @param {string[]} allowedRoles - List of roles permitted to access the route
 */
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User credentials missing"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to access this resource"
            });
        }

        next();
    };
};

module.exports = authorizeRoles;
