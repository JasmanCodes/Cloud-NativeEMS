const express = require("express");
const cors = require("cors");

const app = express();
const healthRoutes = require("./routes/health.routes");
const registrationRoutes = require("./routes/registration.routes");

app.use(cors());
app.use(express.json());

app.use("/", healthRoutes);
app.use("/api/registrations", registrationRoutes);

module.exports = app;
