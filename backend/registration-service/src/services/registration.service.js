const pool = require("../config/db");

/**
 * Fetch detailed event information from the shared database.
 */
const getEventDetails = async (eventId) => {
    const query = "SELECT id, title, capacity FROM events WHERE id = $1";
    const result = await pool.query(query, [eventId]);
    return result.rows[0];
};

/**
 * Count active registrations for an event.
 */
const getRegistrationCount = async (eventId) => {
    const query = "SELECT COUNT(*) FROM registrations WHERE event_id = $1 AND status = 'registered'";
    const result = await pool.query(query, [eventId]);
    return parseInt(result.rows[0].count, 10);
};

/**
 * Find an active registration for a user on a specific event.
 */
const findActiveRegistration = async (userId, eventId) => {
    const query = "SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2 AND status = 'registered'";
    const result = await pool.query(query, [userId, eventId]);
    return result.rows[0];
};

/**
 * Atomic Transaction to register a user for an event and post an Outbox message.
 */
const createRegistration = async (userId, eventId) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Insert Registration (or upsert if previously cancelled)
        const regQuery = `
            INSERT INTO registrations (user_id, event_id, status)
            VALUES ($1, $2, 'registered')
            ON CONFLICT (user_id, event_id) 
            DO UPDATE SET status = 'registered', registered_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const regResult = await client.query(regQuery, [userId, eventId]);
        const registration = regResult.rows[0];

        // 2. Insert Outbox Message
        const outboxQuery = `
            INSERT INTO outbox (event_type, payload)
            VALUES ($1, $2)
            RETURNING *
        `;
        const outboxPayload = {
            registration_id: registration.id,
            user_id: userId,
            event_id: eventId,
            timestamp: new Date().toISOString()
        };
        await client.query(outboxQuery, ["registration.created", JSON.stringify(outboxPayload)]);

        await client.query("COMMIT");
        return registration;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Atomic Transaction to cancel a registration and post an Outbox message.
 */
const cancelRegistration = async (userId, eventId) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Update status to 'cancelled'
        const regQuery = `
            UPDATE registrations
            SET status = 'cancelled'
            WHERE user_id = $1 AND event_id = $2 AND status = 'registered'
            RETURNING *
        `;
        const regResult = await client.query(regQuery, [userId, eventId]);
        const registration = regResult.rows[0];

        if (!registration) {
            await client.query("ROLLBACK");
            return null;
        }

        // 2. Insert Outbox Message
        const outboxQuery = `
            INSERT INTO outbox (event_type, payload)
            VALUES ($1, $2)
            RETURNING *
        `;
        const outboxPayload = {
            registration_id: registration.id,
            user_id: userId,
            event_id: eventId,
            timestamp: new Date().toISOString()
        };
        await client.query(outboxQuery, ["registration.cancelled", JSON.stringify(outboxPayload)]);

        await client.query("COMMIT");
        return registration;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Retrieve all active registrations for a user with event details joined.
 */
const getUserRegistrations = async (userId) => {
    const query = `
        SELECT r.id as registration_id, r.status, r.registered_at, 
               e.id as event_id, e.title, e.description, e.date, e.time, e.location, e.category
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = $1 AND r.status = 'registered'
        ORDER BY r.registered_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

/**
 * Retrieve all notification outbox events for a specific user.
 */
const getUserNotifications = async (userId) => {
    const query = `
        SELECT o.id, o.event_type, o.status, o.created_at, e.title as event_title
        FROM outbox o
        LEFT JOIN events e ON (o.payload::json->>'event_id')::int = e.id
        WHERE (o.payload::json->>'user_id')::int = $1
        ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

module.exports = {
    getEventDetails,
    getRegistrationCount,
    findActiveRegistration,
    createRegistration,
    cancelRegistration,
    getUserRegistrations,
    getUserNotifications
};
