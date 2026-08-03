require("dotenv").config();
const pool = require("./config/db");
const notificationService = require("./services/notification.service");

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS, 10) || 3000;
let isPolling = false;

/**
 * Polls the outbox table for unprocessed events and publishes/logs them.
 */
const pollOutbox = async () => {
    if (isPolling) return; // Prevent overlapping execution
    isPolling = true;

    try {
        // Fetch up to 10 pending events
        const pendingResult = await pool.query(
            "SELECT * FROM outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT 10"
        );

        if (pendingResult.rows.length > 0) {
            console.log(`Processing ${pendingResult.rows.length} pending event(s) from outbox...`);

            for (const event of pendingResult.rows) {
                try {
                    // Send notification (logs simulation to console)
                    await notificationService.sendNotification(event.event_type, event.payload);

                    // Mark as processed in database
                    await pool.query(
                        "UPDATE outbox SET status = 'processed' WHERE id = $1",
                        [event.id]
                    );

                    console.log(`Successfully processed event ID ${event.id} (${event.event_type})`);
                } catch (eventError) {
                    console.error(`Failed to process event ID ${event.id}:`, eventError.message);
                }
            }
        }
    } catch (error) {
        console.error("Outbox poll error:", error.message);
    } finally {
        isPolling = false;
    }
};

// Start polling loop
console.log("Notification Service Outbox Poller active.");
console.log(`Polling intervals configured at ${POLL_INTERVAL_MS}ms.`);

setInterval(pollOutbox, POLL_INTERVAL_MS);
