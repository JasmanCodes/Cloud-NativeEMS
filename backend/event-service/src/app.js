const express = require("express");
const cors = require("cors");

const app = express();
const healthRoutes = require("./routes/health.routes");
const eventRoutes = require("./routes/event.routes");

app.use(cors());
app.use(express.json());

app.use("/", healthRoutes);
app.use("/api/events", eventRoutes);

module.exports = app;
