const pool = require("../config/db");

/**
 * Service to create a new event.
 */
const createEvent = async (eventData, organizerId) => {
    const { title, description, date, time, location, category, capacity } = eventData;
    const query = `
        INSERT INTO events (title, description, date, time, location, category, capacity, organizer_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const result = await pool.query(query, [
        title,
        description,
        date,
        time,
        location,
        category,
        capacity,
        organizerId
    ]);
    return result.rows[0];
};

/**
 * Service to search/retrieve events with dynamic filters.
 */
const getEvents = async (filters = {}) => {
    let query = "SELECT * FROM events";
    const values = [];
    const conditions = [];

    if (filters.date) {
        values.push(filters.date);
        conditions.push(`date = $${values.length}`);
    }
    if (filters.location) {
        values.push(`%${filters.location}%`);
        conditions.push(`location ILIKE $${values.length}`);
    }
    if (filters.category) {
        values.push(filters.category);
        conditions.push(`category = $${values.length}`);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY date ASC, time ASC";

    const result = await pool.query(query, values);
    return result.rows;
};

/**
 * Service to retrieve a single event by ID.
 */
const getEventById = async (id) => {
    const query = "SELECT * FROM events WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

/**
 * Service to update an event.
 */
const updateEvent = async (id, eventData) => {
    const { title, description, date, time, location, category, capacity } = eventData;
    const query = `
        UPDATE events
        SET title = $1, description = $2, date = $3, time = $4, location = $5, category = $6, capacity = $7
        WHERE id = $8
        RETURNING *
    `;
    const result = await pool.query(query, [
        title,
        description,
        date,
        time,
        location,
        category,
        capacity,
        id
    ]);
    return result.rows[0];
};

/**
 * Service to delete an event.
 */
const deleteEvent = async (id) => {
    const query = "DELETE FROM events WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
};
