const express = require("express");


const app = express();
const healthRoutes = require("./routes/health.routes");

app.use(express.json());
app.use("/", healthRoutes);


module.exports = app;