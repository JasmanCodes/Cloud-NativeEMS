const registrationService = require("../services/registration.service");

/**
 * Register/Book a seat at an event.
 */
const bookEvent = async (req, res) => {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required"
            });
        }

        // 1. Verify event exists
        const event = await registrationService.getEventDetails(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // 2. Check if user is already actively registered
        const existingBooking = await registrationService.findActiveRegistration(req.user.id, eventId);
        if (existingBooking) {
            return res.status(409).json({
                success: false,
                message: "You have already registered for this event"
            });
        }

        // 3. Verify event capacity
        const currentBookingsCount = await registrationService.getRegistrationCount(eventId);
        if (currentBookingsCount >= event.capacity) {
            return res.status(400).json({
                success: false,
                message: "Event capacity is full. Registration is closed"
            });
        }

        // 4. Create Booking
        const registration = await registrationService.createRegistration(req.user.id, eventId);

        return res.status(201).json({
            success: true,
            message: "Successfully registered for the event",
            registration
        });

    } catch (error) {
        console.error("Book event error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

/**
 * Cancel registration for an event.
 */
const cancelEvent = async (req, res) => {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required"
            });
        }

        const registration = await registrationService.cancelRegistration(req.user.id, eventId);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "No active registration found for this event"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event registration cancelled successfully",
            registration
        });

    } catch (error) {
        console.error("Cancel booking error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

/**
 * Get active registrations for the logged in user.
 */
const getMyRegistrations = async (req, res) => {
    try {
        const bookings = await registrationService.getUserRegistrations(req.user.id);

        return res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error("Get my registrations error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

/**
 * Get notification log list for the logged in user.
 */
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await registrationService.getUserNotifications(req.user.id);
        return res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        console.error("Get my notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    bookEvent,
    cancelEvent,
    getMyRegistrations,
    getMyNotifications
};
