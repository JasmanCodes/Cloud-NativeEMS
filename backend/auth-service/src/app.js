const express = require("express");


const app = express();
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");

app.use(express.json());

app.use("/", healthRoutes);
app.use("/api/auth", authRoutes);


module.exports = app;