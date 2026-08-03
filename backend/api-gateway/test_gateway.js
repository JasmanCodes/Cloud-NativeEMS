const { Pool } = require("pg");
require("dotenv").config();

// Direct connection to database to manage roles and cleanup in the test
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const GATEWAY_URL = "http://localhost:8000/api";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const testGatewayFlow = async () => {
    const timestamp = Date.now();
    const adminUser = {
        name: "Platform Admin",
        email: `admin_${timestamp}@example.com`,
        password: "adminSecurePassword"
    };

    const attendeeUser = {
        name: "Normal Attendee",
        email: `attendee_${timestamp}@example.com`,
        password: "attendeePassword"
    };

    console.log("=== STARTING API GATEWAY & ANALYTICS INTEGRATION TESTS ===");
    console.log("Testing via Gateway URL:", GATEWAY_URL);

    let adminToken = "";
    let attendeeToken = "";
    let eventId = null;

    try {
        // 1. Signup admin via Gateway
        console.log("\n[1] Registering Admin via Gateway...");
        let res = await fetch(`${GATEWAY_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(adminUser)
        });
        let data = await res.json();
        console.log("Signup status:", res.status);
        if (res.status !== 201) throw new Error("Admin registration failed");
        const adminId = data.user.id;

        // 2. Elevate to admin role in database
        console.log(`[2] Elevating user ID ${adminId} to 'admin' in database...`);
        await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminId]);

        // 3. Login Admin via Gateway
        console.log("[3] Logging in Admin via Gateway...");
        res = await fetch(`${GATEWAY_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: adminUser.email, password: adminUser.password })
        });
        data = await res.json();
        adminToken = data.accessToken;
        console.log("Admin logged in. Role:", data.user.role);

        // 4. Signup/Login normal user via Gateway
        console.log("\n[4] Registering & logging in Attendee via Gateway...");
        res = await fetch(`${GATEWAY_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(attendeeUser)
        });
        const attendeeId = (await res.json()).user.id;

        res = await fetch(`${GATEWAY_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: attendeeUser.email, password: attendeeUser.password })
        });
        attendeeToken = (await res.json()).accessToken;

        // 5. Create an Event via Gateway (Admin role)
        console.log("\n[5] Creating an Event via Gateway (Admin)...");
        res = await fetch(`${GATEWAY_URL}/events`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: "Gateway Integration Summit 2026",
                description: "Validating routing and analytics in a microservices cluster.",
                date: "2026-11-20",
                time: "14:00:00",
                location: "Virtual - Zoom",
                category: "Networking",
                capacity: 50
            })
        });
        data = await res.json();
        console.log("Create event status:", res.status);
        if (res.status !== 201) throw new Error("Event creation failed");
        eventId = data.event.id;

        // 6. Register Attendee to Event via Gateway
        console.log("\n[6] Registering Attendee for the Event via Gateway...");
        res = await fetch(`${GATEWAY_URL}/registrations/book`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${attendeeToken}`
            },
            body: JSON.stringify({ eventId })
        });
        console.log("Book event status:", res.status);
        if (res.status !== 201) throw new Error("Booking failed");

        // 7. Verify outbox processing (waiting briefly)
        console.log("\n[7] Waiting for outbox poller...");
        await wait(3500);

        // 8. Test Analytics Service via Gateway (Admin only)
        console.log("\n[8] Querying Analytics Service via Gateway (Admin Token)...");
        res = await fetch(`${GATEWAY_URL}/analytics/summary`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${adminToken}` }
        });
        data = await res.json();
        console.log("Summary API status:", res.status);
        console.log("Summary Metrics:", JSON.stringify(data.summary));
        if (res.status !== 200) throw new Error("Analytics summary request failed");

        console.log("\nQuerying Popular Events via Gateway...");
        res = await fetch(`${GATEWAY_URL}/analytics/popular`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${adminToken}` }
        });
        data = await res.json();
        console.log("Popular events list:", JSON.stringify(data.events));

        console.log("\nQuerying Event Categories Distribution via Gateway...");
        res = await fetch(`${GATEWAY_URL}/analytics/categories`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${adminToken}` }
        });
        data = await res.json();
        console.log("Categories distribution:", JSON.stringify(data.categories));

        // 9. Verify regular user cannot access analytics (should return 403 Forbidden)
        console.log("\n[9] Querying Analytics Service with Attendee Token (should fail)...");
        res = await fetch(`${GATEWAY_URL}/analytics/summary`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${attendeeToken}` }
        });
        console.log("Attendee access status:", res.status);
        if (res.status === 200) throw new Error("Attendee should not have access to analytics summary");

        // 10. Clean up test records
        console.log("\n[10] Cleaning up test records from DB...");
        await pool.query("DELETE FROM events WHERE id = $1", [eventId]);
        await pool.query("DELETE FROM users WHERE id IN ($1, $2)", [adminId, attendeeId]);
        console.log("Cleanup complete!");

        console.log("\n=== ALL GATEWAY & ANALYTICS TESTS PASSED SUCCESSFULLY! ===");

    } catch (error) {
        console.error("Gateway integration test failed:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

testGatewayFlow();
