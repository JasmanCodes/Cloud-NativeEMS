const testPost = async () => {
    const payload = {
        name: "Test Proxy User",
        email: `proxy_user_${Date.now()}@example.com`,
        password: "securePassword"
    };

    const targets = [
        { name: "Direct Auth Service", url: "http://localhost:5000/api/auth/signup" },
        { name: "Proxied Gateway", url: "http://localhost:8000/api/auth/signup" }
    ];

    for (const target of targets) {
        try {
            console.log(`\n=== Testing ${target.name} ===`);
            const res = await fetch(target.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            console.log(`Status: ${res.status}`);
            const text = await res.text();
            console.log(`Response length: ${text.length}`);
            console.log(`Response: ${text.substring(0, 500)}`);
        } catch (err) {
            console.error(`Error on ${target.name}:`, err.message);
        }
    }
};

testPost();
