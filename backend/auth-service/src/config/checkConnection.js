const pool = require("./db");

const checkConnection = async () => {
    try {
        await pool.query("SELECT NOW()");
        console.log("Database Connected Successfully");
    } catch (error) {
        console.error("Database Connection Failed");
        console.error(error.message);
    }
};

module.exports = checkConnection;