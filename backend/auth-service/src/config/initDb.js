const fs = require("fs");
const path = require("path");
const pool = require("./db");

const initDatabase = async () => {
    try {
        console.log("Starting database initialization...");
        const schemaPath = path.join(__dirname, "schema.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf8");

        await pool.query(schemaSql);
        console.log("Database initialized successfully with schemas!");
        
        // Quick verification: check if tables exist
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Current Tables in database:", tablesResult.rows.map(row => row.table_name));

    } catch (error) {
        console.error("Database initialization failed:");
        console.error(error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

initDatabase();
