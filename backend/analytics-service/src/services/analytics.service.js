const pool = require("../config/db");

/**
 * Aggregates overall platform metrics.
 */
const getPlatformSummary = async () => {
    const usersCountQuery = "SELECT COUNT(*) FROM users";
    const eventsCountQuery = "SELECT COUNT(*) FROM events";
    const activeBookingsQuery = "SELECT COUNT(*) FROM registrations WHERE status = 'registered'";
    const cancelledBookingsQuery = "SELECT COUNT(*) FROM registrations WHERE status = 'cancelled'";

    const [usersRes, eventsRes, activeRes, cancelledRes] = await Promise.all([
        pool.query(usersCountQuery),
        pool.query(eventsCountQuery),
        pool.query(activeBookingsQuery),
        pool.query(cancelledBookingsQuery)
    ]);

    const totalUsers = parseInt(usersRes.rows[0].count, 10);
    const totalEvents = parseInt(eventsRes.rows[0].count, 10);
    const totalBookings = parseInt(activeRes.rows[0].count, 10);
    const totalCancelled = parseInt(cancelledRes.rows[0].count, 10);

    // Monetization Model:
    // $15.00 hosting fee per published event
    // $2.50 platform commission per active seat registration
    const platformRevenue = (totalEvents * 15) + (totalBookings * 2.50);

    return {
        totalUsers,
        totalEvents,
        totalBookings,
        totalCancelled,
        platformRevenue
    };
};

/**
 * Returns list of popular events ranked by attendee registrations.
 */
const getPopularEvents = async (limit = 5) => {
    const query = `
        SELECT e.id, e.title, e.date, e.location, e.capacity, e.category, 
               COUNT(r.id) FILTER (WHERE r.status = 'registered') as active_bookings
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id
        GROUP BY e.id
        ORDER BY active_bookings DESC, e.date ASC
        LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows.map(row => ({
        ...row,
        active_bookings: parseInt(row.active_bookings, 10)
    }));
};

/**
 * Returns count of events categorized by field.
 */
const getCategoryDistribution = async () => {
    const query = `
        SELECT category, COUNT(*) as event_count
        FROM events
        GROUP BY category
        ORDER BY event_count DESC
    `;
    const result = await pool.query(query);
    return result.rows.map(row => ({
        category: row.category,
        eventCount: parseInt(row.event_count, 10)
    }));
};

module.exports = {
    getPlatformSummary,
    getPopularEvents,
    getCategoryDistribution
};
