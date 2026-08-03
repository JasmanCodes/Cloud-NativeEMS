require("dotenv").config();

const app = require("./app");
const PORT = process.env.PORT || 5002;

const checkConnection = require("./config/checkConnection");
checkConnection();

app.listen(PORT, () => {
    console.log(`Registration Service running on port ${PORT}`);
});
