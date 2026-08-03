const eventService = require("../services/event.service");

/**
 * Controller to handle event creation.
 */
const create = async (req, res) => {
    try {
        const { title, date, time, location, category, capacity } = req.body;

        // Input validation
        if (!title || !date || !time || !location || !category || capacity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Title, date, time, location, category, and capacity are required"
            });
        }

        const parsedCapacity = parseInt(capacity, 10);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be a positive integer"
            });
        }

        // Create event
        const event = await eventService.createEvent(req.body, req.user.id);

        return res.status(201).json({
            success: true,
            message: "Event created successfully",
            event
        });

    } catch (error) {
        console.error("Create event error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

/**
 * Controller to fetch all events with optional filters.
 */
const getAll = async (req, res) => {
    try {
        const { date, location, category } = req.query;
        const events = await eventService.getEvents({ date, location, category });

        return res.status(200).json({
            success: true,
            count: events.length,
            events
        });

    } catch (error) {
        console.error("Get events error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

/**
 * Controller to fetch single event details.
 */
const getById = async (req, res) => {
    try {
        const event = await eventService.getEventById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        return res.status(200).json({
            success: true,
            event
        });

    } catch (error) {
        console.error("Get event by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

/**
 * Controller to update an existing event.
 */
const update = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await eventService.getEventById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Authorization: only event organizer or admin can edit
        if (event.organizer_id !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are not authorized to update this event"
            });
        }

        // Input validation
        const { title, date, time, location, category, capacity } = req.body;
        if (!title || !date || !time || !location || !category || capacity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Title, date, time, location, category, and capacity are required"
            });
        }

        const parsedCapacity = parseInt(capacity, 10);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be a positive integer"
            });
        }

        const updatedEvent = await eventService.updateEvent(eventId, req.body);

        return res.status(200).json({
            success: true,
            message: "Event updated successfully",
            event: updatedEvent
        });

    } catch (error) {
        console.error("Update event error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

/**
 * Controller to delete an event.
 */
const remove = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await eventService.getEventById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Authorization: only event organizer or admin can delete
        if (event.organizer_id !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are not authorized to delete this event"
            });
        }

        await eventService.deleteEvent(eventId);

        return res.status(200).json({
            success: true,
            message: "Event deleted successfully"
        });

    } catch (error) {
        console.error("Delete event error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};
