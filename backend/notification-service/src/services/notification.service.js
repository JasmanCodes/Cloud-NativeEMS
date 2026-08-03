const pool = require("../config/db");

/**
 * Resolves user name, email, and event title for logging pretty email simulations.
 */
const resolveNotificationDetails = async (userId, eventId) => {
    try {
        const userQuery = "SELECT name, email FROM users WHERE id = $1";
        const eventQuery = "SELECT title FROM events WHERE id = $1";

        const userRes = await pool.query(userQuery, [userId]);
        const eventRes = await pool.query(eventQuery, [eventId]);

        return {
            userName: userRes.rows[0]?.name || "User",
            userEmail: userRes.rows[0]?.email || "unknown@example.com",
            eventTitle: eventRes.rows[0]?.title || "Event"
        };
    } catch (error) {
        console.error("Error resolving notification details:", error.message);
        return {
            userName: "User",
            userEmail: "unknown@example.com",
            eventTitle: "Event"
        };
    }
};

/**
 * Formats and logs the notification to simulate an email service.
 */
const sendNotification = async (eventType, payload) => {
    const { user_id, event_id } = payload;
    const details = await resolveNotificationDetails(user_id, event_id);

    console.log("\n==================================================");
    if (eventType === "registration.created") {
        console.log(`✉️  [SIMULATED EMAIL SENT]`);
        console.log(`📬  To: ${details.userName} <${details.userEmail}>`);
        console.log(`📝  Subject: Booking Confirmed! - ${details.eventTitle}`);
        console.log(`--------------------------------------------------`);
        console.log(`Hi ${details.userName},`);
        console.log(`Your booking for "${details.eventTitle}" is successfully confirmed.`);
        console.log(`We look forward to seeing you there!`);
    } else if (eventType === "registration.cancelled") {
        console.log(`✉️  [SIMULATED EMAIL SENT]`);
        console.log(`📬  To: ${details.userName} <${details.userEmail}>`);
        console.log(`📝  Subject: Booking Cancelled - ${details.eventTitle}`);
        console.log(`--------------------------------------------------`);
        console.log(`Hi ${details.userName},`);
        console.log(`Your booking for "${details.eventTitle}" has been cancelled.`);
        console.log(`If this was a mistake, you can re-register anytime before capacity is full.`);
    }
    console.log("==================================================\n");
};

module.exports = {
    sendNotification
};
