const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(cors());

// Health route for the Gateway itself
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "API Gateway"
    });
});

// Proxy definitions with path rewriting to preserve routing prefixes
app.use(
    "/api/auth",
    createProxyMiddleware({
        target: process.env.AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            return path.startsWith("/api/auth") ? path : `/api/auth${path}`;
        }
    })
);

app.use(
    "/api/events",
    createProxyMiddleware({
        target: process.env.EVENT_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            return path.startsWith("/api/events") ? path : `/api/events${path}`;
        }
    })
);

app.use(
    "/api/registrations",
    createProxyMiddleware({
        target: process.env.REGISTRATION_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            return path.startsWith("/api/registrations") ? path : `/api/registrations${path}`;
        }
    })
);

app.use(
    "/api/analytics",
    createProxyMiddleware({
        target: process.env.ANALYTICS_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            return path.startsWith("/api/analytics") ? path : `/api/analytics${path}`;
        }
    })
);

module.exports = app;
