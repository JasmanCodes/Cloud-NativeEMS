const analyticsService = require("../services/analytics.service");

/**
 * Controller to fetch platform aggregates dashboard overview.
 */
const getSummary = async (req, res) => {
    try {
        const summary = await analyticsService.getPlatformSummary();
        return res.status(200).json({
            success: true,
            summary
        });
    } catch (error) {
        console.error("Get summary analytics error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

/**
 * Controller to fetch top popular events.
 */
const getPopular = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 5;
        const events = await analyticsService.getPopularEvents(limit);
        return res.status(200).json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error("Get popular events analytics error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

/**
 * Controller to fetch category distribution stats.
 */
const getCategories = async (req, res) => {
    try {
        const categories = await analyticsService.getCategoryDistribution();
        return res.status(200).json({
            success: true,
            categories
        });
    } catch (error) {
        console.error("Get categories analytics error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    getSummary,
    getPopular,
    getCategories
};
