const { Pool } = require("pg");
require("dotenv").config();

const AUTH_URL = "http://localhost:5000/api/auth";
const EVENT_URL = "http://localhost:5001/api/events";
const REGISTRATION_URL = "http://localhost:5002/api/registrations";

// Setup database connection for verification and role elevation in test
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const testWorkflow = async () => {
    const timestamp = Date.now();
    const organizer = { name: "Test Organizer", email: `organizer_${timestamp}@example.com`, password: "securePassword" };
    const user1 = { name: "Attendee One", email: `user1_${timestamp}@example.com`, password: "securePassword" };
    const user2 = { name: "Attendee Two", email: `user2_${timestamp}@example.com`, password: "securePassword" };

    console.log("=== STARTING FULL END-TO-END SYSTEM TESTS ===");

    let organizerToken, user1Token, user2Token;
    let eventId;

    try {
        // 1. Sign up users
        console.log("\n[1] Registering users via Auth Service...");
        let res = await fetch(`${AUTH_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(organizer)
        });
        const organizerData = await res.json();
        const organizerId = organizerData.user.id;

        await fetch(`${AUTH_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user1)
        });
        await fetch(`${AUTH_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user2)
        });

        // 2. Elevate organizer role
        console.log(`[2] Elevating user ID ${organizerId} to 'organizer' in DB...`);
        await pool.query("UPDATE users SET role = 'organizer' WHERE id = $1", [organizerId]);

        // 3. Login users to get JWTs
        console.log("[3] Logging in users to obtain access tokens...");
        res = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: organizer.email, password: organizer.password })
        });
        organizerToken = (await res.json()).accessToken;

        res = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user1.email, password: user1.password })
        });
        user1Token = (await res.json()).accessToken;

        res = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user2.email, password: user2.password })
        });
        user2Token = (await res.json()).accessToken;

        // 4. Create an event with capacity = 1
        console.log("\n[4] Creating an event with capacity of 1 (Organizer)...");
        res = await fetch(`${EVENT_URL}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${organizerToken}`
            },
            body: JSON.stringify({
                title: "Exclusive Microservices Masterclass",
                description: "Deep dive for 1 person only.",
                date: "2026-10-10",
                time: "10:00:00",
                location: "New York, NY",
                category: "Tech",
                capacity: 1
            })
        });
        const eventData = await res.json();
        eventId = eventData.event.id;
        console.log(`Created Event ID: ${eventId}, Capacity: ${eventData.event.capacity}`);

        // 5. User 1 registers (Should succeed)
        console.log("\n[5] Attendee One registering (Should succeed)...");
        res = await fetch(`${REGISTRATION_URL}/book`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user1Token}`
            },
            body: JSON.stringify({ eventId })
        });
        data = await res.json();
        console.log("Attendee One booking status:", res.status);
        console.log("Response:", JSON.stringify(data));
        if (res.status !== 201) throw new Error("Attendee One registration failed");

        // 6. User 2 registers (Should fail - capacity exceeded)
        console.log("\n[6] Attendee Two registering (Should fail - capacity full)...");
        res = await fetch(`${REGISTRATION_URL}/book`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user2Token}`
            },
            body: JSON.stringify({ eventId })
        });
        data = await res.json();
        console.log("Attendee Two booking status:", res.status);
        console.log("Response:", JSON.stringify(data));
        if (res.status !== 400) throw new Error("Attendee Two registration should have been blocked");

        // 7. User 1 cancels registration (Should succeed)
        console.log("\n[7] Attendee One cancelling registration (Should succeed)...");
        res = await fetch(`${REGISTRATION_URL}/cancel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user1Token}`
            },
            body: JSON.stringify({ eventId })
        });
        data = await res.json();
        console.log("Attendee One cancellation status:", res.status);
        if (res.status !== 200) throw new Error("Attendee One cancellation failed");

        // 8. User 2 registers again (Should succeed now)
        console.log("\n[8] Attendee Two registering again (Should succeed now)...");
        res = await fetch(`${REGISTRATION_URL}/book`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user2Token}`
            },
            body: JSON.stringify({ eventId })
        });
        data = await res.json();
        console.log("Attendee Two booking status:", res.status);
        if (res.status !== 201) throw new Error("Attendee Two registration failed after capacity freed up");

        // 9. Fetch user 2's active registrations list
        console.log("\n[9] Checking Attendee Two active registrations list...");
        res = await fetch(`${REGISTRATION_URL}/my-bookings`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${user2Token}` }
        });
        data = await res.json();
        console.log("My bookings count:", data.count);
        console.log("First booking event title:", data.bookings[0]?.title);

        // 10. Wait and verify Outbox events are processed by Notification Service
        console.log("\n[10] Waiting 4 seconds for Notification Service to poll and process Outbox events...");
        await wait(4500);

        console.log("Verifying Outbox status in Database...");
        const outboxResult = await pool.query("SELECT id, event_type, status FROM outbox");
        console.table(outboxResult.rows);

        const unprocessedCount = outboxResult.rows.filter(row => row.status === 'pending').length;
        if (unprocessedCount > 0) {
            throw new Error("Notification Service did not process all outbox events");
        }
        console.log("All Outbox events successfully processed to status = 'processed'!");

        // 11. Cleanup test records
        console.log("\n[11] Cleaning up test records from DB...");
        await pool.query("DELETE FROM events WHERE id = $1", [eventId]);
        await pool.query("DELETE FROM users WHERE id IN ($1, $2, $3)", [organizerId, user1.id, user2.id]);
        console.log("Cleanup complete!");

        console.log("\n=== ALL E2E SYSTEM TESTS PASSED SUCCESSFULLY! ===");

    } catch (error) {
        console.error("Test failed with error:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

// Start script
testWorkflow();
