require("dotenv").config();

const app = require("./app");
const PORT = process.env.PORT || 5003;

const checkConnection = require("./config/checkConnection");
checkConnection();

app.listen(PORT, () => {
    console.log(`Analytics Service running on port ${PORT}`);
});
