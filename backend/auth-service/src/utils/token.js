const jwt = require("jsonwebtoken");

/**
 * Generates a short-lived access token.
 * @param {object} user - User object containing id and role
 * @returns {string} JWT Access Token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }
    );
};

/**
 * Generates a long-lived refresh token.
 * @param {object} user - User object containing id
 * @returns {string} JWT Refresh Token
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY }
    );
};

/**
 * Verifies an access token.
 * @param {string} token - JWT Access Token
 * @returns {object|null} Decoded payload or null if invalid
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Verifies a refresh token.
 * @param {string} token - JWT Refresh Token
 * @returns {object|null} Decoded payload or null if invalid
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
