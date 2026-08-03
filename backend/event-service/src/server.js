require("dotenv").config();

const app = require("./app");
const PORT = process.env.PORT || 5001;

const checkConnection = require("./config/checkConnection");
checkConnection();

app.listen(PORT, () => {
    console.log(`Event Service running on port ${PORT}`);
});
