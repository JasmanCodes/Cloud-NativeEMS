const express = require("express");
const cors = require("cors");

const app = express();
const healthRoutes = require("./routes/health.routes");
const analyticsRoutes = require("./routes/analytics.routes");

app.use(cors());
app.use(express.json());

app.use("/", healthRoutes);
app.use("/api/analytics", analyticsRoutes);

module.exports = app;
