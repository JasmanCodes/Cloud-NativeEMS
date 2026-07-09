require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

const checkConnection = require("./config/checkConnection");

checkConnection();

app.listen(PORT, () => {
    console.log(`Authentication Service running on port ${PORT}`);
});