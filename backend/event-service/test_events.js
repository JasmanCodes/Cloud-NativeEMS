const { Pool } = require("pg");
require("dotenv").config();

const AUTH_URL = "http://localhost:5000/api/auth";
const EVENT_URL = "http://localhost:5001/api/events";

// Setup database connection for role elevation in test
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const testEvents = async () => {
    const timestamp = Date.now();
    const organizerUser = {
        name: "Test Organizer",
        email: `organizer_${timestamp}@example.com`,
        password: "organizerPassword"
    };

    const regularUser = {
        name: "Regular User",
        email: `regular_${timestamp}@example.com`,
        password: "regularPassword"
    };

    console.log("=== STARTING EVENT MICROSERVICE TESTS ===");

    let organizerToken = "";
    let regularToken = "";
    let eventId = null;

    try {
        // 1. Register organizer on auth-service
        console.log("\n[1] Registering organizer on Auth Service...");
        let res = await fetch(`${AUTH_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(organizerUser)
        });
        let data = await res.json();
        console.log("Signup status:", res.status);
        if (res.status !== 201) throw new Error("Organizer signup failed");
        const organizerId = data.user.id;

        // 2. Elevate role in database
        console.log(`[2] Elevating user ID ${organizerId} to 'organizer' in DB...`);
        await pool.query("UPDATE users SET role = 'organizer' WHERE id = $1", [organizerId]);
        console.log("Role elevated successfully!");

        // 3. Login organizer on auth-service
        console.log("[3] Logging in organizer...");
        res = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: organizerUser.email, password: organizerUser.password })
        });
        data = await res.json();
        console.log("Login status:", res.status);
        organizerToken = data.accessToken;
        console.log("Organizer role in login response:", data.user.role);

        // 4. Register and Login a regular user
        console.log("\n[4] Registering & logging in regular user...");
        res = await fetch(`${AUTH_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(regularUser)
        });
        if (res.status !== 201) throw new Error("Regular user signup failed");

        res = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: regularUser.email, password: regularUser.password })
        });
        data = await res.json();
        regularToken = data.accessToken;

        // 5. Test Event Creation (should succeed with organizer token)
        console.log("\n[5] Testing Event Creation (Organizer)...");
        const eventPayload = {
            title: "Startup Hackathon 2026",
            description: "Build a startup microservices app in 48 hours.",
            date: "2026-09-15",
            time: "09:00:00",
            location: "San Francisco, CA",
            category: "Tech",
            capacity: 100
        };

        res = await fetch(`${EVENT_URL}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${organizerToken}`
            },
            body: JSON.stringify(eventPayload)
        });
        data = await res.json();
        console.log("Create event status:", res.status);
        console.log("Event details:", JSON.stringify(data.event));
        if (res.status !== 201) throw new Error("Event creation failed");
        eventId = data.event.id;

        // 6. Test Event Creation (should fail with regular user token)
        console.log("\n[6] Testing Event Creation with regular user token (should fail)...");
        res = await fetch(`${EVENT_URL}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${regularToken}`
            },
            body: JSON.stringify(eventPayload)
        });
        data = await res.json();
        console.log("Create event (user) status:", res.status);
        console.log("Response:", JSON.stringify(data));
        if (res.status === 201) throw new Error("Event creation by regular user should have failed");

        // 7. Get All Events (Public)
        console.log("\n[7] Testing Get All Events (Public)...");
        res = await fetch(`${EVENT_URL}`);
        data = await res.json();
        console.log("Get all events status:", res.status);
        console.log("Total events listed:", data.count);

        // 8. Get Event By ID (Public)
        console.log("\n[8] Testing Get Event By ID...");
        res = await fetch(`${EVENT_URL}/${eventId}`);
        data = await res.json();
        console.log("Get event by ID status:", res.status);
        console.log("Retrieved Event Title:", data.event.title);

        // 9. Update Event (Organizer - should succeed)
        console.log("\n[9] Testing Update Event (Organizer)...");
        const updatePayload = {
            ...eventPayload,
            title: "Global Startup Hackathon 2026",
            capacity: 150
        };
        res = await fetch(`${EVENT_URL}/${eventId}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${organizerToken}`
            },
            body: JSON.stringify(updatePayload)
        });
        data = await res.json();
        console.log("Update status:", res.status);
        console.log("Updated title:", data.event.title);
        console.log("Updated capacity:", data.event.capacity);
        if (res.status !== 200) throw new Error("Event update failed");

        // 10. Update Event (Regular User - should fail)
        console.log("\n[10] Testing Update Event by other user (should fail)...");
        res = await fetch(`${EVENT_URL}/${eventId}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${regularToken}`
            },
            body: JSON.stringify(updatePayload)
        });
        data = await res.json();
        console.log("Update event (user) status:", res.status);
        console.log("Response:", JSON.stringify(data));
        if (res.status === 200) throw new Error("Update by non-organizer should have failed");

        // 11. Delete Event (Regular User - should fail)
        console.log("\n[11] Testing Delete Event by non-organizer (should fail)...");
        res = await fetch(`${EVENT_URL}/${eventId}`, {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${regularToken}`
            }
        });
        data = await res.json();
        console.log("Delete status (user):", res.status);
        if (res.status === 200) throw new Error("Delete by non-organizer should have failed");

        // 12. Delete Event (Organizer - should succeed)
        console.log("\n[12] Testing Delete Event (Organizer)...");
        res = await fetch(`${EVENT_URL}/${eventId}`, {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${organizerToken}`
            }
        });
        data = await res.json();
        console.log("Delete status (organizer):", res.status);
        if (res.status !== 200) throw new Error("Delete event failed");

        // 13. Verify event is gone
        console.log("\n[13] Verifying event is deleted...");
        res = await fetch(`${EVENT_URL}/${eventId}`);
        console.log("Get deleted event status:", res.status);
        if (res.status !== 404) throw new Error("Event was not deleted successfully");

        console.log("\n=== ALL EVENT ENDPOINT TESTS PASSED SUCCESSFULLY! ===");

    } catch (error) {
        console.error("Test failed with error:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

testEvents();
