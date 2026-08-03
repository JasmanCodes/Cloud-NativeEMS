require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`- Auth Service target: ${process.env.AUTH_SERVICE_URL}`);
    console.log(`- Event Service target: ${process.env.EVENT_SERVICE_URL}`);
    console.log(`- Registration Service target: ${process.env.REGISTRATION_SERVICE_URL}`);
    console.log(`- Analytics Service target: ${process.env.ANALYTICS_SERVICE_URL}`);
});
